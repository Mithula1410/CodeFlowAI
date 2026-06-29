import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import {
  Users, ShieldAlert, Terminal, RefreshCw,
  Database, Activity, Cpu, Server, CheckCircle, XCircle,
  UserCog, Clock
} from 'lucide-react';

/* ─── Progress Bar ───────────────────────────────────────────────── */
const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold ${value > 80 ? 'text-rose-400' : value > 60 ? 'text-amber-400' : 'text-gray-200'}`}>{value}%</span>
    </div>
    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value || 0}%` }}
      />
    </div>
  </div>
);

/* ─── Skeleton ───────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4"><div className="skeleton h-3 w-40 rounded" /></td>
    <td className="px-5 py-4"><div className="skeleton h-5 w-14 rounded-full" /></td>
    <td className="px-5 py-4"><div className="skeleton h-3 w-16 rounded" /></td>
    <td className="px-5 py-4 text-right"><div className="skeleton h-6 w-20 rounded-lg inline-block" /></td>
  </tr>
);

const AdminDashboard: React.FC = () => {
  const { addToast } = useNotification();

  const [stats,        setStats]        = useState<any>(null);
  const [usersList,    setUsersList]    = useState<any[]>([]);
  const [auditLogs,    setAuditLogs]    = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, usersRes, logsRes, healthRes] = await Promise.allSettled([
        axios.get('/api/v1/admin/stats'),
        axios.get('/api/v1/admin/users'),
        axios.get('/api/v1/admin/audit-logs'),
        axios.get('/api/v1/monitoring/health')
      ]);
      if (statsRes.status  === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status  === 'fulfilled') setUsersList(usersRes.value.data);
      if (logsRes.status   === 'fulfilled') setAuditLogs(logsRes.value.data);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value.data);
    } catch {
      addToast('Access Error', 'Failed to load admin data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await axios.put(`/api/v1/admin/users/${userId}/role?role=${nextRole}`);
      addToast('Role Updated', `User promoted to ${nextRole}.`, 'success');
      fetchAdminData(true);
    } catch {
      addToast('Update Failed', 'Could not change user role.', 'error');
    }
  };

  const statCards = [
    { label: 'Total Users',     value: stats?.total_users      || 0,                  icon: Users,    accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Workspaces',      value: stats?.total_workspaces || 0,                  icon: Terminal, accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'DB Status',       value: systemHealth?.db_connected    ? 'Online' : 'Offline', icon: Database, accent: systemHealth?.db_connected    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { label: 'Redis Status',    value: systemHealth?.redis_connected ? 'Online' : 'Offline', icon: Activity, accent: systemHealth?.redis_connected ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Admin Zone</span>
          </div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Control Panel
          </h1>
          <p className="text-xs text-gray-500 mt-1">User management, audit logs, provider routing, and system health.</p>
        </div>
        <button
          onClick={() => fetchAdminData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border border-white/[0.05] rounded-2xl bg-white/[0.02] space-y-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-6 w-16 rounded" />
          </div>
        )) : statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="p-4 border border-white/[0.06] glass-panel rounded-2xl flex items-center gap-3 card-glow">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${s.accent}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{s.label}</span>
                <span className={`text-lg font-black mt-0.5 block ${s.accent.includes('rose') ? 'text-rose-400' : s.accent.includes('emerald') ? 'text-emerald-400' : 'text-white'}`}>
                  {s.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ── Users Table ───────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">User Accounts</h3>
            <span className="ml-auto text-[10px] text-gray-600">{usersList.length} total</span>
          </div>
          <div className="border border-white/[0.06] glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />) :
                   usersList.length > 0 ? usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-5 py-3.5 text-gray-200 font-medium">{usr.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                          usr.role === 'ADMIN'
                            ? 'bg-rose-500/12 border-rose-500/25 text-rose-400'
                            : 'bg-blue-500/12 border-blue-500/25 text-blue-400'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {usr.is_active
                            ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                            : <XCircle    className="h-3 w-3 text-gray-500"     />
                          }
                          <span className={`text-[10px] font-semibold ${usr.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {usr.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleRole(usr.id, usr.role)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-300 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Toggle Role
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-xs text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── System Health ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">System Health</h3>
          </div>
          <div className="p-5 border border-white/[0.06] glass-panel rounded-2xl flex flex-col gap-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-3 rounded" />)}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.05]">
                  <span className="text-gray-400">Platform</span>
                  <span className="font-bold text-gray-200 font-mono text-[11px]">{systemHealth?.platform || 'N/A'}</span>
                </div>
                <ProgressBar label="CPU Usage"    value={systemHealth?.cpu_percent    || 0} color="bg-purple-500" />
                <ProgressBar label="Memory Usage" value={systemHealth?.memory_percent || 0} color="bg-indigo-500" />
                <ProgressBar label="Disk Usage"   value={systemHealth?.disk_percent   || 0} color="bg-blue-500"   />
                <div className="pt-2 border-t border-white/[0.05] flex flex-col gap-2">
                  {[
                    { label: 'Database',   ok: systemHealth?.db_connected    },
                    { label: 'Redis Cache',ok: systemHealth?.redis_connected },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">{label}</span>
                      <span className={`flex items-center gap-1.5 font-bold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {ok ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Audit Log Feed ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">System Audit Log</h3>
          <span className="ml-auto text-[10px] text-gray-600">{auditLogs.length} entries</span>
        </div>
        <div className="border border-white/[0.06] glass-panel rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
          <div className="divide-y divide-white/[0.04]">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="skeleton h-2 w-2 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-56 rounded" />
                </div>
              </div>
            )) : auditLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-white/[0.012] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">{log.action?.replace(/_/g, ' ')}</span>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{log.details || 'No details.'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-600 block">{log.ip_address || 'system'}</span>
                  <span className="text-[10px] text-gray-600 block mt-0.5">
                    {new Date(log.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
