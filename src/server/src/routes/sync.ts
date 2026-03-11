import { Router, Request, Response } from 'express';

const router = Router();

// Stub for Google Sheets sync - returns not configured if no credentials
router.post('/catalog', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Google Sheets sync not configured. Set GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT in .env' });
});

router.post('/abbreviations', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Google Sheets sync not configured.' });
});

router.post('/modifiers', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Google Sheets sync not configured.' });
});

router.post('/bundles', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Google Sheets sync not configured.' });
});

router.post('/full', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Google Sheets sync not configured.' });
});

export default router;
