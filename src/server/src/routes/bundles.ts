import { Router, Request, Response } from 'express';
import { calculateLine } from '../services/estimateEngine';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const bundles = db.prepare('SELECT * FROM bundles ORDER BY bundleName').all();
  res.json(bundles);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const bundle = db.prepare('SELECT * FROM bundles WHERE id = ?').get(req.params.id);
  if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
  res.json(bundle);
});

router.get('/:id/items', (req: Request, res: Response) => {
  const db = (req as any).db;
  const items = db.prepare(`
    SELECT bi.*, ci.description, ci.baseMaterialCost, ci.baseLaborMinutes, ci.unit, ci.category
    FROM bundle_items bi
    JOIN catalog_items ci ON bi.catalogItemId = ci.id
    WHERE bi.bundleId = ?
    ORDER BY bi.sortOrder
  `).all(req.params.id);
  res.json(items);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { bundleKey, bundleName, category = '' } = req.body;
  const result = db.prepare(`
    INSERT INTO bundles (bundleKey, bundleName, category, active) VALUES (?, ?, ?, 1)
  `).run(bundleKey, bundleName, category);
  const bundle = db.prepare('SELECT * FROM bundles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(bundle);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { bundleKey, bundleName, category, active } = req.body;
  db.prepare(`
    UPDATE bundles SET bundleKey=?, bundleName=?, category=?, active=?, updatedAt=datetime('now') WHERE id=?
  `).run(bundleKey, bundleName, category, active ? 1 : 0, req.params.id);
  const bundle = db.prepare('SELECT * FROM bundles WHERE id = ?').get(req.params.id);
  res.json(bundle);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM bundles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/items', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { catalogItemId, variantId = null, sku = '', qty = 1, modifierKeys = '', sortOrder = 0, notes = '' } = req.body;
  const result = db.prepare(`
    INSERT INTO bundle_items (bundleId, catalogItemId, variantId, sku, qty, modifierKeys, sortOrder, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, catalogItemId, variantId, sku, qty, modifierKeys, sortOrder, notes);
  const item = db.prepare('SELECT * FROM bundle_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.delete('/items/:itemId', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM bundle_items WHERE id = ?').run(req.params.itemId);
  res.json({ success: true });
});

router.post('/apply', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { bundleId, projectId, roomId } = req.body;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const bundleItems = db.prepare(`
    SELECT bi.*, ci.description, ci.baseMaterialCost, ci.baseLaborMinutes, ci.unit, ci.category, ci.subcategory, ci.sku as catalogSku
    FROM bundle_items bi
    JOIN catalog_items ci ON bi.catalogItemId = ci.id
    WHERE bi.bundleId = ?
    ORDER BY bi.sortOrder
  `).all(bundleId) as any[];

  const created: any[] = [];
  for (const item of bundleItems) {
    const calc = calculateLine({
      qty: item.qty,
      baseMaterialCost: item.baseMaterialCost,
      baseLaborMinutes: item.baseLaborMinutes,
      laborBurdenPercent: project.laborBurdenPercent,
      overheadPercent: project.overheadPercent,
      profitPercent: project.profitPercent,
      taxPercent: project.taxPercent,
    });

    const result = db.prepare(`
      INSERT INTO takeoff_lines (projectId, roomId, sourceType, description, sku, category, subcategory, qty, unit, materialCost, laborMinutes, laborCost, unitSell, lineTotal, bundleId, catalogItemId, variantId)
      VALUES (?, ?, 'bundle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId, roomId, item.description, item.catalogSku, item.category, item.subcategory,
      item.qty, item.unit, calc.materialCost, calc.laborMinutes, calc.laborCost,
      calc.unitSell, calc.lineTotal, bundleId, item.catalogItemId, item.variantId
    );
    created.push(db.prepare('SELECT * FROM takeoff_lines WHERE id = ?').get(result.lastInsertRowid));
  }

  res.json({ success: true, linesCreated: created.length, lines: created });
});

export default router;
