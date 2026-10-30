import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Users,
  RotateCcw,
  CheckCircle2,
  Server,
  Lock,
  Building2,
  FileCode
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [notification, setNotification] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetBaseline = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetDemoState();
      setNotification(res.message);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Settings & Security Architecture</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global cryptographic parameters, authority certificates, and hackathon presentation credentials.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Demo Credentials Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-electric-600" />
          <h3 className="text-sm font-bold text-slate-900">Hackathon Presentation Credentials</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Pre-configured role accounts available for live evaluation and evaluation committee testing:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-electric-600 block mb-1 uppercase font-sans">
              Administrator Role
            </span>
            <div className="font-bold text-slate-800">admin@agentpassport.io</div>
            <div className="text-slate-500 text-[11px] mt-1">Password: admin123</div>
            <div className="text-[10px] text-slate-400 font-sans mt-2">
              Full authority, kill switch controls, policy changes.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-amber-600 block mb-1 uppercase font-sans">
              Security Officer Role
            </span>
            <div className="font-bold text-slate-800">security@agentpassport.io</div>
            <div className="text-slate-500 text-[11px] mt-1">Password: security123</div>
            <div className="text-[10px] text-slate-400 font-sans mt-2">
              Approvals queue, anomaly alerts, passport renewals.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-600 block mb-1 uppercase font-sans">
              Auditor / Viewer Role
            </span>
            <div className="font-bold text-slate-800">viewer@agentpassport.io</div>
            <div className="text-slate-500 text-[11px] mt-1">Password: viewer123</div>
            <div className="text-[10px] text-slate-400 font-sans mt-2">
              Read-only compliance checks, audit trail inspection.
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Key Architecture */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Key className="w-5 h-5 text-electric-600" />
          <h3 className="text-sm font-bold text-slate-900">Cryptographic Key Infrastructure</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 block">Agent Signature Scheme</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Passports are cryptographically signed using SHA-256 with 2048-bit RSA keys. Each exchange request validates the digital certificate before permitting access.
            </p>
            <div className="font-mono text-[10px] text-emerald-600 font-bold">
              Algorithm: RSA-SHA256 (FIPS 186-4 Compliant)
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 block">Audit Chain Hashing</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Every audit record is linked backwards to its predecessor using SHA-256 hash chaining, guaranteeing mathematical tamper detection across all recorded events.
            </p>
            <div className="font-mono text-[10px] text-electric-600 font-bold">
              Chain Genesis: 0000000000000000000000000000000000000000000000000000000000000000
            </div>
          </div>
        </div>
      </div>

      {/* Reset State Control */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Reset Demo State to Clean Baseline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Restores all 3 default agents to active status, re-verifies passports, and disengages the emergency kill switch.
          </p>
        </div>

        <button
          onClick={handleResetBaseline}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo Baseline</span>
        </button>
      </div>
    </div>
  );
};

