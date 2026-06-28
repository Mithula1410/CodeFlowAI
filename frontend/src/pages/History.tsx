import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, Search, Calendar, Cpu } from 'lucide-react';

const HistoryLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/v1/admin/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch history logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#08070d]">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Audit logs
          </h2>
          <p className="text-xs text-gray-400 mt-1">Audit log of system activations, workspace revisions, and AI integrations.</p>
        </div>
        
        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="border border-border glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-white/[0.02] text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.005] transition-all">
                <td className="px-6 py-4 font-semibold text-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="uppercase tracking-wider text-[10px]">{log.action}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 leading-relaxed max-w-sm truncate" title={log.details}>
                  {log.details || 'No details provided.'}
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono">
                  {log.ip_address || 'system'}
                </td>
                <td className="px-6 py-4 text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No matching logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryLog;
