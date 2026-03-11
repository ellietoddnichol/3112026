import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings, ClipboardList, FileText, FileCheck } from 'lucide-react';
import { projectsApi } from '../lib/api';
import ProjectSetup from '../components/project/ProjectSetup';
import TakeoffWorkspace from '../components/project/TakeoffWorkspace';
import ParserWorkspace from '../components/project/ParserWorkspace';
import ProposalView from '../components/project/ProposalView';

type Tab = 'setup' | 'takeoff' | 'parser' | 'proposal';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id!);
  const [activeTab, setActiveTab] = useState<Tab>('takeoff');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading project...</div>;
  if (!project) return <div className="p-6 text-red-500">Project not found</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Setup', icon: <Settings size={16} /> },
    { id: 'takeoff', label: 'Takeoff', icon: <ClipboardList size={16} /> },
    { id: 'parser', label: 'Parser', icon: <FileText size={16} /> },
    { id: 'proposal', label: 'Proposal', icon: <FileCheck size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.projectName}</h1>
            <p className="text-sm text-gray-500">{project.projectNumber} — {project.clientName || 'No client'}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {project.status}
          </span>
        </div>
        <div className="flex gap-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'setup' && <ProjectSetup project={project} />}
        {activeTab === 'takeoff' && <TakeoffWorkspace projectId={projectId} project={project} />}
        {activeTab === 'parser' && <ParserWorkspace projectId={projectId} />}
        {activeTab === 'proposal' && <ProposalView projectId={projectId} project={project} />}
      </div>
    </div>
  );
}
