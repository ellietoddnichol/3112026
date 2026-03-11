import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, RefreshCw } from 'lucide-react';
import { settingsApi, syncApi } from '../lib/api';
import type { Settings } from '../types';

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const set = (field: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev: Partial<Settings>) => ({ ...prev, [field]: e.target.value }));

  const handleSync = async (type: 'catalog' | 'full') => {
    setSyncStatus('Syncing...');
    try {
      const result = type === 'full' ? await syncApi.fullSync() : await syncApi.syncCatalog();
      setSyncStatus(result.message || 'Done');
    } catch {
      setSyncStatus('Sync failed');
    }
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name</label>
              <input type="text" value={form.companyName ?? ''} onChange={set('companyName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={form.companyPhone ?? ''} onChange={set('companyPhone')} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address</label>
              <input type="text" value={form.companyAddress ?? ''} onChange={set('companyAddress')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.companyEmail ?? ''} onChange={set('companyEmail')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Logo URL</label>
              <input type="text" value={form.logoUrl ?? ''} onChange={set('logoUrl')} className={inputClass} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Default Markup & Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Labor Burden %</label>
              <input
                type="number" step="0.1"
                value={form.defaultLaborBurdenPercent ?? ''}
                onChange={e => setForm((p: Partial<Settings>) => ({ ...p, defaultLaborBurdenPercent: parseFloat(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Overhead %</label>
              <input
                type="number" step="0.1"
                value={form.defaultOverheadPercent ?? ''}
                onChange={e => setForm((p: Partial<Settings>) => ({ ...p, defaultOverheadPercent: parseFloat(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Profit %</label>
              <input
                type="number" step="0.1"
                value={form.defaultProfitPercent ?? ''}
                onChange={e => setForm((p: Partial<Settings>) => ({ ...p, defaultProfitPercent: parseFloat(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tax %</label>
              <input
                type="number" step="0.1"
                value={form.defaultTaxPercent ?? ''}
                onChange={e => setForm((p: Partial<Settings>) => ({ ...p, defaultTaxPercent: parseFloat(e.target.value) }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Proposal Text</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Proposal Introduction</label>
              <textarea value={form.proposalIntro ?? ''} onChange={set('proposalIntro')} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Terms & Conditions</label>
              <textarea value={form.proposalTerms ?? ''} onChange={set('proposalTerms')} rows={3} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Google Sheets Sync</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure <code className="bg-gray-100 px-1 rounded">GOOGLE_SHEETS_ID</code> and <code className="bg-gray-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT</code> in your server's <code className="bg-gray-100 px-1 rounded">.env</code> file to enable sync.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSync('catalog')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw size={15} /> Sync Catalog
            </button>
            <button
              type="button"
              onClick={() => handleSync('full')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw size={15} /> Full Sync
            </button>
            {syncStatus && <span className="text-sm text-gray-500">{syncStatus}</span>}
          </div>
        </div>

        {updateMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Failed to save settings.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-green-600">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}
