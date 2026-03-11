import { Router, Request, Response } from 'express';
import { calculateProjectSummary } from '../services/estimateEngine';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const projects = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
  res.json(projects);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  const {
    projectNumber, projectName, clientName = '', estimator = '',
    bidDate = '', dueDate = '', address = '', projectType = '',
    projectSize = 'medium', floorLevel = 'ground', accessDifficulty = 'standard',
    installHeight = 'standard', materialHandling = 'standard', wallSubstrate = 'drywall', notes = ''
  } = req.body;
  const result = db.prepare(`
    INSERT INTO projects (projectNumber, projectName, clientName, estimator, bidDate, dueDate, address, projectType, projectSize, floorLevel, accessDifficulty, installHeight, materialHandling, wallSubstrate, laborBurdenPercent, overheadPercent, profitPercent, taxPercent, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectNumber, projectName, clientName, estimator, bidDate, dueDate, address, projectType,
    projectSize, floorLevel, accessDifficulty, installHeight, materialHandling, wallSubstrate,
    settings?.defaultLaborBurdenPercent ?? 35,
    settings?.defaultOverheadPercent ?? 10,
    settings?.defaultProfitPercent ?? 12,
    settings?.defaultTaxPercent ?? 8,
    notes
  );
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    projectNumber, projectName, clientName, estimator, bidDate, dueDate, address,
    projectType, projectSize, floorLevel, accessDifficulty, installHeight,
    materialHandling, wallSubstrate, laborBurdenPercent, overheadPercent,
    profitPercent, taxPercent, status, notes
  } = req.body;
  db.prepare(`
    UPDATE projects SET projectNumber=?, projectName=?, clientName=?, estimator=?, bidDate=?, dueDate=?, address=?, projectType=?, projectSize=?, floorLevel=?, accessDifficulty=?, installHeight=?, materialHandling=?, wallSubstrate=?, laborBurdenPercent=?, overheadPercent=?, profitPercent=?, taxPercent=?, status=?, notes=?, updatedAt=datetime('now') WHERE id=?
  `).run(
    projectNumber, projectName, clientName, estimator, bidDate, dueDate, address, projectType,
    projectSize, floorLevel, accessDifficulty, installHeight, materialHandling, wallSubstrate,
    laborBurdenPercent, overheadPercent, profitPercent, taxPercent, status, notes, req.params.id
  );
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(project);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/summary', (req: Request, res: Response) => {
  const db = (req as any).db;
  const summary = calculateProjectSummary(db, parseInt(req.params.id));
  res.json(summary);
});

export default router;
