import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function initializeDatabase(): Database.Database {
  const dbPath = process.env.DATABASE_URL || './data/brighten.db';
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      companyName TEXT DEFAULT 'Brighten Install',
      companyAddress TEXT DEFAULT '',
      companyPhone TEXT DEFAULT '',
      companyEmail TEXT DEFAULT '',
      logoUrl TEXT DEFAULT '',
      defaultOverheadPercent REAL DEFAULT 10.0,
      defaultProfitPercent REAL DEFAULT 12.0,
      defaultTaxPercent REAL DEFAULT 8.0,
      defaultLaborBurdenPercent REAL DEFAULT 35.0,
      proposalIntro TEXT DEFAULT 'We are pleased to submit the following proposal for your review.',
      proposalTerms TEXT DEFAULT 'Payment due net 30. This proposal is valid for 30 days.',
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectNumber TEXT NOT NULL,
      projectName TEXT NOT NULL,
      clientName TEXT DEFAULT '',
      estimator TEXT DEFAULT '',
      bidDate TEXT DEFAULT '',
      dueDate TEXT DEFAULT '',
      address TEXT DEFAULT '',
      projectType TEXT DEFAULT '',
      projectSize TEXT DEFAULT 'medium',
      floorLevel TEXT DEFAULT 'ground',
      accessDifficulty TEXT DEFAULT 'standard',
      installHeight TEXT DEFAULT 'standard',
      materialHandling TEXT DEFAULT 'standard',
      wallSubstrate TEXT DEFAULT 'drywall',
      laborBurdenPercent REAL DEFAULT 35.0,
      overheadPercent REAL DEFAULT 10.0,
      profitPercent REAL DEFAULT 12.0,
      taxPercent REAL DEFAULT 8.0,
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      roomName TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      family TEXT DEFAULT '',
      description TEXT NOT NULL,
      manufacturer TEXT DEFAULT '',
      model TEXT DEFAULT '',
      unit TEXT DEFAULT 'EA',
      baseMaterialCost REAL DEFAULT 0.0,
      baseLaborMinutes REAL DEFAULT 0.0,
      taxable INTEGER DEFAULT 1,
      adaFlag INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS item_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catalogItemId INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
      finish TEXT DEFAULT '',
      size TEXT DEFAULT '',
      mountType TEXT DEFAULT '',
      baseType TEXT DEFAULT '',
      optionLabel TEXT NOT NULL,
      addMaterialCost REAL DEFAULT 0.0,
      addLaborMinutes REAL DEFAULT 0.0,
      percentLabor REAL DEFAULT 0.0,
      percentMaterial REAL DEFAULT 0.0,
      active INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS modifiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modifierKey TEXT UNIQUE NOT NULL,
      appliesToCategories TEXT DEFAULT '',
      addLaborMinutes REAL DEFAULT 0.0,
      addMaterialCost REAL DEFAULT 0.0,
      percentLabor REAL DEFAULT 0.0,
      percentMaterial REAL DEFAULT 0.0,
      active INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS abbreviations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      abbreviation TEXT UNIQUE NOT NULL,
      normalizedTerm TEXT NOT NULL,
      categoryHint TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundleKey TEXT UNIQUE NOT NULL,
      bundleName TEXT NOT NULL,
      category TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundleId INTEGER NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
      catalogItemId INTEGER NOT NULL REFERENCES catalog_items(id),
      variantId INTEGER REFERENCES item_variants(id),
      sku TEXT DEFAULT '',
      qty REAL DEFAULT 1.0,
      modifierKeys TEXT DEFAULT '',
      sortOrder INTEGER DEFAULT 0,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS takeoff_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      sourceType TEXT DEFAULT 'manual',
      sourceRef TEXT DEFAULT '',
      description TEXT NOT NULL,
      sku TEXT DEFAULT '',
      category TEXT DEFAULT '',
      subcategory TEXT DEFAULT '',
      baseType TEXT DEFAULT 'surface',
      qty REAL DEFAULT 1.0,
      unit TEXT DEFAULT 'EA',
      materialCost REAL DEFAULT 0.0,
      laborMinutes REAL DEFAULT 0.0,
      laborCost REAL DEFAULT 0.0,
      unitSell REAL DEFAULT 0.0,
      lineTotal REAL DEFAULT 0.0,
      notes TEXT DEFAULT '',
      bundleId INTEGER REFERENCES bundles(id),
      catalogItemId INTEGER REFERENCES catalog_items(id),
      variantId INTEGER REFERENCES item_variants(id),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parse_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER REFERENCES projects(id),
      roomId INTEGER REFERENCES rooms(id),
      sourceType TEXT DEFAULT 'text',
      sourceFileName TEXT DEFAULT '',
      rawInput TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parse_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parseJobId INTEGER NOT NULL REFERENCES parse_jobs(id) ON DELETE CASCADE,
      rawText TEXT DEFAULT '',
      normalizedText TEXT DEFAULT '',
      parsedQty REAL DEFAULT 1.0,
      parsedUnit TEXT DEFAULT 'EA',
      sourcePageNumber INTEGER,
      matchedCatalogItemId INTEGER REFERENCES catalog_items(id),
      matchedVariantId INTEGER REFERENCES item_variants(id),
      confidenceScore REAL DEFAULT 0.0,
      reviewStatus TEXT DEFAULT 'pending',
      roomId INTEGER REFERENCES rooms(id),
      notes TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`INSERT INTO settings (id, companyName, companyAddress, companyPhone, companyEmail, defaultOverheadPercent, defaultProfitPercent, defaultTaxPercent, defaultLaborBurdenPercent, proposalIntro, proposalTerms)
      VALUES (1, 'Brighten Install', '', '', '', 10.0, 12.0, 8.0, 35.0, 'We are pleased to submit the following proposal for your review.', 'Payment due net 30. This proposal is valid for 30 days.')`).run();
  }

  seedCatalog(db);
  seedModifiers(db);
  seedAbbreviations(db);
  seedBundles(db);

  return db;
}

