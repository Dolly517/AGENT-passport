import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  RotateCw,
  Plus,
  QrCode,
  Key,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Download,
  Calendar,
  X,
  FileCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { Agent, AgentPassport, HealthCheckReport } from '../types';
import { PassportCard } from '../components/passports/PassportCard';
import { api } from '../services/api';

export const DigitalPassportsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHealthReport, setActiveHealthReport] = useState<HealthCheckReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Passport Generation State
  const [genAgentId, setGenAgentId] = useState('');
  const [genCertTier, setGenCertTier] = useState('Level 2: Enterprise Certified');
  const [genValidityDays, setGenValidityDays] = useState(365);
  const [genCapabilities, setGenCapabilities] = useState('supplier:read, security_verification:query, compliance:audit');
  const [genTools, setGenTools] = useState('VendorDB_API, Security_Verification_Query, Compliance_Verifier');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadPassports();
  }, []);

  const loadPassports = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgents();
      setAgents(data);
      if (data.length > 0 && !genAgentId) {
        setGenAgentId(data[0].agent_id);
      }
    } catch (err) {
      console.error('Failed to load agent passports', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async (passportId: string) => {
    try {
      const report = await api.runPassportHealthCheck(passportId);
      setActiveHealthReport(report);
      loadPassports();
    } catch (err: any) {
      alert(`Health check failed: ${err.message}`);
    }
  };

  const handleRenew = async (passportId: string) => {
    try {
      const res = await api.renewPassport(passportId);
      setNotification(`Passport ${passportId} successfully renewed until ${new Date(res.expires_at).toLocaleDateString()}`);
      setTimeout(() => setNotification(null), 4000);
      loadPassports();
    } catch (err: any) {
      alert(`Renewal failed: ${err.message}`);
    }
  };

  const handleGeneratePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const caps = genCapabilities.split(',').map((c) => c.trim()).filter(Boolean);
      const tools = genTools.split(',').map((t) => t.trim()).filter(Boolean);

      const res = await api.generatePassport({
        agent_id: genAgentId,
        certification_tier: genCertTier,
        validity_days: Number(genValidityDays),
        capabilities: caps,
        approved_tools: tools
      });

      setShowGenerateModal(false);
      setGeneratedCertificate(res.passport);
      setNotification(`Digital Agent Passport ${res.passport.passport_id} generated & certified!`);
      setTimeout(() => setNotification(null), 5000);
      loadPassports();
    } catch (err: any) {
      alert(`Passport generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Digital Agent Passports & Certification</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed identity credentials, RSA-SHA256 signatures, verification QR codes, and self-expiring validity keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* GENERATE PASSPORT BUTTON */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-electric-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Award className="w-4 h-4" />
            <span>Generate Digital Passport</span>
          </button>

          <button
            onClick={loadPassports}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Passports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          if (!agent.passport) return null;
          return (
            <PassportCard
              key={agent.passport.id}
              passport={agent.passport}
              agentName={agent.name}
              agentId={agent.agent_id}
              purpose={agent.purpose}
              trustScore={agent.trust_score}
              onHealthCheck={handleHealthCheck}
              onRenew={handleRenew}
            />
          );
        })}
      </div>

      {/* GENERATE DIGITAL PASSPORT MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-electric-600" />
                <h3 className="font-bold text-base text-slate-900">Generate Digital Passport & Certify Agent</h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePassport} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target AI Agent</label>
                <select
                  value={genAgentId}
                  onChange={(e) => setGenAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                >
                  {agents.map((a) => (
                    <option key={a.agent_id} value={a.agent_id}>
                      {a.name} ({a.agent_id}) - Current Trust: {a.trust_score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Certification Tier</label>
                  <select
                    value={genCertTier}
                    onChange={(e) => setGenCertTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="Level 1: Basic Verified">Level 1: Basic Verified Agent</option>
                    <option value="Level 2: Enterprise Certified">Level 2: Enterprise Certified (Standard)</option>
                    <option value="Level 3: Critical Infrastructure">Level 3: Critical Infrastructure (High Trust)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validity Period</label>
                  <select
                    value={genValidityDays}
                    onChange={(e) => setGenValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value={90}>90 Days (Quarterly TTL)</option>
                    <option value={180}>180 Days (Semi-Annual TTL)</option>
                    <option value={365}>365 Days (1 Year Certified)</option>
                    <option value={730}>730 Days (2 Years Long-Term)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Certified Capabilities (comma-separated)</label>
                <input
                  type="text"
                  value={genCapabilities}
                  onChange={(e) => setGenCapabilities(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved Autonomous Tools (comma-separated)</label>
                <input
                  type="text"
                  value={genTools}
                  onChange={(e) => setGenTools(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-[11px]"
                />
              </div>

              {/* Cryptographic Preview Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-electric-600" />
                  <span>Automated Cryptographic Generation:</span>
                </div>
                <p>• Creates unique passport certificate code e.g. <code className="text-electric-700 font-mono">PASS-AGENT-XXXX</code></p>
                <p>• Signs credentials with 2048-bit RSA key and SHA-256 digital signature</p>
                <p>• Binds verifiable QR data payload and logs event to hash-chained audit ledger</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg font-bold shadow-md shadow-electric-600/20 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating & Signing...' : 'Issue Certified Digital Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATED CERTIFICATE SHOWCASE MODAL */}
      {generatedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 mx-auto text-white">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Official Digital Agent Passport Certificate</h3>
              <p className="text-xs text-slate-500 font-mono">Certificate Authority Root: APEX-FIPS-186-4</p>
            </div>

            <div className="passport-card-gradient text-white rounded-xl p-5 border border-slate-700 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">PASSPORT IDENTIFIER</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">{generatedCertificate.passport_id}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {generatedCertificate.status.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">CERTIFIED AGENT</span>
                <span className="text-sm font-bold text-white">{generatedCertificate.agent_name}</span>
                <span className="text-xs text-slate-300 block font-mono mt-0.5">{generatedCertificate.agent_id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400 block font-sans">Certification Tier</span>
                  <span className="text-white font-bold">{generatedCertificate.certification_tier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Expiration Date</span>
                  <span className="text-white font-bold">{new Date(generatedCertificate.expires_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <span className="text-[9px] text-slate-400 font-mono block">DIGITAL SIGNATURE (SHA-256)</span>
                <div className="font-mono text-[10px] text-emerald-300 break-all bg-slate-950/70 p-2 rounded border border-slate-800">
                  {generatedCertificate.digital_signature}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setGeneratedCertificate(null)}
                className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Health Check Report Modal */}
      {activeHealthReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-electric-600" />
                <h3 className="font-bold text-base text-slate-900">Agent Passport Health Diagnostic</h3>
              </div>
              <button
                onClick={() => setActiveHealthReport(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  activeHealthReport.health_grade === 'HEALTHY'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : activeHealthReport.health_grade === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase font-semibold">Health Grade Classification</div>
                  <div className="text-xl font-black tracking-wider">{activeHealthReport.health_grade}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold">Reputation Score</div>
                  <div className="text-lg font-bold font-mono">{activeHealthReport.trust_score.toFixed(1)} / 100</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">PASSPORT ID</span>
                  <span className="font-mono font-bold">{activeHealthReport.passport_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">AGENT IDENTIFIER</span>
                  <span className="font-mono font-bold">{activeHealthReport.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SIGNATURE VALIDITY</span>
                  <span className="font-bold text-emerald-600">
                    {activeHealthReport.is_signature_valid ? 'Cryptographically Valid' : 'Corrupted'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ACTIVE VIOLATIONS</span>
                  <span className="font-bold font-mono">{activeHealthReport.active_violations}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                  Engine Diagnostic Findings
                </h4>
                <div className="space-y-1.5">
                  {activeHealthReport.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveHealthReport(null)}
                className="w-full mt-2 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
