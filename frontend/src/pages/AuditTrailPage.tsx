import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Hash,
  Link,
  Lock,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chainVerification, setChainVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [decisionFilter, agentFilter]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuditTrail({
        search: search || undefined,
        decision: decisionFilter || undefined,
        agent_id: agentFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setChainVerification(res);
    } catch (err: any) {
      alert(`Chain verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'ALLOWED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ALLOWED</span>;
      case 'DENIED':
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">{decision}</span>;
      case 'HUMAN_APPROVAL_REQUIRED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">APPROVAL QUEUED</span>;
      case 'ALTERNATIVE_ACCESS_SUGGESTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">NEGOTIATION</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{decision}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cryptographic Hash-Linked Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident audit ledger with backward SHA-256 block linking, searchable telemetry, and compliance export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Verify Hash Chain Button */}
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'Verifying Math...' : 'Verify Cryptographic Integrity'}</span>
          </button>

          {/* Export CSV Link */}
          <a
            href={api.getExportCsvUrl()}
            download="agent_passport_audit_trail.csv"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Hash Chain Integrity Status Banner */}
      {chainVerification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
            chainVerification.is_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">
                Cryptographic Audit Chain Integrity: {chainVerification.status}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5">
                {chainVerification.message}
              </p>
              <div className="font-mono text-[10px] text-slate-500 mt-1">
                Latest Block Hash: <span className="text-slate-800 font-bold">{chainVerification.latest_head_hash}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setChainVerification(null)}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Integrity Architecture Note */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
        <Lock className="w-4 h-4 text-electric-600 flex-shrink-0" />
        <span>
          <strong className="text-slate-700">Cryptographic Architecture Note:</strong> Each audit entry calculates{' '}
          <code className="text-electric-700 font-mono">entry_hash = SHA256(prev_hash + event_id + timestamp + payload)</code>.
          Hash chaining mathematically guarantees detection of any retrospective modifications.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
            placeholder="Search action, reason, task ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-electric-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOWED">Allowed</option>
            <option value="DENIED">Denied</option>
            <option value="HUMAN_APPROVAL_REQUIRED">Human Approval</option>
            <option value="ALTERNATIVE_ACCESS_SUGGESTED">Negotiated</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="">All Agents</option>
            <option value="agt_procurement_01">Procurement Agent</option>
            <option value="agt_security_02">Security Agent</option>
            <option value="agt_finance_03">Finance Agent</option>
          </select>

          <button
            onClick={loadAuditLogs}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Agent Identity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reason & Policy</th>
                <th className="py-3 px-4 text-right">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedEntry(log)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{log.event_id}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{log.agent_id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{log.action}</td>
                  <td className="py-3.5 px-4">{getDecisionBadge(log.decision)}</td>
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="text-slate-600 line-clamp-1">{log.reason}</p>
                    {log.policy_checked && (
                      <span className="font-mono text-[9px] text-electric-600 bg-electric-50 px-1 py-0.5 rounded mt-0.5 inline-block">
                        {log.policy_checked}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                    <span className="text-electric-600 font-bold">{log.entry_hash.slice(0, 10)}...</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Hash Inspector Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-700 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-electric-400" />
                <h3 className="font-bold text-base">Audit Block Inspector</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">EVENT ID</span>
                <span className="text-white font-bold">{selectedEntry.event_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TIMESTAMP</span>
                <span className="text-slate-200">{new Date(selectedEntry.timestamp).toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PREVIOUS BLOCK HASH (LINK)</span>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-400 break-all">
                  {selectedEntry.prev_hash}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CURRENT BLOCK HASH</span>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400 font-bold break-all">
                  {selectedEntry.entry_hash}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">FULL REASON & CONTEXT</span>
                <p className="font-sans text-xs text-slate-300 mt-0.5">{selectedEntry.reason}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-5 w-full py-2 bg-electric-600 hover:bg-electric-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