function seedCatalog(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as count FROM catalog_items').get() as { count: number };
  if (count.count > 0) return;

  const items = [
    { sku: 'GB-18-SS', category: 'Grab Bars', subcategory: 'Straight', description: '18" Stainless Steel Grab Bar', manufacturer: 'Bobrick', model: 'B-6806.18', unit: 'EA', baseMaterialCost: 45.00, baseLaborMinutes: 45, adaFlag: 1 },
    { sku: 'GB-24-SS', category: 'Grab Bars', subcategory: 'Straight', description: '24" Stainless Steel Grab Bar', manufacturer: 'Bobrick', model: 'B-6806.24', unit: 'EA', baseMaterialCost: 55.00, baseLaborMinutes: 45, adaFlag: 1 },
    { sku: 'GB-36-SS', category: 'Grab Bars', subcategory: 'Straight', description: '36" Stainless Steel Grab Bar', manufacturer: 'Bobrick', model: 'B-6806.36', unit: 'EA', baseMaterialCost: 68.00, baseLaborMinutes: 60, adaFlag: 1 },
    { sku: 'GB-42-SS', category: 'Grab Bars', subcategory: 'Straight', description: '42" Stainless Steel Grab Bar', manufacturer: 'Bobrick', model: 'B-6806.42', unit: 'EA', baseMaterialCost: 78.00, baseLaborMinutes: 60, adaFlag: 1 },
    { sku: 'GB-LWS', category: 'Grab Bars', subcategory: 'L-Shape', description: 'L-Shape ADA Grab Bar Set', manufacturer: 'Bobrick', model: 'B-6806.99', unit: 'SET', baseMaterialCost: 145.00, baseLaborMinutes: 90, adaFlag: 1 },
    { sku: 'MIR-24x36', category: 'Mirrors', subcategory: 'Framed', description: '24"x36" Framed Mirror', manufacturer: 'Bobrick', model: 'B-290 2436', unit: 'EA', baseMaterialCost: 110.00, baseLaborMinutes: 30, adaFlag: 0 },
    { sku: 'MIR-36x48', category: 'Mirrors', subcategory: 'Framed', description: '36"x48" Framed Mirror', manufacturer: 'Bobrick', model: 'B-290 3648', unit: 'EA', baseMaterialCost: 195.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'MIR-ADA-30x42', category: 'Mirrors', subcategory: 'ADA', description: '30"x42" ADA Tilted Mirror', manufacturer: 'Bobrick', model: 'B-293 3042', unit: 'EA', baseMaterialCost: 225.00, baseLaborMinutes: 45, adaFlag: 1 },
    { sku: 'TPD-SGL', category: 'Toilet Paper Dispensers', subcategory: 'Single', description: 'Single Roll TP Dispenser Surface Mount', manufacturer: 'Bobrick', model: 'B-2888', unit: 'EA', baseMaterialCost: 48.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'TPD-DBL', category: 'Toilet Paper Dispensers', subcategory: 'Double', description: 'Double Roll TP Dispenser Surface Mount', manufacturer: 'Bobrick', model: 'B-2740', unit: 'EA', baseMaterialCost: 72.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'TPD-JBT', category: 'Toilet Paper Dispensers', subcategory: 'Jumbo', description: 'Jumbo Roll TP Dispenser', manufacturer: 'Bobrick', model: 'B-2892', unit: 'EA', baseMaterialCost: 95.00, baseLaborMinutes: 25, adaFlag: 0 },
    { sku: 'PTD-SURF', category: 'Paper Towel Dispensers', subcategory: 'Surface', description: 'Paper Towel Dispenser Surface Mount', manufacturer: 'Bobrick', model: 'B-2620', unit: 'EA', baseMaterialCost: 85.00, baseLaborMinutes: 25, adaFlag: 0 },
    { sku: 'PTD-REC', category: 'Paper Towel Dispensers', subcategory: 'Recessed', description: 'Paper Towel Dispenser Recessed', manufacturer: 'Bobrick', model: 'B-3974', unit: 'EA', baseMaterialCost: 165.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'SD-SURF-SS', category: 'Soap Dispensers', subcategory: 'Surface', description: 'Soap Dispenser Surface Mount SS', manufacturer: 'Bobrick', model: 'B-4112', unit: 'EA', baseMaterialCost: 95.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'SD-REC-SS', category: 'Soap Dispensers', subcategory: 'Recessed', description: 'Soap Dispenser Recessed SS', manufacturer: 'Bobrick', model: 'B-4015', unit: 'EA', baseMaterialCost: 185.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'HD-STD', category: 'Hand Dryers', subcategory: 'Standard', description: 'Hand Dryer 115V Surface Mount', manufacturer: 'Excel', model: 'XL-BW', unit: 'EA', baseMaterialCost: 395.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'HD-XLERATOR', category: 'Hand Dryers', subcategory: 'High Speed', description: 'XLERATOR High Speed Hand Dryer', manufacturer: 'Excel', model: 'XL-C', unit: 'EA', baseMaterialCost: 695.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'RH-SS', category: 'Robe Hooks', subcategory: 'Single', description: 'Robe Hook Single SS', manufacturer: 'Bobrick', model: 'B-6727', unit: 'EA', baseMaterialCost: 28.00, baseLaborMinutes: 15, adaFlag: 0 },
    { sku: 'RH-DBL', category: 'Robe Hooks', subcategory: 'Double', description: 'Robe Hook Double SS', manufacturer: 'Bobrick', model: 'B-6727.99', unit: 'EA', baseMaterialCost: 42.00, baseLaborMinutes: 15, adaFlag: 0 },
    { sku: 'SHF-18', category: 'Shelves', subcategory: 'Standard', description: '18" Stainless Steel Shelf', manufacturer: 'Bobrick', model: 'B-6637', unit: 'EA', baseMaterialCost: 65.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'SHF-24', category: 'Shelves', subcategory: 'Standard', description: '24" Stainless Steel Shelf', manufacturer: 'Bobrick', model: 'B-6637.24', unit: 'EA', baseMaterialCost: 78.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'PART-SOLID-PLASTIC', category: 'Toilet Partitions', subcategory: 'Solid Plastic', description: 'Toilet Partition Panel Solid Plastic', manufacturer: 'Bobrick', model: 'B-Partition', unit: 'EA', baseMaterialCost: 450.00, baseLaborMinutes: 120, adaFlag: 0 },
    { sku: 'PART-PILASTER', category: 'Toilet Partitions', subcategory: 'Pilaster', description: 'Toilet Partition Pilaster', manufacturer: 'Bobrick', model: 'B-Pilaster', unit: 'EA', baseMaterialCost: 225.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'PART-DOOR', category: 'Toilet Partitions', subcategory: 'Door', description: 'Toilet Partition Door with Hardware', manufacturer: 'Bobrick', model: 'B-Door', unit: 'EA', baseMaterialCost: 320.00, baseLaborMinutes: 90, adaFlag: 0 },
    { sku: 'LOCK-12x15x72', category: 'Lockers', subcategory: 'Single Tier', description: '12"x15"x72" Single Tier Locker', manufacturer: 'Penco', model: 'ST-1272', unit: 'EA', baseMaterialCost: 185.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'LOCK-12x15x36', category: 'Lockers', subcategory: 'Double Tier', description: '12"x15"x36" Double Tier Locker', manufacturer: 'Penco', model: 'DT-1236', unit: 'EA', baseMaterialCost: 145.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'SND-SURF', category: 'Sanitary Napkin Disposal', subcategory: 'Surface', description: 'Sanitary Napkin Disposal Surface Mount', manufacturer: 'Bobrick', model: 'B-270', unit: 'EA', baseMaterialCost: 58.00, baseLaborMinutes: 20, adaFlag: 0 },
    { sku: 'SND-REC', category: 'Sanitary Napkin Disposal', subcategory: 'Recessed', description: 'Sanitary Napkin Disposal Recessed', manufacturer: 'Bobrick', model: 'B-354', unit: 'EA', baseMaterialCost: 125.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'FEC-SM', category: 'Fire Extinguisher Cabinets', subcategory: 'Surface', description: 'FE Cabinet Surface Mount', manufacturer: 'Larsen', model: 'LF-1', unit: 'EA', baseMaterialCost: 145.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'FEC-REC', category: 'Fire Extinguisher Cabinets', subcategory: 'Recessed', description: 'FE Cabinet Recessed', manufacturer: 'Larsen', model: 'LF-2R', unit: 'EA', baseMaterialCost: 225.00, baseLaborMinutes: 90, adaFlag: 0 },
    { sku: 'CG-2-CLR', category: 'Corner Guards', subcategory: 'Clear', description: '2" Corner Guard Clear Vinyl', manufacturer: 'Pawling', model: 'CG-200', unit: 'LF', baseMaterialCost: 8.50, baseLaborMinutes: 10, adaFlag: 0 },
    { sku: 'CG-4-SS', category: 'Corner Guards', subcategory: 'Stainless', description: '4" Corner Guard Stainless Steel', manufacturer: 'Pawling', model: 'CG-400SS', unit: 'LF', baseMaterialCost: 24.00, baseLaborMinutes: 12, adaFlag: 0 },
    { sku: 'VDB-4X4', category: 'Visual Display Boards', subcategory: 'Whiteboard', description: '4x4 Magnetic Whiteboard', manufacturer: 'Ghent', model: 'M14-34-4', unit: 'EA', baseMaterialCost: 285.00, baseLaborMinutes: 45, adaFlag: 0 },
    { sku: 'VDB-4X8', category: 'Visual Display Boards', subcategory: 'Whiteboard', description: '4x8 Magnetic Whiteboard', manufacturer: 'Ghent', model: 'M14-34-8', unit: 'EA', baseMaterialCost: 485.00, baseLaborMinutes: 60, adaFlag: 0 },
    { sku: 'TB-4X4', category: 'Visual Display Boards', subcategory: 'Tackboard', description: '4x4 Tackboard Fabric', manufacturer: 'Ghent', model: 'TB14-34-4', unit: 'EA', baseMaterialCost: 195.00, baseLaborMinutes: 45, adaFlag: 0 },
  ];

  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO catalog_items (sku, category, subcategory, description, manufacturer, model, unit, baseMaterialCost, baseLaborMinutes, adaFlag, active)
    VALUES (@sku, @category, @subcategory, @description, @manufacturer, @model, @unit, @baseMaterialCost, @baseLaborMinutes, @adaFlag, 1)
  `);

  for (const item of items) {
    insertItem.run(item);
  }
}

function seedModifiers(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as count FROM modifiers').get() as { count: number };
  if (count.count > 0) return;

  const modifiers = [
    { modifierKey: 'ADA', appliesToCategories: 'all', addLaborMinutes: 15, addMaterialCost: 0, percentLabor: 0, percentMaterial: 0 },
    { modifierKey: 'RECESSED', appliesToCategories: 'all', addLaborMinutes: 45, addMaterialCost: 0, percentLabor: 0, percentMaterial: 25 },
    { modifierKey: 'SEMI-RECESSED', appliesToCategories: 'all', addLaborMinutes: 30, addMaterialCost: 0, percentLabor: 0, percentMaterial: 15 },
    { modifierKey: 'SURFACE-MOUNT', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 0, percentMaterial: 0 },
    { modifierKey: 'STAINLESS', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 0, percentMaterial: 20 },
    { modifierKey: 'PEENED', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 0, percentMaterial: 10 },
    { modifierKey: 'TILE-WALL', appliesToCategories: 'all', addLaborMinutes: 20, addMaterialCost: 15, percentLabor: 0, percentMaterial: 0 },
    { modifierKey: 'CMU-WALL', appliesToCategories: 'all', addLaborMinutes: 30, addMaterialCost: 10, percentLabor: 0, percentMaterial: 0 },
    { modifierKey: 'CONCRETE', appliesToCategories: 'all', addLaborMinutes: 45, addMaterialCost: 10, percentLabor: 0, percentMaterial: 0 },
    { modifierKey: 'HIGH-RISE', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 20, percentMaterial: 0 },
    { modifierKey: 'RESTRICTED-ACCESS', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 15, percentMaterial: 0 },
    { modifierKey: 'UNION', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 25, percentMaterial: 0 },
    { modifierKey: 'AFTER-HOURS', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 50, percentMaterial: 0 },
    { modifierKey: 'CUSTOM-COLOR', appliesToCategories: 'all', addLaborMinutes: 0, addMaterialCost: 0, percentLabor: 0, percentMaterial: 30 },
    { modifierKey: 'FORKLIFT-REQUIRED', appliesToCategories: 'all', addLaborMinutes: 60, addMaterialCost: 250, percentLabor: 0, percentMaterial: 0 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO modifiers (modifierKey, appliesToCategories, addLaborMinutes, addMaterialCost, percentLabor, percentMaterial, active)
    VALUES (@modifierKey, @appliesToCategories, @addLaborMinutes, @addMaterialCost, @percentLabor, @percentMaterial, 1)
  `);
  for (const m of modifiers) insert.run(m);
}

