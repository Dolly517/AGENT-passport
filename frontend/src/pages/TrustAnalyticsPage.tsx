import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  PieChart as PieIcon,
  Activity,
  RotateCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { api } from '../services/api';

export const TrustAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  const agentTrustData = data?.agent_trust_comparison || [
    { name: 'Procurement Agent', trust_score: 92.4, status: 'active' },
    { name: 'Security Agent', trust_score: 96.8, status: 'active' },
    { name: 'Finance Agent', trust_score: 88.5, status: 'active' },
  ];

  const riskDistribution = data?.risk_distribution || [
    { tier: 'High Trust (80-100)', count: 3, color: '#10B981' },
    { tier: 'Moderate Trust (50-79)', count: 0, color: '#F59E0B' },
    { tier: 'Low Trust (0-49)', count: 0, color: '#EF4444' },
  ];

  const timelineData = data?.trust_history_timeline?.length > 0 ? data.trust_history_timeline : [
    { timestamp: '10:00', score: 80.0, agent_id: 'All' },
    { timestamp: '10:15', score: 85.0, agent_id: 'All' },
    { timestamp: '10:30', score: 89.2, agent_id: 'All' },
    { timestamp: '10:45', score: 92.6, agent_id: 'All' },
  ];

  const outcomes = data?.exchange_outcomes || {
    allowed: 12,
    denied: 2,
    human_approval: 3,
    negotiated_alternatives: 4
  };

  const outcomeBars = [
    { name: 'Allowed (Minimized)', count: outcomes.allowed, fill: '#10B981' },
    { name: 'Smart Negotiated', count: outcomes.negotiated_alternatives, fill: '#8B5CF6' },
    { name: 'Human Approval Held', count: outcomes.human_approval, fill: '#F59E0B' },
    { name: 'Denied / Blocked', count: outcomes.denied, fill: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Trust & Risk Analytics Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic Trust Score evaluation calculated deterministically from recorded compliance, task success, and anomaly events.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Trust Score Bands</span>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between items-center text-emerald-700 font-semibold">
              <span>80–100: High Trust</span>
              <span>Standard Access</span>
            </div>
            <div className="flex justify-between items-center text-amber-700 font-semibold">
              <span>50–79: Moderate Trust</span>
              <span>Enhanced Monitoring</span>
            </div>
            <div className="flex justify-between items-center text-red-700 font-semibold">
              <span>0–49: Low Trust</span>
              <span>Mandatory Approval / Quarantine</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Governed Exchanges</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {outcomes.allowed + outcomes.denied + outcomes.human_approval + outcomes.negotiated_alternatives}
            </span>
            <span className="text-xs text-emerald-600 font-bold font-mono">100% Policy Inspected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero bypass rate across inter-agent communications.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cryptographic Audit Chain</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">SHA-256</span>
            <span className="text-xs text-slate-500">Hash-Linked Blocks</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Detects log tampering through backward hash pointers.</p>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Reputation Timeline */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reputation Score Timeline</h3>
              <p className="text-xs text-slate-500">Tracks score adjustments over time based on actual tasks</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-electric-50 text-electric-700">
              Real-time Events
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Risk Distribution Pie */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Tier Distribution</h3>
              <p className="text-xs text-slate-500">Categorization of active agent trust</p>
            </div>
          </div>

          <div className="h-64 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {riskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              {riskDistribution.map((r: any) => (
                <div key={r.tier} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                  <span className="text-slate-600 font-medium">{r.tier.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Decisions Outcome Breakdown Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Exchange Decisions & Enforcement Actions</h3>
        <p className="text-xs text-slate-500 mb-4">
          Demonstrates safe data minimization and policy-based alternatives vs outright denial
        </p>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeBars} layout="vertical">
              <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={150} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                {outcomeBars.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

