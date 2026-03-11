import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Plus } from 'lucide-react';
import { catalogApi, takeoffApi } from '../../lib/api';
import type { CatalogItem, ItemVariant } from '../../types';

interface Props {
  projectId: number;
  roomId: number;
  onClose: () => void;
}

export default function AddLineModal({ projectId, roomId, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'catalog' | 'manual'>('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const [manualForm, setManualForm] = useState({
    description: '',
    sku: '',
    category: '',
    unit: 'EA',
    qty: 1,
    baseMaterialCost: 0,
    baseLaborMinutes: 0,
    notes: '',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: catalogApi.categories,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['catalog', { search, category: categoryFilter }],
    queryFn: () => catalogApi.list({ search: search || undefined, category: categoryFilter || undefined }),
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['variants', selectedItem?.id],
    queryFn: () => selectedItem ? catalogApi.getVariants(selectedItem.id) : Promise.resolve([]),
    enabled: !!selectedItem,
  });

  const addMutation = useMutation({
    mutationFn: takeoffApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['takeoff', projectId] });
      qc.invalidateQueries({ queryKey: ['project-summary', projectId] });
      onClose();
    },
  });

  const handleAddFromCatalog = () => {
    if (!selectedItem) return;
    const variant = (variants as ItemVariant[]).find(v => v.id === selectedVariantId);
    const materialCost = selectedItem.baseMaterialCost + (variant?.addMaterialCost ?? 0);
    const laborMins = selectedItem.baseLaborMinutes + (variant?.addLaborMinutes ?? 0);

    addMutation.mutate({
      projectId,
      roomId,
      description: selectedItem.description,
      sku: selectedItem.sku,
      category: selectedItem.category,
      subcategory: selectedItem.subcategory,
      qty,
      unit: selectedItem.unit,
      baseMaterialCost: materialCost,
      baseLaborMinutes: laborMins,
      catalogItemId: selectedItem.id,
      variantId: selectedVariantId,
    });
  };

  const handleAddManual = () => {
    if (!manualForm.description) return;
    addMutation.mutate({
      projectId,
      roomId,
      ...manualForm,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Takeoff Line</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-6 py-3 border-b border-gray-200">
          {(['catalog', 'manual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'catalog' ? 'From Catalog' : 'Manual Item'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {tab === 'catalog' ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {(categories as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {(items as CatalogItem[]).map(item => (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setSelectedVariantId(null); }}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                      selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.sku} — {item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${item.baseMaterialCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{item.baseLaborMinutes}min</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="font-medium text-blue-900">{selectedItem.description}</div>

                  {(variants as ItemVariant[]).length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Variant</label>
                      <select
                        value={selectedVariantId ?? ''}
                        onChange={e => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : null)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none"
                      >
                        <option value="">Base (no variant)</option>
                        {(variants as ItemVariant[]).map(v => (
                          <option key={v.id} value={v.id}>{v.optionLabel}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-600">Quantity</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={qty}
                      onChange={e => setQty(parseFloat(e.target.value) || 1)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none"
                    />
                    <span className="text-sm text-gray-500">{selectedItem.unit}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={manualForm.description}
                    onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={manualForm.sku}
                    onChange={e => setManualForm(p => ({ ...p, sku: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={manualForm.category}
                    onChange={e => setManualForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualForm.qty}
                    onChange={e => setManualForm(p => ({ ...p, qty: parseFloat(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={manualForm.unit}
                    onChange={e => setManualForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost (each)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.baseMaterialCost}
                    onChange={e => setManualForm(p => ({ ...p, baseMaterialCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labor Minutes (each)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={manualForm.baseLaborMinutes}
                    onChange={e => setManualForm(p => ({ ...p, baseLaborMinutes: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
            Cancel
          </button>
          <button
            onClick={tab === 'catalog' ? handleAddFromCatalog : handleAddManual}
            disabled={addMutation.isPending || (tab === 'catalog' && !selectedItem) || (tab === 'manual' && !manualForm.description)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Plus size={16} />
            {addMutation.isPending ? 'Adding...' : 'Add to Takeoff'}
          </button>
        </div>
      </div>
    </div>
  );
}
