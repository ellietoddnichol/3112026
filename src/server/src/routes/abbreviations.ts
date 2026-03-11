import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const abbreviations = db.prepare('SELECT * FROM abbreviations ORDER BY abbreviation').all();
  res.json(abbreviations);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { abbreviation, normalizedTerm, categoryHint = '', notes = '' } = req.body;
  const result = db.prepare(`
    INSERT INTO abbreviations (abbreviation, normalizedTerm, categoryHint, notes, active)
    VALUES (?, ?, ?, ?, 1)
  `).run(abbreviation, normalizedTerm, categoryHint, notes);
  const abbrev = db.prepare('SELECT * FROM abbreviations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(abbrev);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { abbreviation, normalizedTerm, categoryHint, notes, active } = req.body;
  db.prepare(`
    UPDATE abbreviations SET abbreviation=?, normalizedTerm=?, categoryHint=?, notes=?, active=?, updatedAt=datetime('now') WHERE id=?
  `).run(abbreviation, normalizedTerm, categoryHint, notes, active ? 1 : 0, req.params.id);
  const abbrev = db.prepare('SELECT * FROM abbreviations WHERE id = ?').get(req.params.id);
  res.json(abbrev);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM abbreviations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
