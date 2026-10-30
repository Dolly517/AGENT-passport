import React, { useState } from 'react';
import {
  Compass,
  Play,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Ban,
  ArrowRight,
  Info,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { SimulationResult } from '../types';
import { api } from '../services/api';

export const PolicySimulationPage: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState('SIM_RESTRICT_EXTERNAL_FINANCE');
  const [hypotheticalAction, setHypotheticalAction] = useState('DENY');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const presets = [
    {
      code: 'SIM_RESTRICT_EXTERNAL_FINANCE',
      title: 'Complete Block on Cross-Org Financial Data',
      action: 'DENY',
      description: 'Hypothesize restricting all external and unverified partner agents from querying financial records, invoices, and wire details.',
    },
    {
      code: 'SIM_MANDATORY_PASSPORT_HEALTH_90',
      title: 'Enforce Strict 90+ Trust Score Threshold',
      action: 'HUMAN_APPROVAL',
      description: 'Evaluate what happens if all inter-agent operations demand an active trust score of at least 90.0.',
    },
    {
      code: 'SIM_RESTRICT_ALL_RAW_AUDITS',
      title: 'Mandate 100% Data Minimization on Pentest Logs',
      action: 'MINIMIZE',
      description: 'Prevent raw CVE vulnerabilities from ever traversing agent boundaries, converting all outputs to certified pass/fail grades.',
    },
  ];

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runSimulation({
        rule_code: selectedRule,
        hypothetical_action: hypotheticalAction,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Permission Simulation & What-If Engine</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Safely test enterprise policy modifications against live agent workloads and graph workflows without mutating real database states.
        </p>
      </div>

      {/* Safety Disclaimer Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="leading-relaxed">
          <span className="font-bold">Sandbox Isolation Guarantee:</span> All simulations run against an in-memory replica model. No live agent passports, active temporary permissions, or recorded trust scores are modified during what-if analysis.
        </p>
      </div>

      {/* Simulation Configuration & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Selector */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Select Simulation Hypothesis
          </h3>

          {presets.map((p) => {
            const isSelected = selectedRule === p.code;
            return (
              <button
                key={p.code}
                onClick={() => {
                  setSelectedRule(p.code);
                  setHypotheticalAction(p.action);
                  setResult(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-electric-50 border-electric-500 shadow-sm ring-1 ring-electric-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{p.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                    {p.action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{p.description}</p>
              </button>
            );
          })}

          <div className="pt-2">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-electric-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Workflow Graph...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>EXECUTE WHAT-IF SIMULATION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Simulation Impact Report */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-electric-600" />
                <span>Impact Assessment & Recommendations</span>
              </h3>
              {result && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  SIMULATION COMPLETE
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                {/* Impact Summary Banner */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Security Impact Summary
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {result.security_impact_summary}
                  </p>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Permitted Exchanges</span>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{result.allowed_count}</div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase text-red-800">Blocked Workflows</span>
                    <div className="text-xl font-bold font-mono text-red-700 mt-1">{result.denied_count}</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase text-amber-800">Human Escalations</span>
                    <div className="text-xl font-bold font-mono text-amber-700 mt-1">{result.human_approval_count}</div>
                  </div>
                </div>

                {/* Blocked Workflows List */}
                <div>
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                    <span>Workflows That Would Be Blocked</span>
                  </h4>
                  <div className="space-y-1.5">
                    {result.blocked_workflows.map((wf, i) => (
                      <div key={i} className="p-2 bg-red-50/50 border border-red-100 rounded-lg text-red-800 text-[11px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span>{wf}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Policy Changes */}
                <div>
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Platform Recommended Policy Adjustments</span>
                  </h4>
                  <div className="space-y-1.5">
                    {result.recommended_changes.map((rec, i) => (
                      <div key={i} className="p-2 bg-purple-50/50 border border-purple-100 rounded-lg text-purple-900 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">Select a hypothetical scenario to run graph simulation.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates throughput vs security posture in real time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

