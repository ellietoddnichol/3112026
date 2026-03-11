import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { projectsApi } from '../lib/api';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    projectNumber: '',
    projectName: '',
    clientName: '',
    estimator: '',
    bidDate: '',
    dueDate: '',
    address: '',
    projectType: '',
    projectSize: 'medium',
    floorLevel: 'ground',
    accessDifficulty: 'standard',
    installHeight: 'standard',
    materialHandling: 'standard',
    wallSubstrate: 'drywall',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => navigate(`/projects/${project.id}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectNumber || !form.projectName) return;
    createMutation.mutate(form);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Number *</label>
              <input type="text" value={form.projectNumber} onChange={set('projectNumber')} className={inputClass} required placeholder="e.g. 2024-001" />
            </div>
            <div>
              <label className={labelClass}>Project Name *</label>
              <input type="text" value={form.projectName} onChange={set('projectName')} className={inputClass} required placeholder="e.g. City Hall Renovation" />
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
              <input type="text" value={form.projectType} onChange={set('projectType')} className={inputClass} placeholder="e.g. Healthcare, Education" />
            </div>
            <div>
              <label className={labelClass}>Project Size</label>
              <select value={form.projectSize} onChange={set('projectSize')} className={selectClass}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Site Conditions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Floor Level</label>
              <select value={form.floorLevel} onChange={set('floorLevel')} className={selectClass}>
                <option value="ground">Ground</option>
                <option value="upper">Upper Floor</option>
                <option value="high-rise">High Rise</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Access Difficulty</label>
              <select value={form.accessDifficulty} onChange={set('accessDifficulty')} className={selectClass}>
                <option value="standard">Standard</option>
                <option value="difficult">Difficult</option>
                <option value="very-difficult">Very Difficult</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Install Height</label>
              <select value={form.installHeight} onChange={set('installHeight')} className={selectClass}>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="overhead">Overhead</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Material Handling</label>
              <select value={form.materialHandling} onChange={set('materialHandling')} className={selectClass}>
                <option value="standard">Standard</option>
                <option value="difficult">Difficult</option>
                <option value="hoist-required">Hoist Required</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Wall Substrate</label>
              <select value={form.wallSubstrate} onChange={set('wallSubstrate')} className={selectClass}>
                <option value="drywall">Drywall</option>
                <option value="tile">Tile</option>
                <option value="cmu">CMU</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            className={inputClass}
            placeholder="Any additional notes..."
          />
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Failed to create project. Please try again.
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
