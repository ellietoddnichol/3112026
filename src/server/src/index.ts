import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initializeDatabase } from './db/schema';
import projectRoutes from './routes/projects';
import roomRoutes from './routes/rooms';
import takeoffRoutes from './routes/takeoff';
import catalogRoutes from './routes/catalog';
import bundleRoutes from './routes/bundles';
import parserRoutes from './routes/parser';
import settingsRoutes from './routes/settings';
import syncRoutes from './routes/sync';
import modifierRoutes from './routes/modifiers';
import abbreviationRoutes from './routes/abbreviations';

dotenv.config();

const app = express();
const db = initializeDatabase();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

app.use((req, _res, next) => { (req as any).db = db; next(); });

app.use('/api/projects', projectRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/takeoff', takeoffRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/abbreviations', abbreviationRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => console.log(`Brighten Install server running on port ${PORT}`));
export { db };
