import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const rooms = db.prepare('SELECT * FROM rooms WHERE projectId = ? ORDER BY sortOrder, id').all(projectId);
  res.json(rooms);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.post('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { projectId, roomName, sortOrder = 0, notes = '' } = req.body;
  const result = db.prepare(`
    INSERT INTO rooms (projectId, roomName, sortOrder, notes)
    VALUES (?, ?, ?, ?)
  `).run(projectId, roomName, sortOrder, notes);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(room);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  const { roomName, sortOrder, notes } = req.body;
  db.prepare(`
    UPDATE rooms SET roomName=?, sortOrder=?, notes=?, updatedAt=datetime('now') WHERE id=?
  `).run(roomName, sortOrder, notes, req.params.id);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  res.json(room);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = (req as any).db;
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/duplicate', (req: Request, res: Response) => {
  const db = (req as any).db;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id) as any;
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const result = db.prepare(`
    INSERT INTO rooms (projectId, roomName, sortOrder, notes)
    VALUES (?, ?, ?, ?)
  `).run(room.projectId, `${room.roomName} (Copy)`, room.sortOrder + 1, room.notes);

  const newRoomId = result.lastInsertRowid;
  const lines = db.prepare('SELECT * FROM takeoff_lines WHERE roomId = ?').all(room.id) as any[];

  for (const line of lines) {
    db.prepare(`
      INSERT INTO takeoff_lines (projectId, roomId, sourceType, sourceRef, description, sku, category, subcategory, baseType, qty, unit, materialCost, laborMinutes, laborCost, unitSell, lineTotal, notes, bundleId, catalogItemId, variantId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      line.projectId, newRoomId, line.sourceType, line.sourceRef, line.description,
      line.sku, line.category, line.subcategory, line.baseType, line.qty, line.unit,
      line.materialCost, line.laborMinutes, line.laborCost, line.unitSell, line.lineTotal,
      line.notes, line.bundleId, line.catalogItemId, line.variantId
    );
  }

  const newRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(newRoomId);
  res.status(201).json(newRoom);
});

export default router;
