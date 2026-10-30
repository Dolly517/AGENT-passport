import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Shield,
  CheckCircle,
  AlertOctagon,
  Lock,
  RotateCw,
  X,
  FileCode,
  Tag
} from 'lucide-react';
import { PolicyRule } from '../types';
import { api } from '../services/api';

export const PermissionManagerPage: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    rule_code: '',
    description: '',
    rule_type: 'ACCESS_CONTROL',
    action: 'DENY',
    severity: 'HIGH',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePolicy = async (policy: PolicyRule) => {
    try {
      await api.updatePolicy(policy.id, { is_active: !policy.is_active });
      loadPolicies();
    } catch (err: any) {
      alert(`Failed to update policy: ${err.message}`);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPolicy({
        ...newPolicy,
        action: newPolicy.action as any,
        severity: newPolicy.severity as any,
        is_active: true,
        condition_json: {}
      });
      setShowAddModal(false);
      setNewPolicy({
        name: '',
        rule_code: '',
        description: '',
        rule_type: 'ACCESS_CONTROL',
        action: 'DENY',
        severity: 'HIGH',
      });
      loadPolicies();
    } catch (err: any) {
      alert(`Failed to create policy: ${err.message}`);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Permission & Enterprise Policy Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic security guardrails, ABAC/RBAC conditions, and automated data governance policies.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-electric-600 hover:bg-electric-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-electric-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Policy Rule</span>
        </button>
      </div>

      {/* Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
              policy.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-electric-600 bg-electric-50 px-2 py-0.5 rounded">
                  {policy.rule_code}
                </span>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(policy.severity)}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      policy.action === 'DENY'
                        ? 'bg-red-100 text-red-800'
                        : policy.action === 'HUMAN_APPROVAL'
                        ? 'bg-amber-100 text-amber-800'
                        : policy.action === 'MINIMIZE'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {policy.action}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1">{policy.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{policy.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Type: {policy.rule_type}</span>

              {/* Active Toggle Switch */}
              <button
                onClick={() => handleTogglePolicy(policy)}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  policy.is_active ? 'bg-electric-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    policy.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Configure Custom Policy Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block Cross-Org PII Sharing"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rule Code (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POL_BLOCK_EXTERNAL_PII"
                  value={newPolicy.rule_code}
                  onChange={(e) => setNewPolicy({ ...newPolicy, rule_code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Guardrail Logic</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain under what conditions this rule triggers..."
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rule Type</label>
                  <select
                    value={newPolicy.rule_type}
                    onChange={(e) => setNewPolicy({ ...newPolicy, rule_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                  >
                    <option value="ACCESS_CONTROL">ACCESS_CONTROL</option>
                    <option value="DATA_SHARING">DATA_SHARING</option>
                    <option value="APPROVAL_REQUIREMENT">APPROVAL_REQUIREMENT</option>
                    <option value="TEMPORARY_ACCESS">TEMPORARY_ACCESS</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Action</label>
                  <select
                    value={newPolicy.action}
                    onChange={(e) => setNewPolicy({ ...newPolicy, action: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                  >
                    <option value="DENY">DENY</option>
                    <option value="HUMAN_APPROVAL">HUMAN_APPROVAL</option>
                    <option value="MINIMIZE">MINIMIZE</option>
                    <option value="ALLOW">ALLOW</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={newPolicy.severity}
                    onChange={(e) => setNewPolicy({ ...newPolicy, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-semibold shadow-md shadow-electric-600/20"
                >
                  Save Policy to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

