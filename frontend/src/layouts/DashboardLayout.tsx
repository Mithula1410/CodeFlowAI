import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  WifiOff,
  Search,
  Bell,
  Command,
  X,
  Terminal,
  FolderGit2,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ─── Command Palette entries ──────────────────────────────────────────
const CMD_ENTRIES = [
  { label: 'Go to Dashboard',         path: '/dashboard',  icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Open Code Workspace',      path: '/workspace',  icon: Code,            group: 'Navigation' },
  { label: 'AI Assistant Chat',        path: '/chat',       icon: MessageSquare,   group: 'Navigation' },
  { label: 'Usage Analytics',          path: '/analytics',  icon: BarChart3,       group: 'Navigation' },
  { label: 'Audit History',            path: '/history',    icon: History,         group: 'Navigation' },
  { label: 'GitHub Connect',           path: '/github',     icon: Github,          group: 'Navigation' },
  { label: 'Preferences & Settings',   path: '/settings',   icon: Settings,        group: 'Navigation' },
  { label: 'Run Code Review',          path: '/workspace',  icon: Terminal,        group: 'Actions' },
  { label: 'View AI Telemetry',        path: '/analytics',  icon: TrendingUp,      group: 'Actions' },
  { label: 'Profile Settings',         path: '/settings',   icon: User,            group: 'Actions' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const { wsConnected } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Command Palette
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // Notification Panel
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Code review completed — 3 issues found', time: '2m ago', read: false, type: 'review' },
    { id: 2, text: 'GitHub sync successful for main branch', time: '15m ago', read: false, type: 'github' },
    { id: 3, text: 'AI model switched to Gemini 1.5 Pro', time: '1h ago', read: true, type: 'info' },
    { id: 4, text: 'New workspace "API Service" created', time: '3h ago', read: true, type: 'workspace' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { name: 'Dashboard',       path: '/dashboard',  icon: LayoutDashboard },
    { name: 'Code Workspace',  path: '/workspace',  icon: Code },
    { name: 'AI Chat',         path: '/chat',       icon: MessageSquare },
    { name: 'Analytics',       path: '/analytics',  icon: BarChart3 },
    { name: 'Audit History',   path: '/history',    icon: History },
    { name: 'GitHub',          path: '/github',     icon: Github },
    { name: 'Preferences',     path: '/settings',   icon: Settings },
  ];

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
        setCmdQuery('');
        setCmdIndex(0);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when command palette opens
  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50);
  }, [cmdOpen]);

  const filteredCmds = CMD_ENTRIES.filter(c =>
    c.label.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  const handleCmdNav = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { setCmdIndex(i => Math.min(i + 1, filteredCmds.length - 1)); }
    if (e.key === 'ArrowUp')   { setCmdIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filteredCmds[cmdIndex]) {
      navigate(filteredCmds[cmdIndex].path);
      setCmdOpen(false);
    }
  }, [filteredCmds, cmdIndex, navigate]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName, newWorkspaceDesc);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setShowWorkspaceModal(false);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08070d]">
      {/* Background */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      <div className="aurora-bg z-0" />
      <div className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full bg-purple-900/10 glow-orb" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[38%] h-[38%] rounded-full bg-blue-950/8 glow-orb-2" />
      <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full bg-emerald-950/6 glow-orb-2" />

      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`h-full border-r border-white/[0.055] glass-panel z-10 flex flex-col justify-between sidebar-transition ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 gap-3 border-b border-white/[0.055] shrink-0">
            <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/30 text-sm">
              CF
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400 whitespace-nowrap">
                CodeFlow AI
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ripple-container cursor-pointer ${
                    isActive 
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/25 nav-item-active shadow-sm shadow-purple-500/10' 
                      : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400 status-pulse text-purple-400" />
                  )}
                </Link>
              );
            })}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                title={sidebarCollapsed ? 'Admin Dashboard' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2 border ${
                  location.pathname === '/admin'
                    ? 'text-rose-300 bg-rose-500/12 border-rose-500/30'
                    : 'border-rose-500/15 bg-rose-950/8 text-gray-400 hover:text-rose-300 hover:bg-rose-950/15'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Admin Panel</span>}
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar Bottom: User + Collapse Toggle */}
        <div className="border-t border-white/[0.055] shrink-0">
          {/* User */}
          <div className={`p-3 flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <h5 className="text-xs font-semibold text-gray-200 truncate">{user?.full_name || 'Developer'}</h5>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Logout + Collapse */}
          <div className={`px-3 pb-3 flex gap-2 ${sidebarCollapsed ? 'flex-col items-center' : ''}`}>
            <button
              onClick={logout}
              title="Logout"
              className="flex items-center justify-center gap-2 flex-1 py-2 rounded-xl text-[10px] font-semibold border border-white/[0.055] hover:bg-rose-950/15 hover:border-rose-900/30 text-gray-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!sidebarCollapsed && 'Logout'}
            </button>
            <button
              onClick={() => setSidebarCollapsed(p => !p)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="h-8 w-8 shrink-0 rounded-xl border border-white/[0.055] bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-gray-200 flex items-center justify-center transition-all cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 h-full flex flex-col overflow-hidden z-10 min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/[0.055] glass-panel flex items-center justify-between px-5 gap-4 shrink-0">
          {/* Left: Workspace Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={currentWorkspace?.id || ''}
                onChange={(e) => selectWorkspace(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-semibold text-gray-200 pl-3 pr-7 py-2 focus:outline-none focus:border-purple-500/60 appearance-none cursor-pointer transition-all hover:border-white/15"
              >
                <option value="" disabled className="bg-[#12101c] text-gray-400">Select workspace</option>
                {workspaces.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#12101c] text-gray-200">{w.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowWorkspaceModal(true)}
              className="h-8 w-8 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
              title="Create workspace"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Center: Command Palette trigger */}
          <button
            onClick={() => { setCmdOpen(true); setCmdQuery(''); setCmdIndex(0); }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all text-xs cursor-pointer group"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search or run a command...</span>
            <span className="ml-4 flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          {/* Right: Status + Notifications */}
          <div className="flex items-center gap-3">
            {/* WS Status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-all ${
              wsConnected 
                ? 'bg-emerald-500/8 border-emerald-500/18 text-emerald-400' 
                : 'bg-rose-500/8 border-rose-500/18 text-rose-400'
            }`}>
              {wsConnected ? (
                <><Wifi className="h-2.5 w-2.5" /><span>Live</span></>
              ) : (
                <><WifiOff className="h-2.5 w-2.5 animate-pulse" /><span>Offline</span></>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(p => !p)}
                className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] text-gray-400 hover:text-gray-200 flex items-center justify-center transition-all cursor-pointer relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="notif-panel absolute right-0 top-11 w-80 border border-white/[0.08] glass-panel rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <h4 className="text-xs font-bold text-gray-200">Notifications</h4>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-purple-400 hover:text-purple-300 cursor-pointer transition-colors">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-gray-500 hover:text-gray-200 cursor-pointer transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`notif-item px-4 py-3 flex items-start gap-3 ${!n.read ? 'notif-unread' : 'border-l-2 border-transparent'}`}>
                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-purple-400' : 'bg-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] leading-relaxed ${!n.read ? 'text-gray-200' : 'text-gray-400'}`}>{n.text}</p>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative min-h-0">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* ── Command Palette ───────────────────────────────────────────────── */}
      {cmdOpen && (
        <div
          className="cmd-palette-backdrop fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={(e) => { if (e.target === e.currentTarget) setCmdOpen(false); }}
        >
          <div className="cmd-palette-panel w-full max-w-xl mx-4">
            <div className="border border-white/[0.1] glass-panel rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={cmdInputRef}
                  type="text"
                  placeholder="Search pages, actions..."
                  value={cmdQuery}
                  onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0); }}
                  onKeyDown={handleCmdNav}
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                />
                <div className="flex items-center gap-1 text-[10px] text-gray-600 border border-white/[0.06] rounded-md px-1.5 py-0.5 shrink-0">
                  ESC
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {filteredCmds.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-8">No results found.</p>
                ) : (
                  (() => {
                    const groups = [...new Set(filteredCmds.map(c => c.group))];
                    return groups.map(group => (
                      <div key={group}>
                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group}</div>
                        {filteredCmds.filter(c => c.group === group).map((cmd, i) => {
                          const globalIdx = filteredCmds.indexOf(cmd);
                          const Icon = cmd.icon;
                          return (
                            <button
                              key={i}
                              onMouseEnter={() => setCmdIndex(globalIdx)}
                              onClick={() => { navigate(cmd.path); setCmdOpen(false); }}
                              className={`cmd-result-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-y border-transparent cursor-pointer ${
                                globalIdx === cmdIndex ? 'active' : ''
                              }`}
                            >
                              <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className={globalIdx === cmdIndex ? 'text-gray-100' : 'text-gray-300'}>{cmd.label}</span>
                              {globalIdx === cmdIndex && (
                                <span className="ml-auto text-[10px] text-gray-500 border border-white/[0.06] rounded px-1.5 py-0.5">↵</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-gray-600">
                <span className="flex items-center gap-1"><span className="border border-white/[0.08] rounded px-1">↑↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className="border border-white/[0.08] rounded px-1">↵</span> Select</span>
                <span className="flex items-center gap-1"><span className="border border-white/[0.08] rounded px-1">ESC</span> Close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Workspace Modal ────────────────────────────────────────── */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md p-6 border border-white/[0.08] glass-panel rounded-2xl shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-gray-100">Create Workspace</h3>
              <button onClick={() => setShowWorkspaceModal(false)} className="text-gray-500 hover:text-gray-200 cursor-pointer transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">Workspaces group your projects, AI chats, and review sessions.</p>
            
            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My SaaS Platform"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Description <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                <textarea
                  placeholder="Describe your workspace purpose..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  rows={3}
                  className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-gray-200 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/[0.08] text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold btn-premium-gradient text-white cursor-pointer"
                >
                  Create Workspace
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
