import {
  DashboardStats, Agent, AgentPassport, PolicyRule, ExchangeRequest,
  ApprovalRequest, TemporaryAccess, SecurityAlert, AuditLog,
  HealthCheckReport, SimulationResult, User
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('agent_passport_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  agentLogin: (data: { agent_id: string; secret_key?: string }) =>
    request<{ access_token: string; agent: any; user: User }>('/auth/agent-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAgentsListForLogin: () => request<any[]>('/auth/agents-list'),
  getMe: () => request<User>('/auth/me'),
  getDemoUsers: () => request<Array<{ email: string; role: string; full_name: string; demo_password: string }>>('/auth/demo-users'),

  // Dashboard
  getStats: () => request<DashboardStats>('/dashboard/stats'),
  getRecentActivity: () => request<{ recent_audits: AuditLog[]; recent_alerts: SecurityAlert[] }>('/dashboard/recent-activity'),

  // Agents
  getAgents: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return request<Agent[]>(`/agents?${query.toString()}`);
  },
  getAgent: (agentId: string) => request<Agent>(`/agents/${agentId}`),
  registerAgent: (agentData: Partial<Agent> & { validity_days?: number }) =>
    request<Agent>('/agents', { method: 'POST', body: JSON.stringify(agentData) }),
  updateAgent: (agentId: string, agentData: Partial<Agent>) =>
    request<Agent>(`/agents/${agentId}`, { method: 'PUT', body: JSON.stringify(agentData) }),
  changeAgentStatus: (agentId: string, status: string) =>
    request<{ message: string; status: string }>(`/agents/${agentId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  // Passports
  getPassports: () => request<AgentPassport[]>('/passports'),
  runPassportHealthCheck: (passportId: string) =>
    request<HealthCheckReport>(`/passports/${passportId}/health-check`),
  renewPassport: (passportId: string) =>
    request<{ message: string; expires_at: string }>(`/passports/${passportId}/renew`, {
      method: 'POST',
    }),
  generatePassport: (data: {
    agent_id: string;
    certification_tier: string;
    validity_days: number;
    capabilities?: string[];
    approved_tools?: string[];
    notes?: string;
  }) => request<{ message: string; passport: any }>('/passports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Exchanges
  requestExchange: (data: {
    requesting_agent_id: string;
    target_agent_id: string;
    requested_resource: string;
    task_id?: string;
    request_payload?: Record<string, any>;
  }) => request<ExchangeRequest>('/exchanges/request', { method: 'POST', body: JSON.stringify(data) }),
  getExchanges: (limit = 50) => request<ExchangeRequest[]>(`/exchanges?limit=${limit}`),
  previewMinimization: (data: { resource_type: string; sample_raw?: Record<string, any> }) =>
    request<any>('/exchanges/preview-minimization', { method: 'POST', body: JSON.stringify(data) }),

  // Approvals
  getApprovals: (status?: string) => {
    const query = status ? `?status_filter=${status}` : '';
    return request<ApprovalRequest[]>(`/approvals${query}`);
  },
  decideApproval: (approvalId: string, action: 'approve' | 'reject' | 'modify', comments?: string, modified_permissions?: any) =>
    request<{ message: string; approval: ApprovalRequest }>(`/approvals/${approvalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, comments, modified_permissions }),
    }),

  // Temporary Access
  getTemporaryAccess: () => request<TemporaryAccess[]>('/temporary-access'),
  revokeTemporaryAccess: (accessId: string) =>
    request<{ message: string }>(`/temporary-access/${accessId}/revoke`, { method: 'POST' }),

  // Permissions & Policies
  getPolicies: () => request<PolicyRule[]>('/permissions/policies'),
  createPolicy: (policy: Partial<PolicyRule>) =>
    request<PolicyRule>('/permissions/policies', { method: 'POST', body: JSON.stringify(policy) }),
  updatePolicy: (policyId: string, updates: Partial<PolicyRule>) =>
    request<PolicyRule>(`/permissions/policies/${policyId}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Analytics
  getAnalytics: () => request<any>('/analytics/overview'),

  // Behaviour Monitoring & Alerts
  getBehaviourEvents: () => request<any[]>('/behaviour/events'),
  getSecurityAlerts: () => request<SecurityAlert[]>('/behaviour/alerts'),
  resolveAlert: (alertId: string) =>
    request<{ message: string }>(`/behaviour/alerts/${alertId}/resolve`, { method: 'POST' }),

  // Policy Simulation
  runSimulation: (simData: { rule_code: string; hypothetical_action: string; apply_to_cross_org?: boolean }) =>
    request<SimulationResult>('/simulation/evaluate', { method: 'POST', body: JSON.stringify(simData) }),

  // Security Command Center
  getCommandCenterStatus: () => request<any>('/command-center/status'),
  toggleKillSwitch: (data: { scope: string; reason: string; confirmation: boolean }) =>
    request<{ message: string; status: string }>('/command-center/kill-switch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Trail
  getAuditTrail: (params?: { agent_id?: string; decision?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.agent_id) query.append('agent_id', params.agent_id);
    if (params?.decision) query.append('decision', params.decision);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<AuditLog[]>(`/audit-trail?${query.toString()}`);
  },
  verifyAuditChain: () => request<{ is_valid: boolean; total_records: number; status: string; genesis_hash: string; latest_head_hash: string; message: string }>('/audit-trail/verify-chain'),
  getExportCsvUrl: () => `${API_BASE}/audit-trail/export-csv`,

  // Hackathon Live Demo Runner
  runDemoScenario: (scenarioId: number) =>
    request<any>(`/demo/run-scenario/${scenarioId}`, { method: 'POST' }),
  resetDemoState: () => request<{ message: string }>('/demo/reset-state', { method: 'POST' }),
};

