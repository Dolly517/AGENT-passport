import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Terminal,
  Zap,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';

interface LiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

interface ScenarioMeta {
  id: number;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  keyDemonstration: string;
}

export const LiveDemoModal: React.FC<LiveDemoModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  if (!isOpen) return null;

  const scenarios: ScenarioMeta[] = [
    {
      id: 1,
      title: 'Scenario 1: Successful Exchange & Data Minimization',
      badge: 'VERIFIED & MINIMIZED',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      description: 'Procurement Agent queries Supplier Security Status. Verified credentials, raw pentests hidden, only "PASSED" exchanged. Self-expiring task token granted.',
      keyDemonstration: 'Privacy Preservation & Temporary Task Expiry',
    },
    {
      id: 2,
      title: 'Scenario 2: Restricted Data & Smart Negotiation',
      badge: 'ALTERNATIVE SUGGESTED',
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      description: 'Procurement Agent demands raw confidential audit report. Access DENIED; platform suggests safe verification summary alternative.',
      keyDemonstration: 'Smart Permission Negotiation',
    },
    {
      id: 3,
      title: 'Scenario 3: Human Approval Escalation Queue',
      badge: 'APPROVAL REQUIRED',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      description: 'Finance Agent attempts wire disbursement transaction ($250,000). System halts execution and queues request for Administrator review.',
      keyDemonstration: 'Human-in-the-Loop Governance',
    },
    {
      id: 4,
      title: 'Scenario 4: Shadow Agent Detection & Quarantine',
      badge: 'ROGUE BLOCKED',
      badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30',
      description: 'Unregistered identity (agt_rogue_shadow_99) attempts to communicate with Security Agent. Flagged, blocked instantly, zero data leak.',
      keyDemonstration: 'Zero-Trust Identity Verification',
    },
    {
      id: 5,
      title: 'Scenario 5: Behaviour Anomaly & Trust Degradation',
      badge: 'ANOMALY CAUGHT',
      badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      description: 'Procurement Agent attempts to harvest confidential employee payroll data outside its declared purpose. Blocked; trust score docked 12.5 pts.',
      keyDemonstration: 'Dynamic Trust Score & Purpose Drift Detection',
    },
    {
      id: 6,
      title: 'Scenario 6: Emergency Security Kill Switch',
      badge: 'SYSTEM LOCKDOWN',
      badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      description: 'Administrator triggers emergency isolation protocol. All temporary tokens revoked instantly; all agent passports suspended.',
      keyDemonstration: 'Emergency Incident Containment',
    },
  ];

  const handleExecute = async () => {
    setIsRunning(true);
    setError(null);
    setScenarioResult(null);

    try {
      const res = await api.runDemoScenario(selectedScenario);
      setScenarioResult(res);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to execute scenario');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoState();
      setScenarioResult(null);
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const currentMeta = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-cyberpurple-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Live Hackathon Demonstration Engine</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-electric-100 text-electric-700 uppercase">
                  6 Core Scenarios
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interactive real-time execution across the 6-stage AI Agent Governance Pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-medium"
              title="Reset all agents to active verified state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset State</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenario Selector (Left Column) */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Governance Scenario
            </h3>
            {scenarios.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenario(sc.id);
                    setScenarioResult(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-electric-50/50 border-electric-500 shadow-sm ring-1 ring-electric-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">{sc.title.split(':')[0]}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed mb-2">{sc.description}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-electric-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-500"></span>
                    <span>Demonstrates: {sc.keyDemonstration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scenario Execution & Results (Right Column) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Active Scenario Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">{currentMeta.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentMeta.badgeColor}`}>
                  {currentMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4">{currentMeta.description}</p>

              {/* Execution Trigger Button */}
              <button
                onClick={handleExecute}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-electric-600/20 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Real Governance Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>RUN SCENARIO IN REAL TIME</span>
                  </>
                )}
              </button>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Pipeline Execution Stream */}
            {scenarioResult && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Summary Box */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Execution Result: {scenarioResult.result?.decision || scenarioResult.result?.status}</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">{scenarioResult.summary}</p>
                </div>

                {/* Pipeline Stages Walkthrough */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
                    6-Stage Security Pipeline Walkthrough
                  </h4>
                  <div className="space-y-2">
                    {scenarioResult.pipeline_steps?.map((step: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-electric-100 text-electric-700 flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{step.step.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {step.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Minimization Preview (if applicable) */}
                {scenarioResult.result?.data_minimization && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm text-xs">
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-electric-600" />
                      <span>Data Minimization & Privacy Preservation</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3 italic">
                      "{scenarioResult.result.data_minimization.minimization_rationale}"
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-700 mb-1.5">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Confidential Data Hidden ({scenarioResult.result.data_minimization.hidden_fields.length})</span>
                        </div>
                        <ul className="space-y-1 text-[10px] font-mono text-red-600">
                          {scenarioResult.result.data_minimization.hidden_fields.map((f: string) => (
                            <li key={f} className="flex items-center gap-1">
                              <span>✕</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mb-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Safe Summary Exchanged ({scenarioResult.result.data_minimization.shared_fields.length})</span>
                        </div>
                        <ul className="space-y-1 text-[10px] font-mono text-emerald-700">
                          {scenarioResult.result.data_minimization.shared_fields.map((f: string) => (
                            <li key={f} className="flex items-center gap-1">
                              <span>✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Exchanged verified payload snippet */}
                    {scenarioResult.result?.response_payload && (
                      <div className="mt-3 p-2.5 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px]">
                        <div className="text-[10px] text-slate-400 mb-1">// Transformed Output Received by Requesting Agent</div>
                        <pre className="overflow-x-auto">
                          {JSON.stringify(scenarioResult.result.response_payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Policy Engine: Real SQLite DB & Cryptographic Hash Chaining Enforced</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};

