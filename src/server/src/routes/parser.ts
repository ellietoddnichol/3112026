import { Router, Request, Response } from 'express';
import { calculateLine } from '../services/estimateEngine';

const router = Router();

interface AbbreviationRow {
  abbreviation: string;
  normalizedTerm: string;
  categoryHint: string;
}

interface CatalogItemRow {
  id: number;
  sku: string;
  description: string;
  category: string;
  subcategory: string;
  unit: string;
  baseMaterialCost: number;
  baseLaborMinutes: number;
}

function parseQtyAndUnit(token: string): { qty: number; unit: string } | null {
  const m = token.match(/^(\d+\.?\d*)\s*([a-zA-Z]*)$/);
  if (m) return { qty: parseFloat(m[1]), unit: m[2].toUpperCase() || 'EA' };
  return null;
}

function normalizeText(text: string, abbreviations: AbbreviationRow[]): string {
  let normalized = text.toUpperCase();
  for (const abbrev of abbreviations) {
    const re = new RegExp(`\\b${abbrev.abbreviation}\\b`, 'gi');
    normalized = normalized.replace(re, abbrev.normalizedTerm.toUpperCase());
  }
  return normalized;
}

function matchCatalogItem(normalizedText: string, catalog: CatalogItemRow[]): { item: CatalogItemRow | null; confidence: number } {
  let best: CatalogItemRow | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    let score = 0;
    const descWords = item.description.toUpperCase().split(/\s+/);
    const textWords = normalizedText.split(/\s+/);

    for (const word of descWords) {
      if (word.length > 2 && textWords.some(tw => tw.includes(word) || word.includes(tw))) score++;
    }
    if (normalizedText.includes(item.sku.toUpperCase())) score += 10;
    if (normalizedText.includes(item.category.toUpperCase())) score += 3;

    const confidence = Math.min(score / Math.max(descWords.length, 1), 1.0);
    if (confidence > bestScore) {
      bestScore = confidence;
      best = item;
    }
  }

  return { item: best, confidence: bestScore };
}

function parseTakeoffText(text: string, abbreviations: AbbreviationRow[], catalog: CatalogItemRow[]) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const results = [];

  for (const rawLine of lines) {
    // Skip comment lines
    if (rawLine.startsWith('#') || rawLine.startsWith('//')) continue;

    const tokens = rawLine.split(/\s+/);
    let qty = 1;
    let unit = 'EA';

    // Try to find qty at start or end
    const firstToken = parseQtyAndUnit(tokens[0]);
    if (firstToken) {
      qty = firstToken.qty;
      unit = firstToken.unit || 'EA';
    }

    const lastToken = parseQtyAndUnit(tokens[tokens.length - 1]);
    if (!firstToken && lastToken) {
      qty = lastToken.qty;
      unit = lastToken.unit || 'EA';
    }

    const normalized = normalizeText(rawLine, abbreviations);
    const { item, confidence } = matchCatalogItem(normalized, catalog);

    results.push({
      rawText: rawLine,
      normalizedText: normalized,
      parsedQty: qty,
      parsedUnit: unit,
      matchedCatalogItemId: item?.id ?? null,
      matchedItem: item,
      confidenceScore: confidence,
      reviewStatus: confidence > 0.5 ? 'accepted' : 'pending',
    });
  }

  return results;
}

// List jobs
router.get('/jobs', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { projectId } = req.query;
  let query = 'SELECT * FROM parse_jobs ORDER BY createdAt DESC';
  const params: any[] = [];
  if (projectId) {
    query = 'SELECT * FROM parse_jobs WHERE projectId = ? ORDER BY createdAt DESC';
    params.push(projectId);
  }
  const jobs = db.prepare(query).all(...params);
  res.json(jobs);
});

router.get('/jobs/:jobId', (req: Request, res: Response) => {
  const db = (req as any).db;
  const job = db.prepare('SELECT * FROM parse_jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.get('/jobs/:jobId/lines', (req: Request, res: Response) => {
  const db = (req as any).db;
  const lines = db.prepare('SELECT * FROM parse_lines WHERE parseJobId = ? ORDER BY id').all(req.params.jobId);
  res.json(lines);
});

router.put('/lines/:lineId', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { normalizedText, parsedQty, parsedUnit, matchedCatalogItemId, matchedVariantId, reviewStatus, roomId, notes } = req.body;
  db.prepare(`
    UPDATE parse_lines SET normalizedText=?, parsedQty=?, parsedUnit=?, matchedCatalogItemId=?, matchedVariantId=?, reviewStatus=?, roomId=?, notes=?, updatedAt=datetime('now') WHERE id=?
  `).run(normalizedText, parsedQty, parsedUnit, matchedCatalogItemId, matchedVariantId, reviewStatus, roomId, notes, req.params.lineId);
  const line = db.prepare('SELECT * FROM parse_lines WHERE id = ?').get(req.params.lineId);
  res.json(line);
});

