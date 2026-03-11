import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { projectsApi, settingsApi } from '../../lib/api';
import type { Project } from '../../types';

interface Props {
  projectId: number;
  project: Project;
}

export default function ProposalView({ projectId, project }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: summary } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => projectsApi.getSummary(projectId),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrint = () => window.print();

  if (!summary) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Proposal</h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium"
        >
          <Printer size={16} /> Print / PDF
        </button>
      </div>

      <div ref={printRef} className="bg-white rounded-lg border border-gray-200 p-8 max-w-4xl print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{settings?.companyName || 'Brighten Install'}</h1>
            {settings?.companyAddress && <p className="text-sm text-gray-500 mt-1">{settings.companyAddress}</p>}
            {settings?.companyPhone && <p className="text-sm text-gray-500">{settings.companyPhone}</p>}
            {settings?.companyEmail && <p className="text-sm text-gray-500">{settings.companyEmail}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">PROPOSAL</div>
            <div className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Project</h3>
            <div className="text-base font-semibold text-gray-900">{project.projectName}</div>
            <div className="text-sm text-gray-500">{project.projectNumber}</div>
            {project.address && <div className="text-sm text-gray-500 mt-1">{project.address}</div>}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Client</h3>
            <div className="text-base font-semibold text-gray-900">{project.clientName || '—'}</div>
            {project.bidDate && <div className="text-sm text-gray-500">Bid Date: {project.bidDate}</div>}
          </div>
        </div>

        {/* Intro */}
        {settings?.proposalIntro && (
          <p className="text-sm text-gray-700 mb-8">{settings.proposalIntro}</p>
        )}

        {/* Room Summaries */}
        {summary.rooms && summary.rooms.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Scope of Work</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Area / Room</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Material</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Labor</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.rooms.map((room: any) => (
                  <tr key={room.roomId} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium">{room.roomName}</td>
                    <td className="py-2.5 text-right text-gray-500">{room.lineCount}</td>
                    <td className="py-2.5 text-right">{fmt(room.materialTotal)}</td>
                    <td className="py-2.5 text-right">{fmt(room.laborTotal)}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(room.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Material</span>
              <span className="font-medium">{fmt(summary.materialTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Labor</span>
              <span className="font-medium">{fmt(summary.laborTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Labor Burden</span>
              <span className="font-medium">{fmt(summary.laborBurden)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{fmt(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overhead ({project.overheadPercent}%)</span>
              <span className="font-medium">{fmt(summary.overhead)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit ({project.profitPercent}%)</span>
              <span className="font-medium">{fmt(summary.profit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({project.taxPercent}%)</span>
              <span className="font-medium">{fmt(summary.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-3 mt-3">
              <span>GRAND TOTAL</span>
              <span className="text-blue-700">{fmt(summary.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {settings?.proposalTerms && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Terms & Conditions</h3>
            <p className="text-xs text-gray-500">{settings.proposalTerms}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          This proposal is valid for 30 days. Prepared by {project.estimator || settings?.companyName || 'Brighten Install'}
        </div>
      </div>
    </div>
  );
}
