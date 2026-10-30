import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  Key,
  Calendar,
  AlertTriangle,
  RotateCw,
  Cpu,
  CheckCircle,
  ExternalLink,
  Activity
} from 'lucide-react';
import { AgentPassport } from '../../types';

interface PassportCardProps {
  passport: AgentPassport;
  agentName: string;
  agentId: string;
  purpose: string;
  trustScore: number;
  onHealthCheck: (passportId: string) => void;
  onRenew: (passportId: string) => void;
}

export const PassportCard: React.FC<PassportCardProps> = ({
  passport,
  agentName,
  agentId,
  purpose,
  trustScore,
  onHealthCheck,
  onRenew,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showKeyDetails, setShowKeyDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">VERIFIED</span>;
      case 'suspended':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">SUSPENDED</span>;
      case 'expired':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">EXPIRED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">{status.toUpperCase()}</span>;
    }
  };

  const trustColor = trustScore >= 80 ? 'text-emerald-400' : trustScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const trustBarColor = trustScore >= 80 ? 'bg-emerald-400' : trustScore >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="passport-card-gradient text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden flex flex-col justify-between min-h-[360px] group transition-all duration-300 hover:shadow-2xl hover:border-electric-500/50">
      {/* Background Holographic Watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
        <ShieldCheck className="w-56 h-56 text-electric-400" />
      </div>

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 tracking-widest font-mono uppercase">DIGITAL AGENT PASSPORT</div>
              <div className="text-xs font-mono font-bold text-white tracking-wider">{passport.passport_id}</div>
            </div>
          </div>
          {getStatusBadge(passport.status)}
        </div>

        {/* Identity & Purpose */}
        <div className="mt-4">
          <div className="text-xs text-electric-400 font-mono tracking-tight">{agentId}</div>
          <h3 className="text-lg font-bold text-white tracking-tight">{agentName}</h3>
          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">{purpose}</p>
        </div>
      </div>

      {/* Middle Specs & Trust Meter */}
      <div className="my-4 py-3 px-3.5 bg-navy-900/60 rounded-xl border border-slate-700/50 space-y-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Dynamic Trust Score</span>
          <span className={`font-mono font-bold ${trustColor}`}>{trustScore.toFixed(1)} / 100</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${trustBarColor}`}
            style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-400">
          <div>
            <span className="text-slate-400 text-[10px] block">ISSUED</span>
            <span className="text-slate-200">{new Date(passport.issued_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">EXPIRES</span>
            <span className="text-slate-200">{new Date(passport.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Signature & Crypto Fingerprint */}
      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyDetails(!showKeyDetails)}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
            title="View cryptographic signature"
          >
            <Key className="w-3.5 h-3.5 text-electric-400" />
            <span>{passport.digital_signature.slice(0, 14)}...</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Display Verification QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onHealthCheck(passport.passport_id)}
            className="flex items-center gap-1 px-2.5 py-1 bg-electric-600/30 hover:bg-electric-600/50 text-electric-300 rounded-lg text-xs font-medium border border-electric-500/30 transition-colors"
            title="Run Real-Time Passport Health Diagnostic"
          >
            <Activity className="w-3 h-3" />
            <span>Health</span>
          </button>
          <button
            onClick={() => onRenew(passport.passport_id)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Renew Passport Validity (+365 days)"
          >
            <RotateCw className="w-3 h-3" />
            <span>Renew</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h4 className="font-bold text-base mb-1">Agent Identity Passport QR</h4>
            <p className="text-xs text-slate-500 mb-4 font-mono">{passport.passport_id}</p>

            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-navy-900" />
            </div>

            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 break-all text-left">
              {passport.qr_code_data}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Signature Detail Modal Overlay */}
      {showKeyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700">
            <h4 className="font-bold text-base mb-1 flex items-center gap-2 text-electric-400">
              <Key className="w-4 h-4" />
              <span>Cryptographic Identity Credentials</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 font-mono">{passport.passport_id}</p>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono">Digital Signature (SHA-256)</label>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 break-all">
                  {passport.digital_signature}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono">Public Key Certificate</label>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-300 break-all max-h-24 overflow-y-auto">
                  {passport.public_key}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowKeyDetails(false)}
              className="mt-5 w-full py-2 bg-electric-600 text-white rounded-lg text-xs font-semibold hover:bg-electric-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

