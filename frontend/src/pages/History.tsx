import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Calendar, Filter, Download, ChevronDown, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

/* ─── Action colour map ─────────────────────────────────────────── */
const ACTION_META: Record<string, { color: string; dot: string; badge: string }> = {
  login:        { color: 'text-emerald-400', dot: 'bg-emerald-400', badge: 'badge-low' },
  logout:       { color: 'text-gray-400',    dot: 'bg-gray-500',    badge: 'badge-info' },
  register:     { color: 'text-blue-400',    dot: 'bg-blue-400',    badge: 'badge-info' },
  code_review:  { color: 'text-purple-400',  dot: 'bg-purple-400',  badge: 'badge-info' },
  generate:     { color: 'text-indigo-400',  dot: 'bg-indigo-400',  badge: 'badge-info' },
  bug_detect:   { color: 'text-rose-400',    dot: 'bg-rose-400',    badge: 'badge-critical' },
  delete:       { color: 'text-rose-400',    dot: 'bg-rose-500',    badge: 'badge-high' },
  update:       { color: 'text-amber-400',   dot: 'bg-amber-400',   badge: 'badge-medium' },
};

const getMeta = (action: string) =>
  ACTION_META[action?.toLowerCase()] ?? { color: 'text-gray-400', dot: 'bg-purple-500', badge: 'badge-info' };

/* ─── Skeleton row ──────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4"><div className="flex items-center gap-2"><div className="skeleton h-2 w-2 rounded-full" /><div className="skeleton h-3 w-24 rounded" /></div></td>
    <td className="px-5 py-4"><div className="skeleton h-3 w-48 rounded" /></td>
    <td className="px-5 py-4"><div className="skeleton h-3 w-20 rounded" /></td>
    <td className="px-5 py-4"><div className="skeleton h-3 w-32 rounded" /></td>
  </tr>
);

const HistoryLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    axios.get('/api/v1/admin/audit-logs')
      .then(r => setLogs(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  /* unique action types for filter */
  const actionTypes = ['all', ...Array.from(new Set(logs.map(l => l.action?.toLowerCase()).filter(Boolean)))];

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.ip_address?.includes(search);
    const matchFilter = filterAction === 'all' || log.action?.toLowerCase() === filterAction;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const csv = [
      ['Action', 'Details', 'IP', 'Date'].join(','),
      ...filtered.map(l => [l.action, `"${l.details || ''}"`, l.ip_address || '', l.created_at].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click();
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Audit History
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {loading ? 'Loading…' : `${filtered.length} records`} — system activations, workspace revisions, AI integrations
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search actions, details, IP…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full input-premium rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-200"
          />
        </div>

        {/* Action Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="input-premium rounded-xl pl-9 pr-8 py-2.5 text-xs text-gray-200 appearance-none cursor-pointer capitalize"
          >
            {actionTypes.map(a => (
              <option key={a} value={a} className="bg-[#12101c]">{a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="border border-white/[0.06] glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Details</th>
                <th className="px-5 py-4">IP Address</th>
                <th className="px-5 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginated.length > 0 ? (
                paginated.map((log) => {
                  const meta = getMeta(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.012] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${meta.badge}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 max-w-xs">
                        <span className="line-clamp-2 leading-relaxed">{log.details || 'No details provided.'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono text-gray-500 bg-white/[0.03] px-2 py-1 rounded-md">
                          {log.ip_address || 'system'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(log.created_at).toLocaleString('en', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-gray-700" />
                      <p className="text-sm text-gray-500 font-semibold">No matching records</p>
                      <p className="text-xs text-gray-600">Try adjusting your search or filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-white/[0.07] text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    page === p
                      ? 'bg-purple-600/25 text-purple-300 border border-purple-500/30'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-white/[0.07] text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;
