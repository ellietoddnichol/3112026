import { Router, Request, Response } from 'express';
import { calculateLine } from '../services/estimateEngine';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { projectId, roomId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  let query = 'SELECT * FROM takeoff_lines WHERE projectId = ?';
  const params: any[] = [projectId];
  if (roomId) { query += ' AND roomId = ?'; params.push(roomId); }
  query += ' ORDER BY id';
  const lines = db.prepare(query).all(...params);
  res.json(lines);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.body.projectId) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const {
    projectId, roomId, description, sku = '', category = '', subcategory = '',
    baseType = 'surface', qty = 1, unit = 'EA', notes = '',
    bundleId = null, catalogItemId = null, variantId = null,
    sourceType = 'manual', sourceRef = '',
    baseMaterialCost = 0, baseLaborMinutes = 0
  } = req.body;

  const calc = calculateLine({
    qty,
    baseMaterialCost,
    baseLaborMinutes,
    laborBurdenPercent: project.laborBurdenPercent,
    overheadPercent: project.overheadPercent,
    profitPercent: project.profitPercent,
    taxPercent: project.taxPercent,
  });

  const result = db.prepare(`
    INSERT INTO takeoff_lines (projectId, roomId, sourceType, sourceRef, description, sku, category, subcategory, baseType, qty, unit, materialCost, laborMinutes, laborCost, unitSell, lineTotal, notes, bundleId, catalogItemId, variantId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId, roomId, sourceType, sourceRef, description, sku, category, subcategory,
    baseType, qty, unit, calc.materialCost, calc.laborMinutes, calc.laborCost,
    calc.unitSell, calc.lineTotal, notes, bundleId, catalogItemId, variantId
  );

  const line = db.prepare('SELECT * FROM takeoff_lines WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(line);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const line = db.prepare('SELECT * FROM takeoff_lines WHERE id = ?').get(req.params.id) as any;
  if (!line) return res.status(404).json({ error: 'Line not found' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(line.projectId) as any;

  const {
    description, sku, category, subcategory, baseType, qty, unit, notes,
    bundleId, catalogItemId, variantId, sourceType, sourceRef,
    baseMaterialCost = 0, baseLaborMinutes = 0
  } = req.body;

  const calc = calculateLine({
    qty,
    baseMaterialCost,
    baseLaborMinutes,
    laborBurdenPercent: project.laborBurdenPercent,
    overheadPercent: project.overheadPercent,
    profitPercent: project.profitPercent,
    taxPercent: project.taxPercent,
  });

  db.prepare(`
    UPDATE takeoff_lines SET description=?, sku=?, category=?, subcategory=?, baseType=?, qty=?, unit=?, materialCost=?, laborMinutes=?, laborCost=?, unitSell=?, lineTotal=?, notes=?, bundleId=?, catalogItemId=?, variantId=?, sourceType=?, sourceRef=?, updatedAt=datetime('now') WHERE id=?
  `).run(
    description, sku, category, subcategory, baseType, qty, unit,
    calc.materialCost, calc.laborMinutes, calc.laborCost, calc.unitSell, calc.lineTotal,
    notes, bundleId, catalogItemId, variantId, sourceType, sourceRef, req.params.id
  );

  const updated = db.prepare('SELECT * FROM takeoff_lines WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM takeoff_lines WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
