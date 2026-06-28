import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  LayoutDashboard, 
  Code, 
  MessageSquare, 
  BarChart3, 
  History, 
  Github, 
  Settings, 
  ShieldAlert, 
  LogOut,
  ChevronDown,
  Plus,
  Wifi,
  WifiOff
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const { wsConnected } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Code Workspace', path: '/workspace', icon: Code },
    { name: 'AI Assistant Chat', path: '/chat', icon: MessageSquare },
    { name: 'Usage Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Audit History', path: '/history', icon: History },
    { name: 'GitHub Connect', path: '/github', icon: Github },
    { name: 'Preferences', path: '/settings', icon: Settings },
  ];

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName, newWorkspaceDesc);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setShowWorkspaceModal(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08070d]">
      {/* Background Mesh */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 glow-orb" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-950/10 glow-orb" />

      {/* Left Sidebar */}
      <aside className="w-64 h-full border-r border-border glass-panel z-10 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 gap-2 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
              C
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              CodeFlow AI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/25' 
                      : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Panel Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 border border-rose-500/20 bg-rose-950/10 ${
                  location.pathname === '/admin' ? 'text-rose-300 bg-rose-500/15 border-rose-500/35' : 'text-gray-400 hover:text-rose-200'
                }`}
              >
                <ShieldAlert className="h-4.5 w-4.5" />
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-border bg-white/[0.01] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h5 className="text-xs font-semibold text-gray-200 truncate">{user?.full_name || 'Developer'}</h5>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-medium border border-border hover:bg-rose-950/10 hover:border-rose-900/30 text-gray-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 h-full flex flex-col overflow-hidden z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-border glass-panel flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Workspace dropdown selector */}
            <div className="relative flex items-center gap-2">
              <span className="text-xs text-gray-400">Workspace:</span>
              <div className="relative group">
                <select
                  value={currentWorkspace?.id || ''}
                  onChange={(e) => selectWorkspace(e.target.value)}
                  className="bg-white/5 border border-border rounded-lg text-xs font-semibold text-gray-200 px-3 py-1.5 pr-8 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-background text-gray-400">Select Workspace</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id} className="bg-[#12101c] text-gray-200">{w.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="h-7 w-7 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/20 transition-all cursor-pointer"
                title="Create Workspace"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* WebSocket Status indicators */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold transition-all ${
              wsConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              {wsConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Live Sync (WS Connected)
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 animate-pulse" />
                  Offline Mode
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 overflow-y-auto bg-transparent relative">
          {children}
        </main>
      </div>

      {/* Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 border border-border glass-panel rounded-2xl shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-100">Create New Workspace</h3>
            <p className="text-xs text-gray-400 mt-1">Workspaces coordinate multiple code generation, review, and documentation projects.</p>
            
            <form onSubmit={handleCreateWorkspace} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My SaaS Platform"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Contains codebases, chat contexts, and documentations for our platform."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
