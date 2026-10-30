export type UserRole = 'administrator' | 'security_officer' | 'viewer' | 'ai_agent';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  domain: string;
  trust_tier: string;
  is_external: boolean;
  cross_org_allowed: boolean;
}

export interface AgentPassport {
  id: string;
  passport_id: string;
  agent_id: string;
  agent_name?: string;
  owner_name?: string;
  status: 'verified' | 'pending' | 'expired' | 'suspended' | 'revoked';
  digital_signature: string;
  public_key: string;
  qr_code_data: string;
  trust_score?: number;
  issued_at: string;
  expires_at: string;
  violation_count: number;
  health_status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  last_health_check?: any;
}

export interface Agent {
  id: string;
  agent_id: string;
  name: string;
  purpose: string;
  organization_id: string;
  owner_name: string;
  status: 'active' | 'suspended' | 'revoked';
  trust_score: number;
  approved_tools: string[];
  capabilities: string[];
  permissions: Record<string, string>;
  is_shadow: boolean;
  created_at: string;
  expires_at?: string;
  passport?: AgentPassport;
}

export interface PolicyRule {
  id: string;
  name: string;
  rule_code: string;
  description: string;
  rule_type: string;
  action: 'ALLOW' | 'DENY' | 'HUMAN_APPROVAL' | 'MINIMIZE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_active: boolean;
  condition_json: Record<string, any>;
  created_at: string;
}

export interface ExchangeRequest {
  id: string;
  task_id: string;
  requesting_agent_id: string;
  target_agent_id: string;
  requested_resource: string;
  status: 'COMPLETED' | 'DENIED' | 'PENDING_APPROVAL' | 'BLOCKED';
  decision: 'ALLOWED' | 'DENIED' | 'HUMAN_APPROVAL_REQUIRED' | 'ALTERNATIVE_ACCESS_SUGGESTED';
  reason: string;
  suggested_alternative?: {
    requested_resource: string;
    full_report_status: string;
    suggested_resource: string;
    allowed_fields: string[];
    denied_fields: string[];
    negotiation_rationale: string;
  };
  response_payload?: Record<string, any>;
  data_minimization?: {
    requested_fields: string[];
    shared_fields: string[];
    hidden_fields: string[];
    minimization_rationale: string;
    transformation_applied: string;
  };
  temporary_access_id?: string;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  exchange_request_id?: string;
  requesting_agent_id: string;
  target_agent_id: string;
  requested_resource: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  reason: string;
  comments?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface TemporaryAccess {
  id: string;
  task_id: string;
  requesting_agent_id: string;
  target_agent_id: string;
  allowed_resource: string;
  allowed_action: string;
  issue_time: string;
  expires_at: string;
  status: 'active' | 'expired' | 'revoked';
  revocation_reason?: string;
  time_remaining_seconds: number;
}

export interface SecurityAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  agent_id?: string;
  alert_type: string;
  status: 'open' | 'acknowledged' | 'resolved';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  event_id: string;
  timestamp: string;
  agent_id: string;
  action: string;
  target_agent_id?: string;
  requested_resource?: string;
  shared_resource?: string;
  decision: string;
  reason: string;
  policy_checked?: string;
  task_id?: string;
  prev_hash: string;
  entry_hash: string;
}

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  verified_passports: number;
  total_exchanges: number;
  pending_approvals: number;
  open_alerts: number;
  active_temporary_permissions: number;
  average_trust_score: number;
  emergency_kill_switch_active: boolean;
}

export interface HealthCheckReport {
  passport_id: string;
  agent_id: string;
  status: string;
  is_signature_valid: boolean;
  is_expired: boolean;
  active_violations: number;
  trust_score: number;
  health_grade: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  findings: string[];
  timestamp: string;
}

export interface SimulationResult {
  rule_code: string;
  hypothetical_action: string;
  affected_agent_ids: string[];
  allowed_count: number;
  denied_count: number;
  human_approval_count: number;
  blocked_workflows: string[];
  security_impact_summary: string;
  recommended_changes: string[];
  simulation_disclaimer: string;
}

