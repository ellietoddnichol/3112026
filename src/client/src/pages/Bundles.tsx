import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronRight, Package, Edit2, X, Check } from 'lucide-react';
import { bundlesApi, catalogApi } from '../lib/api';
import type { Bundle, CatalogItem } from '../types';

interface BundleItemRow {
  id: number;
  sku: string;
  description: string;
  qty: number;
  unit: string;
  baseMaterialCost: number;
  baseLaborMinutes: number;
}

export default function Bundles() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [newBundle, setNewBundle] = useState({ bundleKey: '', bundleName: '', category: '' });
  const [newItemCatalogId, setNewItemCatalogId] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: bundlesApi.list,
  });

  const { data: bundleItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['bundle-items', expandedId],
    queryFn: () => expandedId ? bundlesApi.getItems(expandedId) : Promise.resolve([]),
    enabled: !!expandedId,
  });

  const { data: catalogItems = [] } = useQuery({
    queryKey: ['catalog', {}],
    queryFn: () => catalogApi.list({ active: true }),
  });

  const createMutation = useMutation({
    mutationFn: bundlesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundles'] });
      setShowCreateForm(false);
      setNewBundle({ bundleKey: '', bundleName: '', category: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Bundle> }) => bundlesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundles'] });
      setEditingBundle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bundlesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ bundleId, data }: { bundleId: number; data: Record<string, unknown> }) =>
      bundlesApi.addItem(bundleId, data),
    onSuccess: () => {
      refetchItems();
      setShowAddItem(null);
      setNewItemCatalogId('');
      setNewItemQty(1);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: bundlesApi.deleteItem,
    onSuccess: () => refetchItems(),
  });

  const handleToggle = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const inputClass = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundles</h1>
          <p className="text-gray-500 mt-1">Pre-built item packages for quick takeoff</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> New Bundle
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New Bundle</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Bundle Key *</label><input type="text" value={newBundle.bundleKey} onChange={e => setNewBundle(p => ({ ...p, bundleKey: e.target.value }))} className={inputClass} placeholder="e.g. ADA-RESTROOM" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Bundle Name *</label><input type="text" value={newBundle.bundleName} onChange={e => setNewBundle(p => ({ ...p, bundleName: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Category</label><input type="text" value={newBundle.category} onChange={e => setNewBundle(p => ({ ...p, category: e.target.value }))} className={inputClass} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
            <button onClick={() => createMutation.mutate(newBundle)} disabled={createMutation.isPending || !newBundle.bundleKey || !newBundle.bundleName} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Bundle'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading bundles...</div>
      ) : (
        <div className="space-y-3">
          {(bundles as Bundle[]).map(bundle => (
            <div key={bundle.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleToggle(bundle.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedId === bundle.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  <Package size={20} className="text-blue-500" />
                  {editingBundle?.id === bundle.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input type="text" value={editingBundle.bundleName} onChange={e => setEditingBundle((p: Bundle | null) => p ? { ...p, bundleName: e.target.value } : null)} className="border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none w-48" />
                      <button onClick={() => updateMutation.mutate({ id: editingBundle.id, data: editingBundle })} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                      <button onClick={() => setEditingBundle(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-gray-900">{bundle.bundleName}</div>
                      <div className="text-xs text-gray-400">{bundle.bundleKey} · {bundle.category}</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditingBundle(bundle)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                  <button onClick={() => confirm('Delete bundle?') && deleteMutation.mutate(bundle.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                </div>
              </div>

              {expandedId === bundle.id && (
                <div className="border-t border-gray-200 px-5 py-4">
                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left pb-2 text-xs font-semibold text-gray-500">Item</th>
                        <th className="text-left pb-2 text-xs font-semibold text-gray-500">SKU</th>
                        <th className="text-right pb-2 text-xs font-semibold text-gray-500">Qty</th>
                        <th className="text-right pb-2 text-xs font-semibold text-gray-500">Material</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bundleItems as BundleItemRow[]).map(item => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                          <td className="py-2 text-right">{item.qty}</td>
                          <td className="py-2 text-right">${item.baseMaterialCost?.toFixed(2)}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => deleteItemMutation.mutate(item.id)} className="p-1 text-gray-300 hover:text-red-500 rounded"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {showAddItem === bundle.id ? (
                    <div className="flex items-center gap-3 mt-2">
                      <select
                        value={newItemCatalogId}
                        onChange={e => setNewItemCatalogId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none"
                      >
                        <option value="">Select catalog item...</option>
                        {(catalogItems as CatalogItem[]).map(ci => (
                          <option key={ci.id} value={ci.id}>{ci.description} ({ci.sku})</option>
                        ))}
                      </select>
                      <input type="number" value={newItemQty} onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)} min="0.01" step="0.01" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none" />
                      <button
                        onClick={() => newItemCatalogId && addItemMutation.mutate({ bundleId: bundle.id, data: { catalogItemId: parseInt(newItemCatalogId), qty: newItemQty } })}
                        disabled={!newItemCatalogId}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button onClick={() => setShowAddItem(null)} className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddItem(bundle.id)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus size={14} /> Add Item to Bundle
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
