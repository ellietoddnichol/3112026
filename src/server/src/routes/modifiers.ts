import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const modifiers = db.prepare('SELECT * FROM modifiers ORDER BY modifierKey').all();
  res.json(modifiers);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { modifierKey, appliesToCategories = 'all', addLaborMinutes = 0, addMaterialCost = 0, percentLabor = 0, percentMaterial = 0 } = req.body;
  const result = db.prepare(`
    INSERT INTO modifiers (modifierKey, appliesToCategories, addLaborMinutes, addMaterialCost, percentLabor, percentMaterial, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(modifierKey, appliesToCategories, addLaborMinutes, addMaterialCost, percentLabor, percentMaterial);
  const modifier = db.prepare('SELECT * FROM modifiers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(modifier);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { modifierKey, appliesToCategories, addLaborMinutes, addMaterialCost, percentLabor, percentMaterial, active } = req.body;
  db.prepare(`
    UPDATE modifiers SET modifierKey=?, appliesToCategories=?, addLaborMinutes=?, addMaterialCost=?, percentLabor=?, percentMaterial=?, active=?, updatedAt=datetime('now') WHERE id=?
  `).run(modifierKey, appliesToCategories, addLaborMinutes, addMaterialCost, percentLabor, percentMaterial, active ? 1 : 0, req.params.id);
  const modifier = db.prepare('SELECT * FROM modifiers WHERE id = ?').get(req.params.id);
  res.json(modifier);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM modifiers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
