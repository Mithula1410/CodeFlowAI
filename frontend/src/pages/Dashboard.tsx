import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  FolderGit2, Cpu, Star, History,
  Terminal, MessageSquare, Github, Settings,
  TrendingUp, Zap, ArrowRight, Activity,
  Code2, BarChart3, CheckCircle2, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

/* ─── Animated Counter Hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

/* ─── Skeleton Card ─────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="p-4 border border-white/5 rounded-2xl bg-white/[0.02] space-y-3">
    <div className="skeleton h-3 w-24 rounded" />
    <div className="skeleton h-7 w-16 rounded" />
  </div>
);

/* ─── Stat Card ──────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, accent, delay = 0 }: any) => {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num, 1000 + delay);
  const display = typeof value === 'string' ? value : animated;

  return (
    <div
      className="p-5 border border-white/[0.06] rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm flex items-center gap-4 glass-panel-hover card-glow"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{label}</span>
        <span className="text-2xl font-black text-white mt-0.5 block counter-animate">{display}</span>
      </div>
    </div>
  );
};

/* ─── Quick Action Card ──────────────────────────────────────────── */
const ActionCard = ({ title, desc, icon: Icon, path, color, navigate }: any) => (
  <button
    onClick={() => navigate(path)}
    className="p-5 border border-white/[0.06] rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/25 glass-panel-hover ripple-container flex gap-4 text-left cursor-pointer w-full transition-all group"
  >
    <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{title}</h4>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed truncate">{desc}</p>
    </div>
    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all ml-auto shrink-0 self-center" />
  </button>
);

/* ─── Activity Dot ───────────────────────────────────────────────── */
const actColor: Record<string, string> = {
  login:        'bg-emerald-400',
  logout:       'bg-gray-500',
  code_review:  'bg-purple-400',
  generate:     'bg-blue-400',
  bug_detect:   'bg-rose-400',
  default:      'bg-purple-400',
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, repos: 0, aiRequests: 0, avgScore: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [greetEmoji] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    return '🌙';
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, logsRes] = await Promise.allSettled([
          axios.get('/api/v1/analytics/'),
          axios.get('/api/v1/admin/audit-logs')
        ]);

        if (analyticsRes.status === 'fulfilled') {
          const d = analyticsRes.value.data;
          setStats({
            projects: currentWorkspace?.projects?.length || 0,
            repos:    0,
            aiRequests: d.total_requests || 0,
            avgScore: 82,
          });
          if (d.daily_request_trend) {
            setChartData(d.daily_request_trend.map((x: any) => ({
              name: x.date.split('-').slice(1).join('/'),
              requests: x.count,
            })));
          }
        }

        if (logsRes.status === 'fulfilled') {
          setActivities(logsRes.value.data.slice(0, 6));
        }
      } catch (_) {}
      finally { setLoading(false); }
    };

    if (user) load();
  }, [user, currentWorkspace]);

  const quickActions = [
    { title: 'Code Workspace',    desc: 'Multi-file Monaco editor with AI.',        icon: Terminal,    path: '/workspace', color: 'bg-purple-500/10 border-purple-500/25 text-purple-300' },
    { title: 'AI Chat',           desc: 'Ask anything about your codebase.',        icon: MessageSquare, path: '/chat',    color: 'bg-blue-500/10 border-blue-500/25 text-blue-300' },
    { title: 'GitHub Connect',    desc: 'Review branches and commit logs.',          icon: Github,      path: '/github',   color: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' },
    { title: 'Analytics',         desc: 'Telemetry, costs, language breakdown.',     icon: BarChart3,   path: '/analytics',color: 'bg-amber-500/10 border-amber-500/25 text-amber-300' },
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-7 max-w-6xl mx-auto animate-fade-in">
      {/* ── Welcome ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.05]">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{greetEmoji} Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</p>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400">
            {user?.full_name || 'Developer'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 status-pulse text-emerald-400" />
          <span className="text-xs text-emerald-400 font-semibold">
            {currentWorkspace?.name || 'No workspace selected'}
          </span>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Active Projects" value={stats.projects}   icon={FolderGit2}   accent="bg-purple-500/10 border-purple-500/25 text-purple-300" delay={0}   />
            <StatCard label="Linked Repos"    value={stats.repos}      icon={Github}       accent="bg-blue-500/10 border-blue-500/25 text-blue-300"       delay={80}  />
            <StatCard label="AI Requests"     value={stats.aiRequests} icon={Cpu}          accent="bg-emerald-500/10 border-emerald-500/25 text-emerald-300" delay={160} />
            <StatCard label="Review Score"    value={`${stats.avgScore}%`} icon={Star}     accent="bg-amber-500/10 border-amber-500/25 text-amber-300"   delay={240} />
          </>
        )}
      </div>

      {/* ── Middle: Actions + Chart ──────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Quick Actions</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <ActionCard key={i} {...a} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* AI Trend Chart */}
        <div className="p-5 border border-white/[0.06] glass-panel rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">AI Call Trend</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Daily request volume</p>
            </div>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex-1 h-36 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f0d1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '11px' }}
                    cursor={{ stroke: 'rgba(139,92,246,0.2)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#dbGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <Activity className="h-6 w-6 text-gray-600" />
                <p className="text-xs text-gray-500">No data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Live Activity Feed ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Recent Activity</h3>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="border border-white/[0.06] glass-panel rounded-2xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="skeleton h-2 w-2 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-40 rounded" />
                    <div className="skeleton h-2.5 w-64 rounded" />
                  </div>
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {activities.map((act, i) => {
                const dot = actColor[act.action] || actColor.default;
                return (
                  <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.015] transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">{act.action?.replace(/_/g, ' ')}</h5>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{act.details || 'No details provided.'}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {new Date(act.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 flex flex-col items-center gap-3 text-center">
              <Code2 className="h-8 w-8 text-gray-700" />
              <p className="text-sm font-semibold text-gray-500">No activity yet</p>
              <p className="text-xs text-gray-600">Start by creating a workspace or running a code review.</p>
              <button
                onClick={() => navigate('/workspace')}
                className="mt-1 px-4 py-2 rounded-xl text-xs font-bold btn-premium-gradient text-white cursor-pointer"
              >
                Open Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
