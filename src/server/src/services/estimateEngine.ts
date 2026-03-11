import Database from 'better-sqlite3';

interface LineInput {
  qty: number;
  baseMaterialCost: number;
  baseLaborMinutes: number;
  laborBurdenPercent: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
  laborRatePerHour?: number;
}

const DEFAULT_LABOR_RATE = 85;

export function calculateLine(input: LineInput) {
  const laborRate = input.laborRatePerHour || DEFAULT_LABOR_RATE;
  const materialCost = input.qty * input.baseMaterialCost;
  const laborMinutes = input.qty * input.baseLaborMinutes;
  const laborCostRaw = (laborMinutes / 60) * laborRate;
  const laborBurden = laborCostRaw * (input.laborBurdenPercent / 100);
  const laborCost = laborCostRaw + laborBurden;
  const baseCost = materialCost + laborCost;
  const overhead = baseCost * (input.overheadPercent / 100);
  const profit = (baseCost + overhead) * (input.profitPercent / 100);
  const subtotal = baseCost + overhead + profit;
  const tax = materialCost * (input.taxPercent / 100);
  const lineTotal = subtotal + tax;
  const unitSell = input.qty > 0 ? lineTotal / input.qty : 0;

  return {
    materialCost,
    laborMinutes,
    laborCost,
    unitSell,
    lineTotal,
  };
}

export function getProjectComplexityMultiplier(project: Record<string, unknown>): { laborMult: number; materialMult: number } {
  let laborMult = 1.0;
  let materialMult = 1.0;

  if (project.floorLevel === 'high-rise') laborMult += 0.20;
  else if (project.floorLevel === 'upper') laborMult += 0.10;

  if (project.accessDifficulty === 'difficult') laborMult += 0.15;
  else if (project.accessDifficulty === 'very-difficult') laborMult += 0.30;

  if (project.installHeight === 'overhead') laborMult += 0.20;
  else if (project.installHeight === 'high') laborMult += 0.10;

  if (project.wallSubstrate === 'cmu') { laborMult += 0.20; materialMult += 0.05; }
  else if (project.wallSubstrate === 'concrete') { laborMult += 0.30; materialMult += 0.05; }
  else if (project.wallSubstrate === 'tile') { laborMult += 0.15; materialMult += 0.03; }

  if (project.materialHandling === 'difficult') materialMult += 0.10;
  else if (project.materialHandling === 'hoist-required') { materialMult += 0.15; laborMult += 0.10; }

  return { laborMult, materialMult };
}

interface ProjectRow {
  id: number;
  laborBurdenPercent: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
}

interface RoomRow {
  id: number;
  roomName: string;
}

interface TakeoffLineRow {
  roomId: number;
  materialCost: number;
  laborMinutes: number;
  laborCost: number;
}

export function calculateProjectSummary(db: Database.Database, projectId: number) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
  if (!project) return null;

  const rooms = db.prepare('SELECT * FROM rooms WHERE projectId = ? ORDER BY sortOrder, id').all(projectId) as RoomRow[];
  const lines = db.prepare('SELECT * FROM takeoff_lines WHERE projectId = ?').all(projectId) as TakeoffLineRow[];

  let totalMaterial = 0;
  let totalLaborMinutes = 0;
  let totalLaborCost = 0;

  const roomSummaries = rooms.map(room => {
    const roomLines = lines.filter((l) => l.roomId === room.id);
    let roomMaterial = 0;
    let roomLaborMins = 0;
    let roomLaborCost = 0;

    for (const line of roomLines) {
      roomMaterial += line.materialCost;
      roomLaborMins += line.laborMinutes;
      roomLaborCost += line.laborCost;
    }

    const laborBurden = roomLaborCost * (project.laborBurdenPercent / 100);
    const totalLabor = roomLaborCost + laborBurden;
    const subtotal = roomMaterial + totalLabor;
    const overhead = subtotal * (project.overheadPercent / 100);
    const profit = (subtotal + overhead) * (project.profitPercent / 100);
    const tax = roomMaterial * (project.taxPercent / 100);
    const grandTotal = subtotal + overhead + profit + tax;

    totalMaterial += roomMaterial;
    totalLaborMinutes += roomLaborMins;
    totalLaborCost += roomLaborCost;

    return {
      roomId: room.id,
      roomName: room.roomName,
      materialTotal: roomMaterial,
      laborTotal: totalLabor,
      laborBurden,
      subtotal,
      tax,
      overhead,
      profit,
      grandTotal,
      lineCount: roomLines.length,
    };
  });

  const laborBurdenTotal = totalLaborCost * (project.laborBurdenPercent / 100);
  const totalLabor = totalLaborCost + laborBurdenTotal;
  const subtotal = totalMaterial + totalLabor;
  const overhead = subtotal * (project.overheadPercent / 100);
  const profit = (subtotal + overhead) * (project.profitPercent / 100);
  const tax = totalMaterial * (project.taxPercent / 100);
  const grandTotal = subtotal + overhead + profit + tax;

  // suppress unused variable warning
  void totalLaborMinutes;

  return {
    projectId,
    rooms: roomSummaries,
    materialTotal: totalMaterial,
    laborTotal: totalLabor,
    laborBurden: laborBurdenTotal,
    subtotal,
    tax,
    overhead,
    profit,
    grandTotal,
  };
}
