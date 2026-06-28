import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  FolderGit2, 
  Cpu, 
  Star, 
  History, 
  Terminal, 
  MessageSquare, 
  Github, 
  Settings, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    projectsCount: 0,
    reposCount: 0,
    aiRequests: 0,
    avgScore: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const analyticsRes = await axios.get('/api/v1/analytics/');
        const data = analyticsRes.data;
        
        // Count projects/repos inside current workspace
        const projCount = currentWorkspace?.projects?.length || 0;
        const reposCount = currentWorkspace?.projects?.reduce((acc, p) => acc + (p.files?.length > 0 ? 1 : 0), 0) || 0;

        setStats({
          projectsCount: projCount,
          reposCount: reposCount,
          aiRequests: data.total_requests || 0,
          avgScore: 78.5 // Average metric placeholder
        });

        // Set Chart Trend Data
        if (data.daily_request_trend) {
          setChartData(data.daily_request_trend.map((d: any) => ({
            name: d.date.split('-').slice(1).join('/'),
            requests: d.count
          })));
        }

        // Set Audit history feed
        const logsRes = await axios.get('/api/v1/admin/audit-logs');
        setActivities(logsRes.data.slice(0, 5));
      } catch (err) {
        console.error("Error loading dashboard metrics", err);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, currentWorkspace]);

  const quickActions = [
    { title: "Open Monaco Workspace", desc: "Launch the multi-file code editor.", icon: Terminal, path: "/workspace", color: "bg-purple-500/10 border-purple-500/20 text-purple-300" },
    { title: "AI Assistant Chat", desc: "Consult AI about design patterns.", icon: MessageSquare, path: "/chat", color: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
    { title: "Link GitHub Repo", desc: "Review branches and commit logs.", icon: Github, path: "/github", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
    { title: "Preferences", desc: "Customize API keys and details.", icon: Settings, path: "/settings", color: "bg-amber-500/10 border-amber-500/20 text-amber-300" }
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Welcome back, {user?.full_name || 'Developer'}
        </h2>
        <p className="text-xs text-gray-400 mt-1">Here is a quick snapshot of your active workspace operations.</p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: stats.projectsCount, icon: FolderGit2, border: "border-border" },
          { label: "Connected Repos", value: stats.reposCount, icon: Github, border: "border-border" },
          { label: "AI Call Requests", value: stats.aiRequests, icon: Cpu, border: "border-border" },
          { label: "Avg Review Score", value: `${stats.avgScore}%`, icon: Star, border: "border-purple-500/20 bg-purple-500/5 text-purple-300" }
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`p-4 border glass-panel rounded-2xl flex items-center justify-between ${m.border}`}>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">{m.label}</span>
                <span className="text-xl font-extrabold text-white mt-1 block">{m.value}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-border flex items-center justify-center text-gray-400">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions Grid */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="p-5 border border-border glass-panel rounded-2xl glass-panel-hover flex gap-4 text-left cursor-pointer"
                >
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{action.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{action.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Requests Chart preview */}
        <div className="p-5 border border-border glass-panel rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">AI Call Trend</h4>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="h-32 w-full mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#12101c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">No requests yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Recent Activity</h3>
        <div className="border border-border glass-panel rounded-2xl overflow-hidden divide-y divide-border">
          {activities.length > 0 ? (
            activities.map((act, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <div>
                    <h5 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{act.action}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">{act.details}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500">
                  {new Date(act.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-xs text-gray-500">No activity logged yet. Start coding!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
