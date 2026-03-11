import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { takeoffApi } from '../../lib/api';
import type { Project, TakeoffLine } from '../../types';

interface Props {
  projectId: number;
  roomId: number;
  project: Project;
}

export default function TakeoffTable({ projectId, roomId, project }: Props) {
  const qc = useQueryClient();

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['takeoff', projectId, roomId],
    queryFn: () => takeoffApi.list(projectId, roomId),
  });

  const deleteMutation = useMutation({
    mutationFn: takeoffApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['takeoff', projectId] });
      qc.invalidateQueries({ queryKey: ['project-summary', projectId] });
    },
  });

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  // Room totals
  const totals = (lines as TakeoffLine[]).reduce((acc, l) => ({
    material: acc.material + l.materialCost,
    labor: acc.labor + l.laborCost,
    laborMins: acc.laborMins + l.laborMinutes,
    total: acc.total + l.lineTotal,
  }), { material: 0, labor: 0, laborMins: 0, total: 0 });

  // Add burden, overhead, profit, tax for room display
  const laborBurden = totals.labor * (project.laborBurdenPercent / 100);
  const totalLabor = totals.labor + laborBurden;
  const subtotal = totals.material + totalLabor;
  const overhead = subtotal * (project.overheadPercent / 100);
  const profit = (subtotal + overhead) * (project.profitPercent / 100);
  const tax = totals.material * (project.taxPercent / 100);
  const grandTotal = subtotal + overhead + profit + tax;

  if (isLoading) return <div className="py-4 text-gray-400 text-sm">Loading...</div>;

  if ((lines as TakeoffLine[]).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        No lines yet. Add a line or apply a bundle.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Material</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Labor</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Labor $</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Sell</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Line Total</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(lines as TakeoffLine[]).map(line => (
            <tr key={line.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900">{line.description}</div>
                {line.category && <div className="text-xs text-gray-400">{line.category}</div>}
              </td>
              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{line.sku || '—'}</td>
              <td className="px-3 py-2 text-right text-gray-700">{line.qty}</td>
              <td className="px-3 py-2 text-gray-600">{line.unit}</td>
              <td className="px-3 py-2 text-right text-gray-700">{fmt(line.materialCost)}</td>
              <td className="px-3 py-2 text-right text-gray-500">{fmtMin(line.laborMinutes)}</td>
              <td className="px-3 py-2 text-right text-gray-700">{fmt(line.laborCost)}</td>
              <td className="px-3 py-2 text-right text-gray-700">{fmt(line.unitSell)}</td>
              <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(line.lineTotal)}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => deleteMutation.mutate(line.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-gray-300 bg-gray-50">
          <tr>
            <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-gray-700">Room Totals</td>
            <td className="px-3 py-2 text-right text-sm font-semibold">{fmt(totals.material)}</td>
            <td className="px-3 py-2 text-right text-sm font-semibold">{fmtMin(totals.laborMins)}</td>
            <td className="px-3 py-2 text-right text-sm font-semibold">{fmt(totals.labor)}</td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2 text-right text-sm font-bold text-blue-700">{fmt(grandTotal)}</td>
            <td className="px-3 py-2"></td>
          </tr>
          <tr>
            <td colSpan={9} className="px-3 py-1.5">
              <div className="flex gap-6 text-xs text-gray-500">
                <span>Labor Burden: {fmt(laborBurden)}</span>
                <span>Overhead: {fmt(overhead)}</span>
                <span>Profit: {fmt(profit)}</span>
                <span>Tax: {fmt(tax)}</span>
              </div>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
