import { Router, Request, Response } from 'express';

const router = Router();

router.get('/categories', (req: Request, res: Response) => {
  const db = (req as any).db;
  const rows = db.prepare('SELECT DISTINCT category FROM catalog_items WHERE active = 1 ORDER BY category').all() as any[];
  res.json(rows.map((r: any) => r.category));
});

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { search, category, active } = req.query;
  let query = 'SELECT * FROM catalog_items WHERE 1=1';
  const params: any[] = [];
  if (active !== undefined) { query += ' AND active = ?'; params.push(active === 'true' ? 1 : 0); }
  else { query += ' AND active = 1'; }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) {
    query += ' AND (description LIKE ? OR sku LIKE ? OR manufacturer LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY category, sku';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const item = db.prepare('SELECT * FROM catalog_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.get('/:id/variants', (req: Request, res: Response) => {
  const db = (req as any).db;
  const variants = db.prepare('SELECT * FROM item_variants WHERE catalogItemId = ? AND active = 1').all(req.params.id);
  res.json(variants);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    sku, category, subcategory = '', family = '', description, manufacturer = '',
    model = '', unit = 'EA', baseMaterialCost = 0, baseLaborMinutes = 0,
    taxable = true, adaFlag = false, notes = ''
  } = req.body;
  const result = db.prepare(`
    INSERT INTO catalog_items (sku, category, subcategory, family, description, manufacturer, model, unit, baseMaterialCost, baseLaborMinutes, taxable, adaFlag, active, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(sku, category, subcategory, family, description, manufacturer, model, unit, baseMaterialCost, baseLaborMinutes, taxable ? 1 : 0, adaFlag ? 1 : 0, notes);
  const item = db.prepare('SELECT * FROM catalog_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    sku, category, subcategory, family, description, manufacturer, model,
    unit, baseMaterialCost, baseLaborMinutes, taxable, adaFlag, notes
  } = req.body;
  db.prepare(`
    UPDATE catalog_items SET sku=?, category=?, subcategory=?, family=?, description=?, manufacturer=?, model=?, unit=?, baseMaterialCost=?, baseLaborMinutes=?, taxable=?, adaFlag=?, notes=?, updatedAt=datetime('now') WHERE id=?
  `).run(sku, category, subcategory, family, description, manufacturer, model, unit, baseMaterialCost, baseLaborMinutes, taxable ? 1 : 0, adaFlag ? 1 : 0, notes, req.params.id);
  const item = db.prepare('SELECT * FROM catalog_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.patch('/:id/deactivate', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare("UPDATE catalog_items SET active=0, updatedAt=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/variants', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    finish = '', size = '', mountType = '', baseType = '', optionLabel,
    addMaterialCost = 0, addLaborMinutes = 0, percentLabor = 0, percentMaterial = 0
  } = req.body;
  const result = db.prepare(`
    INSERT INTO item_variants (catalogItemId, finish, size, mountType, baseType, optionLabel, addMaterialCost, addLaborMinutes, percentLabor, percentMaterial, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(req.params.id, finish, size, mountType, baseType, optionLabel, addMaterialCost, addLaborMinutes, percentLabor, percentMaterial);
  const variant = db.prepare('SELECT * FROM item_variants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(variant);
});

router.put('/variants/:variantId', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    finish, size, mountType, baseType, optionLabel,
    addMaterialCost, addLaborMinutes, percentLabor, percentMaterial, active
  } = req.body;
  db.prepare(`
    UPDATE item_variants SET finish=?, size=?, mountType=?, baseType=?, optionLabel=?, addMaterialCost=?, addLaborMinutes=?, percentLabor=?, percentMaterial=?, active=?, updatedAt=datetime('now') WHERE id=?
  `).run(finish, size, mountType, baseType, optionLabel, addMaterialCost, addLaborMinutes, percentLabor, percentMaterial, active ? 1 : 0, req.params.variantId);
  const variant = db.prepare('SELECT * FROM item_variants WHERE id = ?').get(req.params.variantId);
  res.json(variant);
});

export default router;
