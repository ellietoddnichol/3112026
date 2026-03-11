import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Package, ChevronRight } from 'lucide-react';
import { bundlesApi } from '../../lib/api';
import type { Bundle } from '../../types';

interface Props {
  projectId: number;
  roomId: number;
  onClose: () => void;
}

interface BundleItemRow {
  id: number;
  description: string;
  sku: string;
  qty: number;
  unit: string;
  category: string;
  baseMaterialCost: number;
  baseLaborMinutes: number;
}

export default function BundlePickerModal({ projectId, roomId, onClose }: Props) {
  const qc = useQueryClient();
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: bundlesApi.list,
  });

  const { data: bundleItems = [] } = useQuery({
    queryKey: ['bundle-items', selectedBundleId],
    queryFn: () => selectedBundleId ? bundlesApi.getItems(selectedBundleId) : Promise.resolve([]),
    enabled: !!selectedBundleId,
  });

  const applyMutation = useMutation({
    mutationFn: ({ bundleId }: { bundleId: number }) => bundlesApi.apply(bundleId, projectId, roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['takeoff', projectId] });
      qc.invalidateQueries({ queryKey: ['project-summary', projectId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Apply Bundle</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Bundle list */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {(bundles as Bundle[]).filter(b => b.active).map(bundle => (
              <div
                key={bundle.id}
                onClick={() => setSelectedBundleId(bundle.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedBundleId === bundle.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{bundle.bundleName}</div>
                    <div className="text-xs text-gray-500">{bundle.category}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            ))}
          </div>

          {/* Bundle preview */}
          <div className="w-1/2 overflow-y-auto p-4">
            {selectedBundleId ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bundle Contents</h3>
                <div className="space-y-2">
                  {(bundleItems as BundleItemRow[]).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <div className="text-sm text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-400">{item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">×{item.qty}</div>
                        <div className="text-xs text-gray-400">${item.baseMaterialCost?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a bundle to preview
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => selectedBundleId && applyMutation.mutate({ bundleId: selectedBundleId })}
            disabled={!selectedBundleId || applyMutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {applyMutation.isPending ? 'Applying...' : 'Apply Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}
