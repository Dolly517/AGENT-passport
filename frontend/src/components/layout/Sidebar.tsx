import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  Sliders,
  CheckSquare,
  BarChart3,
  Activity,
  Compass,
  AlertOctagon,
  FileText,
  Settings,
  Shield,
  Bot
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'agents'
  | 'passports'
  | 'exchanges'
  | 'permissions'
  | 'approvals'
  | 'analytics'
  | 'behaviour'
  | 'simulation'
  | 'command-center'
  | 'audit-trail'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  pendingApprovalsCount?: number;
  openAlertsCount?: number;
  isEmergencyActive?: boolean;
  authenticatedAgent?: any | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  pendingApprovalsCount = 0,
  openAlertsCount = 0,
  isEmergencyActive = false,
  authenticatedAgent = null,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'agents', label: 'Agent Registry', icon: Users },
    { id: 'passports', label: 'Digital Passports', icon: ShieldCheck },
    { id: 'exchanges', label: 'Exchange Center', icon: ArrowLeftRight },
    { id: 'permissions', label: 'Permission Manager', icon: Sliders },
    {
      id: 'approvals',
      label: 'Smart Approval Queue',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'analytics', label: 'Trust & Risk Analytics', icon: BarChart3 },
    {
      id: 'behaviour',
      label: 'Behaviour Monitoring',
      icon: Activity,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'simulation', label: 'Policy Simulation', icon: Compass },
    {
      id: 'command-center',
      label: 'Security Command Center',
      icon: AlertOctagon,
      badge: isEmergencyActive ? 'KILL SWITCH ACTIVE' : undefined,
      badgeColor: 'bg-red-600 text-white text-[10px] animate-pulse',
    },
    { id: 'audit-trail', label: 'Audit Trail', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-cyberpurple-500 flex items-center justify-center shadow-lg shadow-electric-600/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-tight text-sm">AGENT PASSPORT</span>
            <span className="text-[10px] bg-electric-500/20 text-electric-400 font-semibold px-1.5 py-0.5 rounded border border-electric-500/30">
              EXCHANGE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight">AI Identity & Trust</p>
        </div>
      </div>

      {/* Active AI Agent Session Badge if Logged in as Agent */}
      {authenticatedAgent && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-electric-950/60 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-0.5">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate">{authenticatedAgent.name}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>{authenticatedAgent.passport_id}</span>
            <span className="text-emerald-400 font-bold">{authenticatedAgent.trust_score.toFixed(1)} Trust</span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Governance & Exchange
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as PageId)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-electric-600/15 text-electric-400 border border-electric-500/30 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-electric-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-navy-800 bg-navy-850/60">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[11px] font-medium text-slate-300">Identity Fabric Active</span>
        </div>
        <p className="text-[10px] text-slate-400 italic leading-snug">
          "Trust Every Agent. Verify Every Action. Control Every Exchange."
        </p>
      </div>
    </aside>
  );
};
