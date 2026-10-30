import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Power
} from 'lucide-react';
import { api } from '../services/api';

export const CommandCenterPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showKillModal, setShowKillModal] = useState(false);
  const [killReason, setKillReason] = useState('Critical Threat Containment Protocol');
  const [killScope, setKillScope] = useState('ALL');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadCommandCenter();
  }, []);

  const loadCommandCenter = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCommandCenterStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load command center status', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!confirmCheckbox && !status?.emergency_kill_switch?.is_active) {
      alert('Please check the confirmation box to authorize emergency protocol.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.toggleKillSwitch({
        scope: killScope,
        reason: killReason,
        confirmation: true,
      });
      setNotification(res.message);
      setTimeout(() => setNotification(null), 5000);
      setShowKillModal(false);
      setConfirmCheckbox(false);
      loadCommandCenter();
    } catch (err: any) {
      alert(`Emergency control failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isKillSwitchActive = status?.emergency_kill_switch?.is_active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Security Command Center</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Emergency response infrastructure, zero-trust traffic isolation kill switch, and cross-organization trust federation.
        </p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Emergency Kill Switch Hero Card */}
      <div
        className={`p-6 rounded-2xl border text-white transition-all shadow-xl ${
          isKillSwitchActive
            ? 'bg-gradient-to-r from-red-900 via-rose-950 to-red-900 border-red-700 animate-pulse'
            : 'bg-gradient-to-r from-navy-900 via-slate-900 to-navy-850 border-slate-700'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                  isKillSwitchActive
                    ? 'bg-red-500/20 text-red-200 border-red-500/40 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isKillSwitchActive ? '● EMERGENCY KILL SWITCH ACTIVE' : '● SYSTEM STANDBY: NORMAL OPERATIONS'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ISO 27001 Protocol</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight">Enterprise Agent Kill Switch Control</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When activated, immediately revokes all active temporary task permissions, suspends all digital agent passports, freezes inbound/outbound exchanges, and seals the event to the cryptographic audit log.
            </p>

            {isKillSwitchActive && (
              <div className="pt-2 text-xs font-mono text-red-200 space-y-1">
                <div>Activated By: {status.emergency_kill_switch.activated_by}</div>
                <div>Reason: {status.emergency_kill_switch.reason}</div>
              </div>
            )}
          </div>

          <div>
            {isKillSwitchActive ? (
              <button
                onClick={handleToggleKillSwitch}
                disabled={isProcessing}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Unlock className="w-4 h-4" />
                <span>DISENGAGE KILL SWITCH & RESTORE</span>
              </button>
            ) : (
              <button
                onClick={() => setShowKillModal(true)}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/40 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Power className="w-4 h-4" />
                <span>ENGAGE EMERGENCY KILL SWITCH</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Organization Trust Federation Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-electric-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cross-Organization Agent Trust Federation</h3>
              <p className="text-xs text-slate-500">
                Governs inter-enterprise agent data boundary crossings (Company A ↔ Company B).
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-electric-50 text-electric-700 font-bold px-2 py-0.5 rounded font-mono">
            3 Federated Orgs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {status?.organizations?.map((org: any) => (
            <div key={org.code} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{org.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    org.trust_tier === 'Enterprise'
                      ? 'bg-purple-100 text-purple-800'
                      : org.trust_tier === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {org.trust_tier}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-500">{org.code}</div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                <span className="text-slate-600">Cross-Org Sharing:</span>
                <span
                  className={`font-semibold ${
                    org.cross_org_allowed ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {org.cross_org_allowed ? 'ALLOWED (Zero-Trust)' : 'STRICTLY BLOCKED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Kill Switch */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-xs">
            <div className="flex items-center gap-2.5 text-red-600 font-bold text-base mb-2">
              <AlertOctagon className="w-5 h-5" />
              <span>Confirm Emergency Kill Switch</span>
            </div>

            <p className="text-slate-600 mb-4 leading-relaxed">
              You are about to initiate an immediate enterprise lockdown. All inter-agent traffic will be suspended and existing temporary access tokens will be terminated.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope</label>
                <select
                  value={killScope}
                  onChange={(e) => setKillScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="ALL">All Agents (System-wide Isolation)</option>
                  <option value="agt_procurement_01">Procurement Agent Only</option>
                  <option value="agt_security_02">Security Agent Only</option>
                  <option value="agt_finance_03">Finance Agent Only</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Activation</label>
                <input
                  type="text"
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirm-kill"
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="confirm-kill" className="text-red-800 font-medium cursor-pointer">
                  I understand this immediately halts mission-critical automated agent workflows.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowKillModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Abort
                </button>
                <button
                  onClick={handleToggleKillSwitch}
                  disabled={!confirmCheckbox || isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md shadow-red-600/30 disabled:opacity-40"
                >
                  {isProcessing ? 'Triggering Protocol...' : 'CONFIRM EMERGENCY SHUTDOWN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