function seedAbbreviations(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as count FROM abbreviations').get() as { count: number };
  if (count.count > 0) return;

  const abbrevs = [
    { abbreviation: 'GB', normalizedTerm: 'Grab Bar', categoryHint: 'Grab Bars' },
    { abbreviation: 'TPD', normalizedTerm: 'Toilet Paper Dispenser', categoryHint: 'Toilet Paper Dispensers' },
    { abbreviation: 'PTD', normalizedTerm: 'Paper Towel Dispenser', categoryHint: 'Paper Towel Dispensers' },
    { abbreviation: 'SD', normalizedTerm: 'Soap Dispenser', categoryHint: 'Soap Dispensers' },
    { abbreviation: 'HD', normalizedTerm: 'Hand Dryer', categoryHint: 'Hand Dryers' },
    { abbreviation: 'SND', normalizedTerm: 'Sanitary Napkin Disposal', categoryHint: 'Sanitary Napkin Disposal' },
    { abbreviation: 'FEC', normalizedTerm: 'Fire Extinguisher Cabinet', categoryHint: 'Fire Extinguisher Cabinets' },
    { abbreviation: 'CG', normalizedTerm: 'Corner Guard', categoryHint: 'Corner Guards' },
    { abbreviation: 'MIR', normalizedTerm: 'Mirror', categoryHint: 'Mirrors' },
    { abbreviation: 'RH', normalizedTerm: 'Robe Hook', categoryHint: 'Robe Hooks' },
    { abbreviation: 'SHF', normalizedTerm: 'Shelf', categoryHint: 'Shelves' },
    { abbreviation: 'SS', normalizedTerm: 'Stainless Steel', categoryHint: '' },
    { abbreviation: 'ADA', normalizedTerm: 'ADA Compliant', categoryHint: '' },
    { abbreviation: 'SURF', normalizedTerm: 'Surface Mount', categoryHint: '' },
    { abbreviation: 'REC', normalizedTerm: 'Recessed', categoryHint: '' },
    { abbreviation: 'EA', normalizedTerm: 'Each', categoryHint: '' },
    { abbreviation: 'LF', normalizedTerm: 'Linear Foot', categoryHint: '' },
    { abbreviation: 'SF', normalizedTerm: 'Square Foot', categoryHint: '' },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO abbreviations (abbreviation, normalizedTerm, categoryHint, active)
    VALUES (@abbreviation, @normalizedTerm, @categoryHint, 1)
  `);
  for (const a of abbrevs) insert.run(a);
}

function seedBundles(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as count FROM bundles').get() as { count: number };
  if (count.count > 0) return;

  const bundles = [
    { bundleKey: 'ADA-SINGLE-RESTROOM', bundleName: 'ADA Single Stall Restroom Bundle', category: 'Restroom' },
    { bundleKey: 'STD-SINGLE-RESTROOM', bundleName: 'Standard Single Stall Restroom Bundle', category: 'Restroom' },
    { bundleKey: 'WOMENS-RESTROOM', bundleName: "Women's Restroom Accessories Bundle", category: 'Restroom' },
    { bundleKey: 'MENS-RESTROOM', bundleName: "Men's Restroom Accessories Bundle", category: 'Restroom' },
  ];

  const insertBundle = db.prepare(`
    INSERT OR IGNORE INTO bundles (bundleKey, bundleName, category, active) VALUES (@bundleKey, @bundleName, @category, 1)
  `);

  for (const b of bundles) {
    insertBundle.run(b);
  }

  const getItem = (sku: string) => {
    const item = db.prepare('SELECT id FROM catalog_items WHERE sku = ?').get(sku) as { id: number } | undefined;
    return item?.id;
  };

  const adaBundleId = (db.prepare('SELECT id FROM bundles WHERE bundleKey = ?').get('ADA-SINGLE-RESTROOM') as { id: number } | undefined)?.id;
  const stdBundleId = (db.prepare('SELECT id FROM bundles WHERE bundleKey = ?').get('STD-SINGLE-RESTROOM') as { id: number } | undefined)?.id;

  const insertBundleItem = db.prepare(`
    INSERT INTO bundle_items (bundleId, catalogItemId, sku, qty, sortOrder)
    VALUES (@bundleId, @catalogItemId, @sku, @qty, @sortOrder)
  `);

  if (adaBundleId) {
    const adaItems = [
      { sku: 'GB-36-SS', qty: 1, sortOrder: 1 },
      { sku: 'GB-42-SS', qty: 1, sortOrder: 2 },
      { sku: 'GB-LWS', qty: 1, sortOrder: 3 },
      { sku: 'MIR-ADA-30x42', qty: 1, sortOrder: 4 },
      { sku: 'TPD-DBL', qty: 1, sortOrder: 5 },
      { sku: 'SD-SURF-SS', qty: 1, sortOrder: 6 },
      { sku: 'PTD-SURF', qty: 1, sortOrder: 7 },
      { sku: 'SND-SURF', qty: 1, sortOrder: 8 },
      { sku: 'RH-SS', qty: 1, sortOrder: 9 },
    ];
    for (const item of adaItems) {
      const catalogId = getItem(item.sku);
      if (catalogId) insertBundleItem.run({ bundleId: adaBundleId, catalogItemId: catalogId, ...item });
    }
  }

  if (stdBundleId) {
    const stdItems = [
      { sku: 'GB-24-SS', qty: 1, sortOrder: 1 },
      { sku: 'MIR-24x36', qty: 1, sortOrder: 2 },
      { sku: 'TPD-SGL', qty: 1, sortOrder: 3 },
      { sku: 'SD-SURF-SS', qty: 1, sortOrder: 4 },
      { sku: 'PTD-SURF', qty: 1, sortOrder: 5 },
      { sku: 'SND-SURF', qty: 1, sortOrder: 6 },
      { sku: 'RH-SS', qty: 1, sortOrder: 7 },
    ];
    for (const item of stdItems) {
      const catalogId = getItem(item.sku);
      if (catalogId) insertBundleItem.run({ bundleId: stdBundleId, catalogItemId: catalogId, ...item });
    }
  }
}
