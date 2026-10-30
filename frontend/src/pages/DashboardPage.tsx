import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  ArrowLeftRight,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Play,
  Activity,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DashboardStats, AuditLog, SecurityAlert } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigate: (page: any) => void;
  onOpenDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenDemo }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, activityRes, analyticsRes] = await Promise.all([
        api.getStats(),
        api.getRecentActivity(),
        api.getAnalytics()
      ]);
      setStats(statsRes);
      setRecentAudits(activityRes.recent_audits || []);
      setRecentAlerts(activityRes.recent_alerts || []);
      setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeOutcomeData = analyticsData?.exchange_outcomes ? [
    { name: 'Allowed', value: analyticsData.exchange_outcomes.allowed, color: '#10B981' },
    { name: 'Denied', value: analyticsData.exchange_outcomes.denied, color: '#EF4444' },
    { name: 'Human Approval', value: analyticsData.exchange_outcomes.human_approval, color: '#F59E0B' },
    { name: 'Negotiated', value: analyticsData.exchange_outcomes.negotiated_alternatives, color: '#8B5CF6' },
  ] : [];

  const agentTrustComparisonData = analyticsData?.agent_trust_comparison || [
    { name: 'Procurement', trust_score: 92.4 },
    { name: 'Security', trust_score: 96.8 },
    { name: 'Finance', trust_score: 88.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 rounded-2xl p-6 text-white border border-navy-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-electric-500/20 text-electric-300 border border-electric-500/30">
              ZERO-TRUST AGENT GOVERNANCE
            </span>
            <span className="text-xs text-slate-400 font-mono">v1.0.0 Enterprise</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Agent Passport Exchange Command Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time identity verification, privacy-preserving data exchange, and behavioral risk monitoring for autonomous multi-agent ecosystems.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-electric-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Live Hackathon Demo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Agents */}
        <div
          onClick={() => onNavigate('agents')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-electric-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active AI Agents</span>
            <div className="w-8 h-8 rounded-lg bg-electric-50 text-electric-600 flex items-center justify-center group-hover:bg-electric-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.active_agents ?? 3}</span>
            <span className="text-xs text-slate-400">/ {stats?.total_agents ?? 3} total</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Identity Bound</span>
          </div>
        </div>

        {/* Card 2: Verified Passports */}
        <div
          onClick={() => onNavigate('passports')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-electric-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Digital Passports</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.verified_passports ?? 3}</span>
            <span className="text-xs text-emerald-600 font-semibold font-mono">RSA-SHA256</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Self-expiring TTL active</span>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Approval Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.pending_approvals ?? 1}</span>
            <span className="text-xs text-amber-600 font-semibold">Human-in-the-Loop</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <span>High-risk transactions held</span>
          </div>
        </div>

        {/* Card 4: Trust Score Average */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">System Trust Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.average_trust_score ?? 92.6}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <span>High Trust Tier (&gt;80)</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Agent Trust Benchmarks */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dynamic Agent Trust Scores</h3>
              <p className="text-xs text-slate-500">Calculated from verified compliance, task success, and anomaly events</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-electric-600 hover:text-electric-700 font-medium flex items-center gap-1"
            >
              <span>Detailed Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentTrustComparisonData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
                <Bar dataKey="trust_score" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Exchange Outcomes Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Exchange Decision Distribution</h3>
              <p className="text-xs text-slate-500">Enforcement of privacy & authorization</p>
            </div>
            <button
              onClick={() => onNavigate('exchanges')}
              className="text-xs text-electric-600 hover:text-electric-700 font-medium flex items-center gap-1"
            >
              <span>Exchange Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 flex flex-col justify-center">
            {exchangeOutcomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exchangeOutcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {exchangeOutcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">Loading outcome statistics...</div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Allowed (Data Minimized)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-slate-600">Smart Negotiated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Human Approval</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-slate-600">Denied / Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Streams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cryptographic Audit Trail Feed */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-electric-600" />
              <h3 className="text-sm font-bold text-slate-900">Live Hash-Chained Audit Trail</h3>
            </div>
            <button
              onClick={() => onNavigate('audit-trail')}
              className="text-xs text-electric-600 hover:text-electric-700 font-medium"
            >
              View Full Chain
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAudits.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{log.agent_id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.decision === 'ALLOWED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.decision === 'DENIED' || log.decision === 'BLOCKED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{log.reason}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security Alerts & Threat Center */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">Security Alerts & Threat Center</h3>
            </div>
            <button
              onClick={() => onNavigate('behaviour')}
              className="text-xs text-electric-600 hover:text-electric-700 font-medium"
            >
              Monitoring
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-50 border-orange-200 text-orange-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{alert.title}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/70">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{alert.description}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <span>Zero unresolved security threats in current epoch.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

