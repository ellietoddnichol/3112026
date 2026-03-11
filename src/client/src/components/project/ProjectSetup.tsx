import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';

interface Props {
  project: Project;
}

export default function ProjectSetup({ project }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...project });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm({ ...project }); }, [project.id]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.update(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Number</label>
              <input type="text" value={form.projectNumber} onChange={set('projectNumber')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Project Name</label>
              <input type="text" value={form.projectName} onChange={set('projectName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Client Name</label>
              <input type="text" value={form.clientName} onChange={set('clientName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Estimator</label>
              <input type="text" value={form.estimator} onChange={set('estimator')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bid Date</label>
              <input type="date" value={form.bidDate} onChange={set('bidDate')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address</label>
              <input type="text" value={form.address} onChange={set('address')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Project Type</label>
              <input type="text" value={form.projectType} onChange={set('projectType')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputClass}>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Site Conditions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Size</label>
              <select value={form.projectSize} onChange={set('projectSize')} className={inputClass}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Floor Level</label>
              <select value={form.floorLevel} onChange={set('floorLevel')} className={inputClass}>
                <option value="ground">Ground</option>
                <option value="upper">Upper Floor</option>
                <option value="high-rise">High Rise</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Access Difficulty</label>
              <select value={form.accessDifficulty} onChange={set('accessDifficulty')} className={inputClass}>
                <option value="standard">Standard</option>
                <option value="difficult">Difficult</option>
                <option value="very-difficult">Very Difficult</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Install Height</label>
              <select value={form.installHeight} onChange={set('installHeight')} className={inputClass}>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="overhead">Overhead</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Material Handling</label>
              <select value={form.materialHandling} onChange={set('materialHandling')} className={inputClass}>
                <option value="standard">Standard</option>
                <option value="difficult">Difficult</option>
                <option value="hoist-required">Hoist Required</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Wall Substrate</label>
              <select value={form.wallSubstrate} onChange={set('wallSubstrate')} className={inputClass}>
                <option value="drywall">Drywall</option>
                <option value="tile">Tile</option>
                <option value="cmu">CMU</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Markup & Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Labor Burden %</label>
              <input type="number" step="0.1" value={form.laborBurdenPercent} onChange={set('laborBurdenPercent')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Overhead %</label>
              <input type="number" step="0.1" value={form.overheadPercent} onChange={set('overheadPercent')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Profit %</label>
              <input type="number" step="0.1" value={form.profitPercent} onChange={set('profitPercent')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tax %</label>
              <input type="number" step="0.1" value={form.taxPercent} onChange={set('taxPercent')} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Notes</h3>
          <textarea value={form.notes} onChange={set('notes')} rows={3} className={inputClass} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
