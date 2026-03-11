import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, FolderOpen, BookOpen, Package, Settings as SettingsIcon, Sun } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Catalog from './pages/Catalog';
import Bundles from './pages/Bundles';
import SettingsPage from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/catalog', label: 'Catalog', icon: BookOpen },
    { to: '/bundles', label: 'Bundles', icon: Package },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <Sun className="text-yellow-400" size={24} />
        <span className="text-xl font-bold">Brighten Install</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0 — Phase 1
      </div>
    </aside>
  );
}

function NewProjectButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/projects/new')}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <FolderOpen size={16} />
      New Project
    </button>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-auto">
        <div className="flex items-center justify-end px-6 py-3 bg-white border-b border-gray-200">
          <NewProjectButton />
        </div>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectWorkspace />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
