import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Cpu, DollarSign, Languages, Activity } from 'lucide-react';

const COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/v1/analytics/');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#08070d]">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  // Formatting chart payloads
  const trendData = data?.daily_request_trend?.map((d: any) => ({
    date: d.date.split('-').slice(1).join('/'),
    calls: d.count
  })) || [];

  const langData = Object.entries(data?.language_distribution || {}).map(([key, val]) => ({
    name: key,
    value: val as any
  }));

  const actionData = Object.entries(data?.action_distribution || {}).map(([key, val]) => ({
    name: key.toUpperCase(),
    calls: val
  }));

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Workspace Telemetry
        </h2>
        <p className="text-xs text-gray-400 mt-1">Detailed statistics, estimated API usage costs, and language distributions.</p>
      </div>

      {/* Analytics Card headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-border glass-panel rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total AI Requests</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{data?.total_requests || 0}</span>
          </div>
        </div>

        <div className="p-4 border border-border glass-panel rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Estimated Costs</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">${data?.estimated_cost || '0.00'}</span>
          </div>
        </div>

        <div className="p-4 border border-border glass-panel rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Primary Language</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">
              {langData.length > 0 ? langData[0].name.toUpperCase() : 'None'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="p-5 border border-border glass-panel rounded-2xl">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Request Calls Trend (Daily)</h4>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#12101c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">No telemetry log found</div>
            )}
          </div>
        </div>

        {/* Action Type Bar Chart */}
        <div className="p-5 border border-border glass-panel rounded-2xl">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Distribution by Action Type</h4>
          <div className="h-64 w-full">
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} margin={{ left: -25 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#12101c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">No actions recorded</div>
            )}
          </div>
        </div>

        {/* Language distribution list */}
        <div className="p-5 border border-border glass-panel rounded-2xl md:col-span-2">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Languages Breakdown</h4>
          {langData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {langData.map((item, idx) => (
                <div key={idx} className="p-4 border border-border/60 rounded-xl bg-white/[0.01]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">{item.name}</span>
                  <span className="text-lg font-bold text-white mt-1 block">{item.value} files</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">No file languages registered yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
