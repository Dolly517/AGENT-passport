import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Auth
class UserLogin(BaseModel):
    email: str
    password: str

class AgentLoginRequest(BaseModel):
    agent_id: str
    secret_key: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None
    agent: Optional[Dict[str, Any]] = None

class PassportGenerateRequest(BaseModel):
    agent_id: str
    certification_tier: str = "Level 2: Enterprise Certified"
    validity_days: int = 365
    capabilities: List[str] = []
    approved_tools: List[str] = []
    notes: Optional[str] = None

# Agent
class AgentCreate(BaseModel):
    agent_id: str
    name: str
    purpose: str
    organization_id: Optional[str] = None
    owner_name: str
    approved_tools: List[str] = []
    capabilities: List[str] = []
    permissions: Dict[str, Any] = {}
    validity_days: int = 365

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    owner_name: Optional[str] = None
    status: Optional[str] = None
    approved_tools: Optional[List[str]] = None
    capabilities: Optional[List[str]] = None
    permissions: Optional[Dict[str, Any]] = None

class PassportResponse(BaseModel):
    id: str
    passport_id: str
    agent_id: str
    status: str
    digital_signature: str
    public_key: str
    qr_code_data: str
    issued_at: datetime.datetime
    expires_at: datetime.datetime
    violation_count: int
    health_status: str
    last_health_check: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AgentResponse(BaseModel):
    id: str
    agent_id: str
    name: str
    purpose: str
    organization_id: str
    owner_name: str
    status: str
    trust_score: float
    approved_tools: List[str]
    capabilities: List[str]
    permissions: Dict[str, Any]
    is_shadow: bool
    created_at: datetime.datetime
    expires_at: Optional[datetime.datetime] = None
    passport: Optional[PassportResponse] = None

    class Config:
        from_attributes = True

# Exchange
class ExchangeCreateRequest(BaseModel):
    requesting_agent_id: str
    target_agent_id: str
    requested_resource: str
    task_id: Optional[str] = None
    request_payload: Optional[Dict[str, Any]] = None

class DataMinimizationDetail(BaseModel):
    requested_fields: List[str]
    shared_fields: List[str]
    hidden_fields: List[str]
    minimization_rationale: str
    transformation_applied: str

class ExchangeResponse(BaseModel):
    id: str
    task_id: str
    requesting_agent_id: str
    target_agent_id: str
    requested_resource: str
    status: str
    decision: str
    reason: str
    suggested_alternative: Optional[Dict[str, Any]] = None
    response_payload: Optional[Dict[str, Any]] = None
    data_minimization: Optional[Dict[str, Any]] = None
    temporary_access_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Approval
class ApprovalActionRequest(BaseModel):
    action: str  # approve, reject, modify
    comments: Optional[str] = None
    modified_permissions: Optional[Dict[str, Any]] = None

class ApprovalResponse(BaseModel):
    id: str
    exchange_request_id: Optional[str] = None
    requesting_agent_id: str
    target_agent_id: str
    requested_resource: str
    risk_level: str
    status: str
    reason: str
    comments: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Temporary Access
class TemporaryAccessResponse(BaseModel):
    id: str
    task_id: str
    exchange_request_id: Optional[str] = None
    requesting_agent_id: str
    target_agent_id: str
    allowed_resource: str
    allowed_action: str
    issue_time: datetime.datetime
    expires_at: datetime.datetime
    status: str
    revocation_reason: Optional[str] = None
    time_remaining_seconds: Optional[int] = None

    class Config:
        from_attributes = True

# Policy
class PolicyRuleCreate(BaseModel):
    name: str
    rule_code: str
    description: str
    rule_type: str
    action: str
    severity: str = "HIGH"
    is_active: bool = True
    condition_json: Dict[str, Any] = {}

class PolicyRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    action: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    condition_json: Optional[Dict[str, Any]] = None

class PolicyRuleResponse(BaseModel):
    id: str
    name: str
    rule_code: str
    description: str
    rule_type: str
    action: str
    severity: str
    is_active: bool
    condition_json: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Simulation
class SimulationRequest(BaseModel):
    rule_code: str
    hypothetical_action: str
    apply_to_cross_org: bool = False
    custom_condition: Optional[Dict[str, Any]] = None

class SimulationImpact(BaseModel):
    affected_agent_ids: List[str]
    allowed_count: int
    denied_count: int
    human_approval_count: int
    blocked_workflows: List[str]
    security_impact_summary: str
    recommended_changes: List[str]

# Audit
class AuditLogResponse(BaseModel):
    id: str
    event_id: str
    timestamp: datetime.datetime
    agent_id: str
    action: str
    target_agent_id: Optional[str] = None
    requested_resource: Optional[str] = None
    shared_resource: Optional[str] = None
    decision: str
    reason: str
    policy_checked: Optional[str] = None
    task_id: Optional[str] = None
    prev_hash: str
    entry_hash: str

    class Config:
        from_attributes = True

# Emergency
class EmergencyTriggerRequest(BaseModel):
    scope: str = "ALL"  # ALL or specific agent_id
    reason: str
    confirmation: bool

class EmergencyStatusResponse(BaseModel):
    is_active: bool
    scope: str
    activated_at: Optional[datetime.datetime] = None
    activated_by: Optional[str] = None
    reason: Optional[str] = None
    revoked_tokens_count: int
    suspended_agents_count: int

# Health Check
class HealthCheckReport(BaseModel):
    passport_id: str
    agent_id: str
    status: str
    is_signature_valid: bool
    is_expired: bool
    active_violations: int
    trust_score: float
    health_grade: str  # HEALTHY, WARNING, CRITICAL
    findings: List[str]
    timestamp: datetime.datetime

