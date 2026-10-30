import React, { useState } from 'react';
import {
  Search,
  Bell,
  Play,
  AlertTriangle,
  LogOut,
  CheckCircle,
  Clock,
  Sparkles,
  Bot,
  User as UserIcon,
  Shield,
  Layers
} from 'lucide-react';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  agentIdentity?: any | null;
  onOpenDemoModal: () => void;
  onAgentSelect: (agentId: string) => void;
  onRoleSelect: (roleEmail: string, rolePass: string) => void;
  onLogout: () => void;
  isEmergencyActive?: boolean;
  activeTemporaryTokensCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  agentIdentity,
  onOpenDemoModal,
  onAgentSelect,
  onRoleSelect,
  onLogout,
  isEmergencyActive = false,
  activeTemporaryTokensCount = 0,
}) => {
  const [showIdentityMenu, setShowIdentityMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAgent = Boolean(agentIdentity || currentUser?.role === 'ai_agent');

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents, passports, tasks, audit events..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Emergency Kill Switch Banner if Active */}
        {isEmergencyActive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold animate-pulse shadow-sm shadow-red-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>EMERGENCY KILL SWITCH ENGAGED</span>
          </div>
        )}

        {/* Active Task Tokens Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-electric-600" />
          <span>Active Grants:</span>
          <span className="font-semibold text-slate-900">{activeTemporaryTokensCount}</span>
        </div>

        {/* LIVE DEMO BUTTON */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-electric-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>LIVE HACKATHON DEMO</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
          </span>
        </button>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-electric-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Security Notifications</span>
                <span className="text-[10px] bg-electric-50 text-electric-700 font-semibold px-2 py-0.5 rounded">Live Feed</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs">
                <div className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-slate-800">Procurement Exchange Verified</p>
                    <p className="text-[11px] text-slate-500">Data minimization applied. Shared 'PASSED' certification.</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-slate-800">Approval Queue Item</p>
                    <p className="text-[11px] text-slate-500">Finance Agent requested $250,000 disbursement record.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Authenticated Persona / Role Menu */}
        <div className="relative">
          <button
            onClick={() => setShowIdentityMenu(!showIdentityMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs uppercase ${
                isAgent
                  ? 'bg-gradient-to-tr from-purple-600 to-electric-600 text-white shadow-sm'
                  : 'bg-electric-100 text-electric-700'
              }`}
            >
              {isAgent ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-bold text-slate-800 text-[11px] leading-tight truncate max-w-[140px]">
                {agentIdentity?.name || currentUser?.full_name?.split(' ')[0] || 'User'}
              </div>
              <div className="text-[10px] text-electric-600 font-medium font-mono">
                {agentIdentity?.passport_id || currentUser?.role || 'authenticated'}
              </div>
            </div>
          </button>

          {showIdentityMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {agentIdentity?.name || currentUser?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {agentIdentity?.passport_id ? `Passport: ${agentIdentity.passport_id}` : currentUser?.email}
                </p>
              </div>

              {/* Fast Persona Switcher: AI Agents */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Identity: Autonomous AI Agents
              </div>

              <button
                type="button"
                onClick={() => { onAgentSelect('agt_procurement_01'); setShowIdentityMenu(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-800">Procurement Agent</div>
                  <div className="text-[10px] text-slate-400 font-mono">PASS-PROC-9921 • Trust: 92.4</div>
                </div>
                {agentIdentity?.agent_id === 'agt_procurement_01' && (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { onAgentSelect('agt_security_02'); setShowIdentityMenu(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-800">Security Agent</div>
                  <div className="text-[10px] text-slate-400 font-mono">PASS-SECU-8842 • Trust: 96.8</div>
                </div>
                {agentIdentity?.agent_id === 'agt_security_02' && (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { onAgentSelect('agt_finance_03'); setShowIdentityMenu(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-800">Finance Agent</div>
                  <div className="text-[10px] text-slate-400 font-mono">PASS-FIN-7719 • Trust: 88.5</div>
                </div>
                {agentIdentity?.agent_id === 'agt_finance_03' && (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              {/* Fast Persona Switcher: Human Officers */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">
                Switch Identity: Human Officers
              </div>

              <button
                type="button"
                onClick={() => { onRoleSelect('admin@agentpassport.io', 'admin123'); setShowIdentityMenu(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-800">Administrator</div>
                  <div className="text-[10px] text-slate-400">Chief AI Safety Officer</div>
                </div>
                {!isAgent && currentUser?.role === 'administrator' && (
                  <CheckCircle className="w-4 h-4 text-electric-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { onRoleSelect('security@agentpassport.io', 'security123'); setShowIdentityMenu(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-800">Security Officer</div>
                  <div className="text-[10px] text-slate-400">SecOps Lead</div>
                </div>
                {!isAgent && currentUser?.role === 'security_officer' && (
                  <CheckCircle className="w-4 h-4 text-electric-600" />
                )}
              </button>

              <div className="border-t border-slate-100 mt-2 pt-1">
                <button
                  onClick={() => {
                    setShowIdentityMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
