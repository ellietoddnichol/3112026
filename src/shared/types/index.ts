export interface Project {
  id: number;
  projectNumber: string;
  projectName: string;
  clientName: string;
  estimator: string;
  bidDate: string;
  dueDate: string;
  address: string;
  projectType: string;
  projectSize: string;
  floorLevel: string;
  accessDifficulty: string;
  installHeight: string;
  materialHandling: string;
  wallSubstrate: string;
  laborBurdenPercent: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: number;
  projectId: number;
  roomName: string;
  sortOrder: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TakeoffLine {
  id: number;
  projectId: number;
  roomId: number;
  sourceType: string;
  sourceRef: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string;
  baseType: string;
  qty: number;
  unit: string;
  materialCost: number;
  laborMinutes: number;
  laborCost: number;
  unitSell: number;
  lineTotal: number;
  notes: string;
  bundleId: number | null;
  catalogItemId: number | null;
  variantId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: number;
  sku: string;
  category: string;
  subcategory: string;
  family: string;
  description: string;
  manufacturer: string;
  model: string;
  unit: string;
  baseMaterialCost: number;
  baseLaborMinutes: number;
  taxable: boolean;
  adaFlag: boolean;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemVariant {
  id: number;
  catalogItemId: number;
  finish: string;
  size: string;
  mountType: string;
  baseType: string;
  optionLabel: string;
  addMaterialCost: number;
  addLaborMinutes: number;
  percentLabor: number;
  percentMaterial: number;
  active: boolean;
  updatedAt: string;
}

export interface Modifier {
  id: number;
  modifierKey: string;
  appliesToCategories: string;
  addLaborMinutes: number;
  addMaterialCost: number;
  percentLabor: number;
  percentMaterial: number;
  active: boolean;
  updatedAt: string;
}

export interface Abbreviation {
  id: number;
  abbreviation: string;
  normalizedTerm: string;
  categoryHint: string;
  notes: string;
  active: boolean;
  updatedAt: string;
}

export interface Bundle {
  id: number;
  bundleKey: string;
  bundleName: string;
  category: string;
  active: boolean;
  updatedAt: string;
}

export interface BundleItem {
  id: number;
  bundleId: number;
  catalogItemId: number;
  variantId: number | null;
  sku: string;
  qty: number;
  modifierKeys: string;
  sortOrder: number;
  notes: string;
}

export interface Settings {
  id: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string;
  defaultOverheadPercent: number;
  defaultProfitPercent: number;
  defaultTaxPercent: number;
  defaultLaborBurdenPercent: number;
  proposalIntro: string;
  proposalTerms: string;
  updatedAt: string;
}

export interface ParseJob {
  id: number;
  projectId: number | null;
  roomId: number | null;
  sourceType: string;
  sourceFileName: string;
  rawInput: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParseLine {
  id: number;
  parseJobId: number;
  rawText: string;
  normalizedText: string;
  parsedQty: number;
  parsedUnit: string;
  sourcePageNumber: number | null;
  matchedCatalogItemId: number | null;
  matchedVariantId: number | null;
  confidenceScore: number;
  reviewStatus: string;
  roomId: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateSummary {
  roomId: number;
  roomName: string;
  materialTotal: number;
  laborTotal: number;
  laborBurden: number;
  subtotal: number;
  tax: number;
  overhead: number;
  profit: number;
  grandTotal: number;
  lineCount: number;
}

export interface ProjectSummary {
  projectId: number;
  rooms: EstimateSummary[];
  materialTotal: number;
  laborTotal: number;
  laborBurden: number;
  subtotal: number;
  tax: number;
  overhead: number;
  profit: number;
  grandTotal: number;
}
