import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, X, Check, PowerOff, Tag } from 'lucide-react';
import { catalogApi } from '../lib/api';
import type { CatalogItem } from '../types';

export default function Catalog() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '', category: '', subcategory: '', description: '', manufacturer: '',
    model: '', unit: 'EA', baseMaterialCost: 0, baseLaborMinutes: 0, adaFlag: false, notes: '',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: catalogApi.categories,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['catalog', { search, category: categoryFilter, active: showAll ? undefined : true }],
    queryFn: () => catalogApi.list({
      search: search || undefined,
      category: categoryFilter || undefined,
      active: showAll ? undefined : true,
    }),
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      qc.invalidateQueries({ queryKey: ['catalog-categories'] });
      setShowAddForm(false);
      setNewItem({ sku: '', category: '', subcategory: '', description: '', manufacturer: '', model: '', unit: 'EA', baseMaterialCost: 0, baseLaborMinutes: 0, adaFlag: false, notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CatalogItem> }) => catalogApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      setEditingItem(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: catalogApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  });

  const handleCreate = () => {
    if (!newItem.sku || !newItem.description || !newItem.category) return;
    createMutation.mutate(newItem);
  };

  const inputClass = 'border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-gray-500 mt-1">{(items as CatalogItem[]).length} items</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New Catalog Item</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">SKU *</label><input type="text" value={newItem.sku} onChange={e => setNewItem(p => ({ ...p, sku: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Category *</label><input type="text" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Subcategory</label><input type="text" value={newItem.subcategory} onChange={e => setNewItem(p => ({ ...p, subcategory: e.target.value }))} className={inputClass} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Description *</label><input type="text" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Unit</label><input type="text" value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Manufacturer</label><input type="text" value={newItem.manufacturer} onChange={e => setNewItem(p => ({ ...p, manufacturer: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Model</label><input type="text" value={newItem.model} onChange={e => setNewItem(p => ({ ...p, model: e.target.value }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Material Cost</label><input type="number" step="0.01" value={newItem.baseMaterialCost} onChange={e => setNewItem(p => ({ ...p, baseMaterialCost: parseFloat(e.target.value) || 0 }))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Labor Minutes</label><input type="number" step="1" value={newItem.baseLaborMinutes} onChange={e => setNewItem(p => ({ ...p, baseLaborMinutes: parseFloat(e.target.value) || 0 }))} className={inputClass} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
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
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Categories</option>
          {(categories as string[]).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
          Show inactive
        </label>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading catalog...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Manufacturer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Labor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(items as CatalogItem[]).map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 ${!item.active ? 'opacity-50' : ''}`}>
                  {editingItem?.id === item.id ? (
                    <>
                      <td className="px-4 py-2"><input type="text" defaultValue={item.sku} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, sku: e.target.value } : null)} /></td>
                      <td className="px-4 py-2"><input type="text" defaultValue={item.description} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, description: e.target.value } : null)} /></td>
                      <td className="px-4 py-2"><input type="text" defaultValue={item.category} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, category: e.target.value } : null)} /></td>
                      <td className="px-4 py-2"><input type="text" defaultValue={item.manufacturer} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, manufacturer: e.target.value } : null)} /></td>
                      <td className="px-4 py-2"><input type="number" step="0.01" defaultValue={item.baseMaterialCost} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, baseMaterialCost: parseFloat(e.target.value) } : null)} /></td>
                      <td className="px-4 py-2"><input type="number" step="1" defaultValue={item.baseLaborMinutes} className={inputClass} onChange={e => setEditingItem((p: CatalogItem | null) => p ? { ...p, baseLaborMinutes: parseFloat(e.target.value) } : null)} /></td>
                      <td className="px-4 py-2">{item.unit}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => editingItem && updateMutation.mutate({ id: editingItem.id, data: editingItem })} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={15} /></button>
                          <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={15} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{item.sku}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        {item.adaFlag && <Tag size={10} className="inline text-blue-500 mr-1" />}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{item.category}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.manufacturer}</td>
                      <td className="px-4 py-2.5 text-right">${item.baseMaterialCost.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{item.baseLaborMinutes}m</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingItem(item)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                          {item.active && <button onClick={() => deactivateMutation.mutate(item.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><PowerOff size={15} /></button>}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
