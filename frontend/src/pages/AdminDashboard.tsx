import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Users, 
  ShieldAlert, 
  Settings, 
  Activity, 
  Database, 
  Cpu, 
  Terminal,
  RefreshCw
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { addToast } = useNotification();
  
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, logsRes, healthRes] = await Promise.all([
        axios.get('/api/v1/admin/stats'),
        axios.get('/api/v1/admin/users'),
        axios.get('/api/v1/admin/audit-logs'),
        axios.get('/api/v1/monitoring/health')
      ]);

      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setAuditLogs(logsRes.data);
      setSystemHealth(healthRes.data);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
      addToast("Access Denied", "Error loading administrative statistics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await axios.put(`/api/v1/admin/users/${userId}/role?role=${nextRole}`);
      addToast("Role Updated", `User role modified to ${nextRole}.`, "success");
      fetchAdminData();
    } catch (err) {
      addToast("Update Failed", "Could not toggle user role.", "error");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#08070d]">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Administrative Control Panel
          </h2>
          <p className="text-xs text-gray-400 mt-1">Supervise user registrations, audit logs, provider routing volumes, and system health.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="h-8 w-8 rounded-lg hover:bg-white/5 border border-border flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Platform Users", value: stats?.total_users || 0, icon: Users },
          { label: "Platform Workspaces", value: stats?.total_workspaces || 0, icon: Terminal },
          { label: "Database Connection", value: systemHealth?.db_connected ? "Connected" : "Disconnected", icon: Database, color: systemHealth?.db_connected ? "text-emerald-400" : "text-rose-400" },
          { label: "Redis Worker status", value: systemHealth?.redis_connected ? "Connected" : "Disconnected", icon: Activity, color: systemHealth?.redis_connected ? "text-emerald-400" : "text-rose-400" }
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="p-4 border border-border glass-panel rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">{s.label}</span>
                <span className={`text-lg font-extrabold text-white mt-1 block ${s.color || ''}`}>{s.value}</span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-border flex items-center justify-center text-gray-400">
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* User Management table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">User Accounts</h3>
          <div className="border border-border glass-panel rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-white/[0.02] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">User Email</th>
                  <th className="px-4 py-3">Platform Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-white/[0.005]">
                    <td className="px-4 py-3.5 font-medium text-gray-200">{usr.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        usr.role === 'ADMIN' 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] ${
                        usr.is_active ? 'text-emerald-400' : 'text-gray-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${usr.is_active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        {usr.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleRole(usr.id, usr.role)}
                        className="px-2.5 py-1 rounded bg-white/5 border border-border hover:bg-white/10 hover:border-purple-500/20 text-purple-300 font-semibold text-[10px] transition-all cursor-pointer"
                      >
                        Toggle Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System telemetry info */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Hardware Stats</h3>
          <div className="p-5 border border-border glass-panel rounded-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-gray-400">Host Platform:</span>
              <span className="font-semibold text-gray-200">{systemHealth?.platform}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">CPU Usage:</span>
                <span className="font-bold text-gray-200">{systemHealth?.cpu_percent}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-border">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${systemHealth?.cpu_percent || 0}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Memory Usage:</span>
                <span className="font-bold text-gray-200">{systemHealth?.memory_percent}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-border">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${systemHealth?.memory_percent || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Audit Logs */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">System Audit Logs</h3>
        <div className="border border-border glass-panel rounded-2xl overflow-hidden divide-y divide-border text-xs max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.005]">
              <div>
                <span className="font-bold text-gray-200 uppercase tracking-wider text-[10px]">{log.action}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{log.details}</p>
              </div>
              <div className="text-right text-[10px] text-gray-500">
                <span>{log.ip_address || "system"}</span>
                <span className="block mt-0.5">{new Date(log.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
