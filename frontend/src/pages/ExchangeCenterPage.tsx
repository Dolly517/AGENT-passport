import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';
import { Agent, ExchangeRequest } from '../types';
import { api } from '../services/api';

export const ExchangeCenterPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [requestingAgent, setRequestingAgent] = useState('agt_procurement_01');
  const [targetAgent, setTargetAgent] = useState('agt_security_02');
  const [requestedResource, setRequestedResource] = useState('supplier_security_audit');
  const [lastExchangeResult, setLastExchangeResult] = useState<ExchangeRequest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [agentList, exchangeList] = await Promise.all([
        api.getAgents(),
        api.getExchanges(20)
      ]);
      setAgents(agentList);
      setExchanges(exchangeList);
    } catch (err) {
      console.error('Failed to load exchanges', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastExchangeResult(null);

    try {
      const res = await api.requestExchange({
        requesting_agent_id: requestingAgent,
        target_agent_id: targetAgent,
        requested_resource: requestedResource,
        request_payload: {
          supplier_name: 'Nexus CyberLogistics LLC',
          timestamp: new Date().toISOString()
        }
      });
      setLastExchangeResult(res);
      loadData();
    } catch (err: any) {
      alert(`Exchange error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'ALLOWED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ALLOWED</span>;
      case 'DENIED':
      case 'BLOCKED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">{decision}</span>;
      case 'HUMAN_APPROVAL_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">APPROVAL REQUIRED</span>;
      case 'ALTERNATIVE_ACCESS_SUGGESTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">SMART NEGOTIATION</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{decision}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exchange Center & Data Minimization</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute policy-checked agent-to-agent communication with real-time privacy preservation and minimum-necessary-information sharing.
        </p>
      </div>

      {/* Two Column Layout: Request Playground on Left, Result / Minimization on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inter-Agent Exchange Playground */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <div className="w-8 h-8 rounded-lg bg-electric-100 text-electric-700 flex items-center justify-center font-bold">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Initiate Inter-Agent Exchange</h3>
                <p className="text-[11px] text-slate-500">Evaluates 6-stage pipeline before granting access</p>
              </div>
            </div>

            <form onSubmit={handleExecuteExchange} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Requesting Agent</label>
                <select
                  value={requestingAgent}
                  onChange={(e) => setRequestingAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-medium text-slate-800"
                >
                  {agents.map((a) => (
                    <option key={a.agent_id} value={a.agent_id}>
                      {a.name} ({a.agent_id}) - Trust: {a.trust_score.toFixed(1)}
                    </option>
                  ))}
                  <option value="agt_rogue_shadow_99">🚨 Rogue Shadow Agent (Unregistered)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Agent</label>
                <select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-medium text-slate-800"
                >
                  {agents.map((a) => (
                    <option key={a.agent_id} value={a.agent_id}>
                      {a.name} ({a.agent_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Requested Resource</label>
                <select
                  value={requestedResource}
                  onChange={(e) => setRequestedResource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-medium text-slate-800"
                >
                  <option value="supplier_security_audit">Supplier Security Status (Minimization Candidate)</option>
                  <option value="complete_security_audit_report">Complete Security Audit Report (Restricted Raw File)</option>
                  <option value="financial_records_vendor_wire_details">Financial Wire Disbursement (Human Approval Required)</option>
                  <option value="employee_personal_payroll_and_salary">Employee Salary & Payroll (Behavior Anomaly Drift)</option>
                  <option value="infrastructure_firewall_keys">Infrastructure Root Keys (Critical Asset)</option>
                </select>
              </div>

              {/* Pipeline Preview Info */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-electric-600" />
                  <span>Pipeline Enforcements:</span>
                </div>
                <p>1. Check Passport validity & digital signature</p>
                <p>2. Verify capabilities & organizational domain</p>
                <p>3. Apply automatic privacy data minimization</p>
                <p>4. Grant self-expiring temporary task token</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg font-bold shadow-md shadow-electric-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Governance Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Governed Exchange</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Exchange Result & Data Minimization Preview */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Governance Inspection & Minimization Preview</span>
              </h3>
              {lastExchangeResult && getDecisionBadge(lastExchangeResult.decision)}
            </div>

            {lastExchangeResult ? (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                {/* Result Reason Banner */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    lastExchangeResult.decision === 'ALLOWED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : lastExchangeResult.decision === 'ALTERNATIVE_ACCESS_SUGGESTED'
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : lastExchangeResult.decision === 'HUMAN_APPROVAL_REQUIRED'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>Task ID: {lastExchangeResult.task_id}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{lastExchangeResult.reason}</p>
                </div>

                {/* Smart Negotiation Box if Alternative Suggested */}
                {lastExchangeResult.suggested_alternative && (
                  <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 text-[11px]">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Smart Permission Negotiation Proposal</span>
                    </div>
                    <p className="text-[11px] text-purple-800">
                      {lastExchangeResult.suggested_alternative.negotiation_rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className="p-2 bg-white rounded border border-purple-100 text-red-600">
                        <span className="font-bold block">RESTRICTED RAW DATA:</span>
                        <span>{lastExchangeResult.suggested_alternative.requested_resource} (DENIED)</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-purple-100 text-emerald-600">
                        <span className="font-bold block">PROPOSED ALTERNATIVE:</span>
                        <span>{lastExchangeResult.suggested_alternative.suggested_resource} (ALLOWED)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy-Preserving Comparison Grid */}
                {lastExchangeResult.data_minimization && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider">
                        Minimum-Necessary Information Transformation
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {lastExchangeResult.data_minimization.transformation_applied}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Hidden Fields */}
                      <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-800 mb-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-red-600" />
                          <span>Confidential Data Withheld ({lastExchangeResult.data_minimization.hidden_fields.length})</span>
                        </div>
                        <ul className="space-y-1 text-[10px] font-mono text-red-600">
                          {lastExchangeResult.data_minimization.hidden_fields.map((f: string) => (
                            <li key={f} className="flex items-center gap-1">
                              <span>✕</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Shared Fields */}
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 mb-1.5">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sanitized Result Exchanged ({lastExchangeResult.data_minimization.shared_fields.length})</span>
                        </div>
                        <ul className="space-y-1 text-[10px] font-mono text-emerald-700">
                          {lastExchangeResult.data_minimization.shared_fields.map((f: string) => (
                            <li key={f} className="flex items-center gap-1">
                              <span>✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exchanged Response Payload */}
                {lastExchangeResult.response_payload && (
                  <div className="bg-slate-900 rounded-xl p-3 text-emerald-400 font-mono text-[11px]">
                    <div className="text-[10px] text-slate-400 mb-1 font-sans">// Actual Sanitized Payload Received by Agent</div>
                    <pre className="overflow-x-auto">
                      {JSON.stringify(lastExchangeResult.response_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Info className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs">Submit an exchange request to inspect the real-time governance decision,</p>
                <p className="text-[11px] text-slate-500 mt-0.5">data minimization transformer, and temporary task token issuance.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Exchanges Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Governed Exchanges</h3>
          <span className="text-[11px] text-slate-500 font-mono">Persisted in SQLite database</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Requesting Agent</th>
                <th className="py-3 px-4">Target Agent</th>
                <th className="py-3 px-4">Requested Resource</th>
                <th className="py-3 px-4">Governance Decision</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exchanges.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{ex.task_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{ex.requesting_agent_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{ex.target_agent_id}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{ex.requested_resource}</td>
                  <td className="py-3 px-4">{getDecisionBadge(ex.decision)}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                    {new Date(ex.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

