import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

router.put('/', (req: Request, res: Response) => {
  const db = (req as any).db;
  const {
    companyName, companyAddress, companyPhone, companyEmail, logoUrl,
    defaultOverheadPercent, defaultProfitPercent, defaultTaxPercent,
    defaultLaborBurdenPercent, proposalIntro, proposalTerms
  } = req.body;
  db.prepare(`
    INSERT INTO settings (id, companyName, companyAddress, companyPhone, companyEmail, logoUrl, defaultOverheadPercent, defaultProfitPercent, defaultTaxPercent, defaultLaborBurdenPercent, proposalIntro, proposalTerms, updatedAt)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      companyName=excluded.companyName, companyAddress=excluded.companyAddress,
      companyPhone=excluded.companyPhone, companyEmail=excluded.companyEmail,
      logoUrl=excluded.logoUrl, defaultOverheadPercent=excluded.defaultOverheadPercent,
      defaultProfitPercent=excluded.defaultProfitPercent, defaultTaxPercent=excluded.defaultTaxPercent,
      defaultLaborBurdenPercent=excluded.defaultLaborBurdenPercent,
      proposalIntro=excluded.proposalIntro, proposalTerms=excluded.proposalTerms,
      updatedAt=excluded.updatedAt
  `).run(
    companyName, companyAddress, companyPhone, companyEmail, logoUrl,
    defaultOverheadPercent, defaultProfitPercent, defaultTaxPercent,
    defaultLaborBurdenPercent, proposalIntro, proposalTerms
  );
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

export default router;
