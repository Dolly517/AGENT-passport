import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Zap,
  Key,
  Users,
  Bot,
  Building,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string, agentData?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'agent' | 'human'>('agent');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  // Agent Login State
  const [selectedAgentId, setSelectedAgentId] = useState('agt_procurement_01');
  const [agentSecretKey, setAgentSecretKey] = useState('');

  // Human Login State
  const [email, setEmail] = useState('admin@agentpassport.io');
  const [password, setPassword] = useState('admin123');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const list = await api.getAgentsListForLogin();
      setAvailableAgents(list);
    } catch {
      // Fallback defaults
      setAvailableAgents([
        {
          agent_id: 'agt_procurement_01',
          name: 'Procurement Agent',
          purpose: 'Supplier onboarding, contract negotiation & vendor compliance',
          trust_score: 92.4,
          passport_id: 'PASS-PROC-9921',
          owner_name: 'Supply Chain Operations'
        },
        {
          agent_id: 'agt_security_02',
          name: 'Security Agent',
          purpose: 'Vulnerability reviews, risk assessment & pentest audit validation',
          trust_score: 96.8,
          passport_id: 'PASS-SECU-8842',
          owner_name: 'Cyber Defense Division'
        },
        {
          agent_id: 'agt_finance_03',
          name: 'Finance Agent',
          purpose: 'Solvency validation, payment analysis & invoice audit verification',
          trust_score: 88.5,
          passport_id: 'PASS-FIN-7719',
          owner_name: 'Treasury Operations'
        }
      ]);
    }
  };

  const handleAgentLoginSubmit = async (agentIdToLogin?: string) => {
    const targetAgentId = agentIdToLogin || selectedAgentId;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.agentLogin({
        agent_id: targetAgentId,
        secret_key: agentSecretKey || undefined
      });
      localStorage.setItem('agent_passport_token', res.access_token);
      localStorage.setItem('agent_passport_identity', JSON.stringify(res.agent));
      onLoginSuccess(res.user, res.access_token, res.agent);
    } catch (err: any) {
      setError(err.message || 'Agent identity verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      localStorage.setItem('agent_passport_token', res.access_token);
      localStorage.removeItem('agent_passport_identity');
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickHumanLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login({ email: demoEmail, password: demoPass });
      localStorage.setItem('agent_passport_token', res.access_token);
      localStorage.removeItem('agent_passport_identity');
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-electric-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyberpurple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-600 to-cyberpurple-500 flex items-center justify-center shadow-lg shadow-electric-600/25 mx-auto">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">AGENT PASSPORT EXCHANGE</h1>
            <p className="text-xs text-electric-400 font-mono">Zero-Trust Identity, Authentication & Governance Platform</p>
          </div>
          <p className="text-xs text-slate-400 italic">
            "Trust Every Agent. Verify Every Action. Control Every Exchange."
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          {/* Identity Persona Selector Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 mb-5">
            <button
              type="button"
              onClick={() => { setLoginType('agent'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                loginType === 'agent'
                  ? 'bg-electric-600 text-white shadow-sm ring-1 ring-electric-500'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Sign In as AI Agent</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginType('human'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                loginType === 'human'
                  ? 'bg-navy-900 text-white shadow-sm ring-1 ring-navy-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Administrator / Security Officer</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 mb-4 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: AI AGENT IDENTITY LOGIN */}
          {loginType === 'agent' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Authenticate as an autonomous AI Agent user. The platform verifies your registered Digital Passport, cryptographic key, and approved tool capabilities before establishing session context.
              </div>

              {/* Certified AI Agents 1-Click Cards */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Certified AI Agent Identity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {availableAgents.slice(0, 3).map((agt) => {
                    const isSelected = selectedAgentId === agt.agent_id;
                    return (
                      <button
                        key={agt.agent_id}
                        type="button"
                        onClick={() => setSelectedAgentId(agt.agent_id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-electric-50/70 border-electric-500 ring-2 ring-electric-500/20 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs truncate">{agt.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="font-mono text-[10px] text-electric-600 mb-1.5 font-bold">
                          {agt.passport_id || agt.agent_id}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                          {agt.purpose}
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[10px]">
                          <span className="text-slate-400 font-sans">Trust Score</span>
                          <span className="font-mono font-bold text-emerald-600">{agt.trust_score.toFixed(1)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Agent Manual Token / Secret (Optional) */}
              <div className="pt-2 text-xs">
                <label className="font-semibold text-slate-700 block mb-1">
                  Cryptographic Agent Token / Private Key (Optional for Demo)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Auto-verifies with RSA-SHA256 signature by default"
                    value={agentSecretKey}
                    onChange={(e) => setAgentSecretKey(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Login Submit Button */}
              <button
                type="button"
                onClick={() => handleAgentLoginSubmit()}
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-electric-600 to-cyberpurple-600 hover:from-electric-700 hover:to-cyberpurple-700 text-white rounded-lg font-bold shadow-md shadow-electric-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
              >
                {isLoading ? (
                  <span>Verifying Digital Passport & Key...</span>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Authenticate as {availableAgents.find(a => a.agent_id === selectedAgentId)?.name || 'AI Agent'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: HUMAN ADMINISTRATOR LOGIN */}
          {loginType === 'human' && (
            <div className="space-y-4">
              <form onSubmit={handleHumanLoginSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Officer Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{isLoading ? 'Verifying Admin Access...' : 'Sign In as Security Officer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Human Accounts */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Quick Presentation Accounts
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickHumanLogin('admin@agentpassport.io', 'admin123')}
                    className="p-2 bg-electric-50 hover:bg-electric-100 text-electric-800 rounded-lg text-left border border-electric-200 transition-colors"
                  >
                    <div className="font-bold text-[11px]">Administrator</div>
                    <div className="text-[9px] text-slate-500">Full Authority</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickHumanLogin('security@agentpassport.io', 'security123')}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-left border border-amber-200 transition-colors"
                  >
                    <div className="font-bold text-[11px]">Security Officer</div>
                    <div className="text-[9px] text-slate-500">Approvals & Alerts</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickHumanLogin('viewer@agentpassport.io', 'viewer123')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-left border border-slate-200 transition-colors"
                  >
                    <div className="font-bold text-[11px]">Auditor</div>
                    <div className="text-[9px] text-slate-500">Read-Only Logs</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>Multi-Agent Zero-Trust Architecture • FIPS 186-4 Compliant</p>
          <p className="font-mono text-[10px]">FastAPI Backend • SQLite • Hash-Chained Audit Trail</p>
        </div>
      </div>
    </div>
  );
};