// Parse text input
router.post('/text', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { text, projectId = null, roomId = null } = req.body;

  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

  const jobResult = db.prepare(`
    INSERT INTO parse_jobs (projectId, roomId, sourceType, rawInput, status)
    VALUES (?, ?, 'text', ?, 'processing')
  `).run(projectId, roomId, text);

  const jobId = jobResult.lastInsertRowid;

  const abbreviations = db.prepare('SELECT * FROM abbreviations WHERE active = 1').all() as AbbreviationRow[];
  const catalog = db.prepare('SELECT * FROM catalog_items WHERE active = 1').all() as CatalogItemRow[];
  const parsed = parseTakeoffText(text, abbreviations, catalog);

  const insertLine = db.prepare(`
    INSERT INTO parse_lines (parseJobId, rawText, normalizedText, parsedQty, parsedUnit, matchedCatalogItemId, confidenceScore, reviewStatus, roomId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of parsed) {
    insertLine.run(jobId, p.rawText, p.normalizedText, p.parsedQty, p.parsedUnit, p.matchedCatalogItemId, p.confidenceScore, p.reviewStatus, roomId);
  }

  db.prepare("UPDATE parse_jobs SET status='review', updatedAt=datetime('now') WHERE id=?").run(jobId);

  const job = db.prepare('SELECT * FROM parse_jobs WHERE id = ?').get(jobId);
  const lines = db.prepare('SELECT * FROM parse_lines WHERE parseJobId = ? ORDER BY id').all(jobId);

  res.json({ job, lines });
});

// Finalize: convert parse_lines to takeoff_lines
router.post('/finalize', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId, projectId, roomId } = req.body;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const lines = db.prepare("SELECT * FROM parse_lines WHERE parseJobId = ? AND reviewStatus != 'rejected'").all(jobId) as any[];

  const created: any[] = [];
  for (const line of lines) {
    const targetRoomId = line.roomId || roomId;
    if (!targetRoomId) continue;

    let baseMaterialCost = 0;
    let baseLaborMinutes = 0;
    let description = line.normalizedText;
    let sku = '';
    let category = '';
    let subcategory = '';
    let unit = line.parsedUnit || 'EA';

    if (line.matchedCatalogItemId) {
      const item = db.prepare('SELECT * FROM catalog_items WHERE id = ?').get(line.matchedCatalogItemId) as any;
      if (item) {
        baseMaterialCost = item.baseMaterialCost;
        baseLaborMinutes = item.baseLaborMinutes;
        description = item.description;
        sku = item.sku;
        category = item.category;
        subcategory = item.subcategory;
        unit = item.unit;
      }
    }

    const calc = calculateLine({
      qty: line.parsedQty,
      baseMaterialCost,
      baseLaborMinutes,
      laborBurdenPercent: project.laborBurdenPercent,
      overheadPercent: project.overheadPercent,
      profitPercent: project.profitPercent,
      taxPercent: project.taxPercent,
    });

    const result = db.prepare(`
      INSERT INTO takeoff_lines (projectId, roomId, sourceType, sourceRef, description, sku, category, subcategory, qty, unit, materialCost, laborMinutes, laborCost, unitSell, lineTotal, catalogItemId)
      VALUES (?, ?, 'parsed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId, targetRoomId, `parse_job:${jobId}`, description, sku, category, subcategory,
      line.parsedQty, unit, calc.materialCost, calc.laborMinutes, calc.laborCost,
      calc.unitSell, calc.lineTotal, line.matchedCatalogItemId
    );
    created.push(db.prepare('SELECT * FROM takeoff_lines WHERE id = ?').get(result.lastInsertRowid));
  }

  db.prepare("UPDATE parse_jobs SET status='finalized', updatedAt=datetime('now') WHERE id=?").run(jobId);

  res.json({ success: true, linesCreated: created.length, lines: created });
});

export default router;
