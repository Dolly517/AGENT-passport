import uuid
import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="administrator")  # administrator, security_officer, viewer
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    domain = Column(String(255), nullable=False)
    trust_tier = Column(String(50), default="Enterprise")  # Enterprise, Verified, External
    is_external = Column(Boolean, default=False)
    cross_org_allowed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="organization")
    agents = relationship("Agent", back_populates="organization")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(64), unique=True, index=True, nullable=False)  # e.g., agt_procurement_01
    name = Column(String(255), nullable=False)
    purpose = Column(Text, nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    owner_name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")  # active, suspended, revoked
    trust_score = Column(Float, default=85.0)  # 0 to 100
    approved_tools = Column(JSON, default=list)  # list of strings
    capabilities = Column(JSON, default=list)    # list of authorized capabilities
    permissions = Column(JSON, default=dict)    # allowed resources and actions
    is_shadow = Column(Boolean, default=False)  # detected shadow/rogue agent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="agents")
    passport = relationship("AgentPassport", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    trust_history = relationship("TrustScoreEvent", back_populates="agent", cascade="all, delete-orphan")
    behaviour_events = relationship("BehaviourEvent", back_populates="agent", cascade="all, delete-orphan")
    alerts = relationship("SecurityAlert", back_populates="agent", cascade="all, delete-orphan")

class AgentPassport(Base):
    __tablename__ = "agent_passports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    passport_id = Column(String(64), unique=True, index=True, nullable=False)  # PASS-PROC-9921
    agent_id = Column(String(36), ForeignKey("agents.id"), unique=True, nullable=False)
    digital_signature = Column(Text, nullable=False)
    public_key = Column(Text, nullable=False)
    qr_code_data = Column(Text, nullable=False)
    status = Column(String(50), default="verified")  # verified, pending, expired, suspended, revoked
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    violation_count = Column(Integer, default=0)
    last_health_check = Column(JSON, nullable=True)
    health_status = Column(String(50), default="HEALTHY")  # HEALTHY, WARNING, CRITICAL

    agent = relationship("Agent", back_populates="passport")

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    rule_code = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    rule_type = Column(String(50), nullable=False)  # DATA_SHARING, ACCESS_CONTROL, APPROVAL_REQUIREMENT, TEMPORARY_ACCESS
    action = Column(String(50), nullable=False)     # DENY, HUMAN_APPROVAL, MINIMIZE, ALLOW
    severity = Column(String(50), default="HIGH")   # CRITICAL, HIGH, MEDIUM, LOW
    is_active = Column(Boolean, default=True)
    condition_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), index=True, nullable=False)
    requesting_agent_id = Column(String(64), nullable=False)  # agent_id or external identifier
    target_agent_id = Column(String(64), nullable=False)
    requested_resource = Column(String(255), nullable=False)
    request_payload = Column(JSON, default=dict)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, DENIED, PENDING_APPROVAL, BLOCKED
    decision = Column(String(50), nullable=False)     # ALLOWED, DENIED, HUMAN_APPROVAL_REQUIRED, ALTERNATIVE_ACCESS_SUGGESTED
    reason = Column(Text, nullable=False)
    suggested_alternative = Column(JSON, nullable=True)
    response_payload = Column(JSON, nullable=True)
    data_minimization = Column(JSON, nullable=True)   # requested_fields, shared_fields, hidden_fields, minimization_rationale
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exchange_request_id = Column(String(36), ForeignKey("exchange_requests.id"), nullable=True)
    requesting_agent_id = Column(String(64), nullable=False)
    target_agent_id = Column(String(64), nullable=False)
    requested_resource = Column(String(255), nullable=False)
    risk_level = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="pending")   # pending, approved, rejected, modified
    reason = Column(Text, nullable=False)
    modified_permissions = Column(JSON, nullable=True)
    comments = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TemporaryAccess(Base):
    __tablename__ = "temporary_access"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), index=True, nullable=False)
    exchange_request_id = Column(String(36), ForeignKey("exchange_requests.id"), nullable=True)
    requesting_agent_id = Column(String(64), nullable=False)
    target_agent_id = Column(String(64), nullable=False)
    allowed_resource = Column(String(255), nullable=False)
    allowed_action = Column(String(50), default="read")
    issue_time = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(50), default="active")  # active, expired, revoked
    revocation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TrustScoreEvent(Base):
    __tablename__ = "trust_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    score_before = Column(Float, nullable=False)
    score_after = Column(Float, nullable=False)
    delta = Column(Float, nullable=False)
    event_type = Column(String(50), nullable=False)  # SUCCESSFUL_TASK, POLICY_COMPLIANCE, UNAUTHORIZED_ATTEMPT, ANOMALY, EMERGENCY_REVOCATION
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="trust_history")

class BehaviourEvent(Base):
    __tablename__ = "behaviour_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=False)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)  # 0 to 100
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="behaviour_events")

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    severity = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    alert_type = Column(String(100), nullable=False)  # SHADOW_AGENT, ANOMALY, POLICY_BREACH, EXPIRY_WARNING, KILL_SWITCH
    status = Column(String(50), default="open")       # open, acknowledged, resolved
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    agent_id = Column(String(64), nullable=False)
    action = Column(String(100), nullable=False)
    target_agent_id = Column(String(64), nullable=True)
    requested_resource = Column(String(255), nullable=True)
    shared_resource = Column(String(255), nullable=True)
    decision = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    policy_checked = Column(String(100), nullable=True)
    task_id = Column(String(64), nullable=True)
    prev_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False)

class EmergencyControlState(Base):
    __tablename__ = "emergency_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    is_active = Column(Boolean, default=False)
    activated_at = Column(DateTime, nullable=True)
    activated_by = Column(String(255), nullable=True)
    scope = Column(String(50), default="ALL")  # ALL, SELECTED
    affected_agent_ids = Column(JSON, default=list)
    reason = Column(Text, nullable=True)
    affected_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

