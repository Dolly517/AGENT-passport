import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  CheckCircle,
  AlertTriangle,
  Ban,
  RotateCw,
  Cpu,
  Wrench,
  Lock,
  ExternalLink,
  Edit,
  X
} from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';

export const AgentRegistryPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // New Agent Form State
  const [newAgent, setNewAgent] = useState({
    agent_id: '',
    name: '',
    purpose: '',
    owner_name: '',
    approved_tools: '',
    capabilities: '',
    validity_days: 365,
  });

  useEffect(() => {
    loadAgents();
  }, [statusFilter]);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgents({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    try {
      await api.changeAgentStatus(agentId, newStatus);
      loadAgents();
    } catch (err: any) {
      alert(`Error updating agent status: ${err.message}`);
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tools = newAgent.approved_tools.split(',').map((t) => t.trim()).filter(Boolean);
      const caps = newAgent.capabilities.split(',').map((c) => c.trim()).filter(Boolean);

      await api.registerAgent({
        agent_id: newAgent.agent_id,
        name: newAgent.name,
        purpose: newAgent.purpose,
        owner_name: newAgent.owner_name,
        approved_tools: tools,
        capabilities: caps,
        validity_days: Number(newAgent.validity_days),
      });

      setShowAddModal(false);
      setNewAgent({
        agent_id: '',
        name: '',
        purpose: '',
        owner_name: '',
        approved_tools: '',
        capabilities: '',
        validity_days: 365,
      });
      loadAgents();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agent Identity Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered and cryptographically credentialed autonomous AI agents across the enterprise.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-electric-600 hover:bg-electric-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-electric-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New AI Agent</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAgents()}
            placeholder="Search by agent name, ID, or purpose..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-electric-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
          <button
            onClick={loadAgents}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Registry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Agent Identity</th>
                <th className="py-3 px-4">Purpose & Scope</th>
                <th className="py-3 px-4">Owner Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Passport ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-electric-100 text-electric-700 flex items-center justify-center font-bold text-xs">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{agent.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{agent.agent_id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{agent.purpose}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {agent.approved_tools?.slice(0, 2).map((tool) => (
                        <span key={tool} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-mono">
                          {tool}
                        </span>
                      ))}
                      {(agent.approved_tools?.length || 0) > 2 && (
                        <span className="text-[9px] text-slate-400 font-mono">
                          +{agent.approved_tools.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {agent.owner_name}
                  </td>

                  <td className="py-3.5 px-4">
                    {agent.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : agent.status === 'suspended' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        SUSPENDED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        REVOKED
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-mono font-bold">
                      <span
                        className={
                          agent.trust_score >= 80
                            ? 'text-emerald-600'
                            : agent.trust_score >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }
                      >
                        {agent.trust_score.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">/100</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-electric-600 font-medium">
                    {agent.passport?.passport_id || 'NOT_ISSUED'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {agent.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(agent.agent_id, 'suspended')}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold transition-colors"
                          title="Suspend Agent"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(agent.agent_id, 'active')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold transition-colors"
                          title="Activate Agent"
                        >
                          Activate
                        </button>
                      )}

                      {agent.status !== 'revoked' && (
                        <button
                          onClick={() => handleStatusChange(agent.agent_id, 'revoked')}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-semibold transition-colors"
                          title="Permanently Revoke Agent"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Register New AI Agent</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Agent Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audit Compliance Bot"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Agent ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. agt_compliance_04"
                    value={newAgent.agent_id}
                    onChange={(e) => setNewAgent({ ...newAgent, agent_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Owner / Organization Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal & Regulatory Compliance"
                  value={newAgent.owner_name}
                  onChange={(e) => setNewAgent({ ...newAgent, owner_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose & Bound Scope</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why this agent exists and what resources it operates on..."
                  value={newAgent.purpose}
                  onChange={(e) => setNewAgent({ ...newAgent, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved Tools (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. LegalDB_API, Regulation_Search, Policy_Verifier"
                  value={newAgent.approved_tools}
                  onChange={(e) => setNewAgent({ ...newAgent, approved_tools: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Capabilities (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. compliance:check, policy:verify, legal:query"
                  value={newAgent.capabilities}
                  onChange={(e) => setNewAgent({ ...newAgent, capabilities: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  Register & Issue Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
