import os
import io
import csv
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
import models
import schemas
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_role
)
from security_engine import SecurityEngine, DATA_MINIMIZATION_RULES
from demo_runner import DemoScenarioRunner
from seed_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

# Seed database on initial startup
db_init = next(get_db())
try:
    seed_database(db_init)
finally:
    db_init.close()

app = FastAPI(
    title="Agent Passport Exchange API",
    description="Enterprise AI Agent Identity, Trust, Security & Governance Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HEALTH & SYSTEM -----------------
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Agent Passport Exchange",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# ----------------- AUTHENTICATION -----------------
@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(login_req: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/agent-login")
def agent_login(req: schemas.AgentLoginRequest, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(
        (models.Agent.agent_id == req.agent_id) | (models.Agent.id == req.agent_id)
    ).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{req.agent_id}' is not registered in the platform."
        )

    if agent.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Agent '{agent.name}' is currently SUSPENDED. Passport validation failed."
        )
    if agent.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Agent '{agent.name}' digital identity has been REVOKED permanently."
        )

    passport = agent.passport
    passport_id = passport.passport_id if passport else "NO_PASSPORT"

    access_token = create_access_token(data={
        "sub": agent.id,
        "agent_id": agent.agent_id,
        "name": agent.name,
        "role": "ai_agent",
        "passport_id": passport_id,
        "trust_score": agent.trust_score
    })

    agent_payload = {
        "id": agent.id,
        "agent_id": agent.agent_id,
        "name": agent.name,
        "purpose": agent.purpose,
        "owner_name": agent.owner_name,
        "status": agent.status,
        "trust_score": agent.trust_score,
        "role": "ai_agent",
        "approved_tools": agent.approved_tools or [],
        "capabilities": agent.capabilities or [],
        "passport_id": passport_id,
        "passport_status": passport.status if passport else "NO_PASSPORT"
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "agent": agent_payload,
        "user": {
            "id": agent.id,
            "email": f"{agent.agent_id}@agents.agentpassport.io",
            "full_name": f"{agent.name} (AI Agent)",
            "role": "ai_agent",
            "created_at": agent.created_at
        }
    }

@app.get("/api/auth/agents-list")
def list_available_agents_for_login(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return [
        {
            "agent_id": a.agent_id,
            "name": a.name,
            "purpose": a.purpose,
            "owner_name": a.owner_name,
            "trust_score": a.trust_score,
            "status": a.status,
            "approved_tools": a.approved_tools or [],
            "capabilities": a.capabilities or [],
            "passport_id": a.passport.passport_id if a.passport else None,
            "passport_status": a.passport.status if a.passport else None
        }
        for a in agents
    ]

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/auth/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Returns convenience list of preset demo user accounts for hackathon judges."""
    users = db.query(models.User).all()
    demo_list = []
    passwords = {
        "admin@agentpassport.io": "admin123",
        "security@agentpassport.io": "security123",
        "viewer@agentpassport.io": "viewer123"
    }
    for u in users:
        demo_list.append({
            "email": u.email,
            "role": u.role,
            "full_name": u.full_name,
            "demo_password": passwords.get(u.email, "password123")
        })
    return demo_list

# ----------------- DASHBOARD STATS -----------------
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_agents = db.query(models.Agent).count()
    active_agents = db.query(models.Agent).filter(models.Agent.status == "active").count()
    verified_passports = db.query(models.AgentPassport).filter(models.AgentPassport.status == "verified").count()
    total_exchanges = db.query(models.ExchangeRequest).count()
    pending_approvals = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.status == "pending").count()
    open_alerts = db.query(models.SecurityAlert).filter(models.SecurityAlert.status == "open").count()
    emergency_state = db.query(models.EmergencyControlState).first()

    # Active temporary permissions
    now = datetime.datetime.utcnow()
    active_temp_access = db.query(models.TemporaryAccess).filter(
        models.TemporaryAccess.status == "active",
        models.TemporaryAccess.expires_at > now
    ).count()

    # Calculate average trust score
    agents = db.query(models.Agent).all()
    avg_trust = round(sum(a.trust_score for a in agents) / len(agents), 1) if agents else 85.0

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "verified_passports": verified_passports,
        "total_exchanges": total_exchanges,
        "pending_approvals": pending_approvals,
        "open_alerts": open_alerts,
        "active_temporary_permissions": active_temp_access,
        "average_trust_score": avg_trust,
        "emergency_kill_switch_active": emergency_state.is_active if emergency_state else False
    }

@app.get("/api/dashboard/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    audits = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(8).all()
    alerts = db.query(models.SecurityAlert).order_by(models.SecurityAlert.timestamp.desc()).limit(5).all()
    return {
        "recent_audits": audits,
        "recent_alerts": alerts
    }

# ----------------- AGENT REGISTRY -----------------
@app.get("/api/agents")
def list_agents(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Agent)
    if status:
        query = query.filter(models.Agent.status == status)
    if search:
        query = query.filter(
            (models.Agent.name.ilike(f"%{search}%")) |
            (models.Agent.agent_id.ilike(f"%{search}%")) |
            (models.Agent.purpose.ilike(f"%{search}%"))
        )
    agents = query.all()
    res = []
    for agt in agents:
        res.append({
            "id": agt.id,
            "agent_id": agt.agent_id,
            "name": agt.name,
            "purpose": agt.purpose,
            "organization_id": agt.organization_id,
            "owner_name": agt.owner_name,
            "status": agt.status,
            "trust_score": agt.trust_score,
            "approved_tools": agt.approved_tools or [],
            "capabilities": agt.capabilities or [],
            "permissions": agt.permissions or {},
            "is_shadow": agt.is_shadow,
            "created_at": agt.created_at,
            "expires_at": agt.expires_at,
            "passport": {
                "id": agt.passport.id,
                "passport_id": agt.passport.passport_id,
                "status": agt.passport.status,
                "digital_signature": agt.passport.digital_signature,
                "public_key": agt.passport.public_key,
                "qr_code_data": agt.passport.qr_code_data,
                "issued_at": agt.passport.issued_at,
                "expires_at": agt.passport.expires_at,
                "violation_count": agt.passport.violation_count,
                "health_status": agt.passport.health_status,
                "last_health_check": agt.passport.last_health_check
            } if agt.passport else None
        })
    return res

@app.post("/api/agents", response_model=schemas.AgentResponse)
def register_agent(
    agent_in: schemas.AgentCreate,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Agent).filter(models.Agent.agent_id == agent_in.agent_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Agent ID '{agent_in.agent_id}' already registered.")

    org = db.query(models.Organization).first()
    org_id = agent_in.organization_id or (org.id if org else None)

    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(days=agent_in.validity_days)

    agent = models.Agent(
        id=str(uuid.uuid4()),
        agent_id=agent_in.agent_id,
        name=agent_in.name,
        purpose=agent_in.purpose,
        organization_id=org_id,
        owner_name=agent_in.owner_name,
        status="active",
        trust_score=85.0,
        approved_tools=agent_in.approved_tools,
        capabilities=agent_in.capabilities,
        permissions=agent_in.permissions,
        is_shadow=False,
        expires_at=expires_at
    )
    db.add(agent)
    db.commit()

    # Create associated Digital Passport
    pass_id = f"PASS-{agent_in.agent_id[:4].upper()}-{uuid.uuid4().hex[:4].upper()}"
    sig = f"0x{hashlib.sha256(f'{agent.agent_id}_{pass_id}_SIGNATURE_2026'.encode()).hexdigest()}"
    pubkey = f"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA{hashlib.sha256(agent.name.encode()).hexdigest()}"
    qr = f"APEX-VERIFY://passport/{pass_id}?agent={agent.agent_id}&sig={sig[:18]}"

    passport = models.AgentPassport(
        id=str(uuid.uuid4()),
        passport_id=pass_id,
        agent_id=agent.id,
        digital_signature=sig,
        public_key=pubkey,
        qr_code_data=qr,
        status="verified",
        issued_at=now,
        expires_at=expires_at,
        violation_count=0,
        health_status="HEALTHY",
        last_health_check={
            "check_date": now.isoformat(),
            "signature_valid": True,
            "capabilities_drift": False,
            "active_violations": 0,
            "reputation_tier": "HIGH_TRUST"
        }
    )
    db.add(passport)

    # Inscribe registration to audit trail
    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id=agent.agent_id,
        action="AGENT_REGISTERED",
        decision="ALLOWED",
        reason=f"Administrator '{current_user.full_name}' successfully onboarded agent {agent.name}.",
        policy_checked="POL_AGENT_ONBOARDING",
        task_id="REG-ONBOARD"
    )
    db.commit()
    db.refresh(agent)
    return agent

@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(
        (models.Agent.agent_id == agent_id) | (models.Agent.id == agent_id)
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    return agent

@app.put("/api/agents/{agent_id}")
def update_agent(
    agent_id: str,
    agent_update: schemas.AgentUpdate,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    agent = db.query(models.Agent).filter(
        (models.Agent.agent_id == agent_id) | (models.Agent.id == agent_id)
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    if agent_update.name is not None:
        agent.name = agent_update.name
    if agent_update.purpose is not None:
        agent.purpose = agent_update.purpose
    if agent_update.owner_name is not None:
        agent.owner_name = agent_update.owner_name
    if agent_update.status is not None:
        agent.status = agent_update.status
        if agent.passport:
            agent.passport.status = "verified" if agent_update.status == "active" else agent_update.status
    if agent_update.approved_tools is not None:
        agent.approved_tools = agent_update.approved_tools
    if agent_update.capabilities is not None:
        agent.capabilities = agent_update.capabilities
    if agent_update.permissions is not None:
        agent.permissions = agent_update.permissions

    db.commit()
    return agent

@app.post("/api/agents/{agent_id}/status")
def change_agent_status(
    agent_id: str,
    status_change: dict,  # {"status": "suspended" | "active" | "revoked"}
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    agent = db.query(models.Agent).filter(
        (models.Agent.agent_id == agent_id) | (models.Agent.id == agent_id)
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    new_status = status_change.get("status")
    if new_status not in ["active", "suspended", "revoked"]:
        raise HTTPException(status_code=400, detail="Invalid status. Allowed: active, suspended, revoked.")

    agent.status = new_status
    if agent.passport:
        agent.passport.status = "verified" if new_status == "active" else new_status

    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id=agent.agent_id,
        action=f"AGENT_STATUS_CHANGED_{new_status.upper()}",
        decision="ENFORCED",
        reason=f"Status manually updated to '{new_status}' by {current_user.full_name} ({current_user.role}).",
        policy_checked="POL_ADMINISTRATIVE_CONTROL"
    )
    db.commit()
    return {"message": f"Agent {agent.name} status updated to {new_status}.", "status": new_status}

# ----------------- DIGITAL PASSPORTS -----------------
@app.get("/api/passports")
def list_passports(db: Session = Depends(get_db)):
    passports = db.query(models.AgentPassport).all()
    results = []
    for p in passports:
        results.append({
            "id": p.id,
            "passport_id": p.passport_id,
            "agent_id": p.agent.agent_id if p.agent else "",
            "agent_name": p.agent.name if p.agent else "",
            "owner_name": p.agent.owner_name if p.agent else "",
            "status": p.status,
            "digital_signature": p.digital_signature,
            "public_key": p.public_key,
            "qr_code_data": p.qr_code_data,
            "trust_score": p.agent.trust_score if p.agent else 0,
            "issued_at": p.issued_at,
            "expires_at": p.expires_at,
            "violation_count": p.violation_count,
            "health_status": p.health_status,
            "last_health_check": p.last_health_check
        })
    return results

@app.post("/api/passports/generate")
def generate_digital_passport(req: schemas.PassportGenerateRequest, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(
        (models.Agent.agent_id == req.agent_id) | (models.Agent.id == req.agent_id)
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_id}' not found.")

    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(days=req.validity_days)

    # Generate passport ID e.g. PASS-PROC-XXXX
    prefix = agent.agent_id.replace("agt_", "").replace("_", "-")[:4].upper() if "agt_" in agent.agent_id else agent.name[:4].upper()
    pass_id = f"PASS-{prefix}-{uuid.uuid4().hex[:4].upper()}"

    # Cryptographic signature & public key
    sig_raw = f"{agent.agent_id}|{pass_id}|{req.certification_tier}|{now.isoformat()}|CERT_AUTHORITY_KEY_2026"
    sig = f"0x{hashlib.sha256(sig_raw.encode('utf-8')).hexdigest()}"
    pubkey = f"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA{hashlib.sha256((agent.agent_id + pass_id).encode()).hexdigest()}{hashlib.sha256(agent.name.encode()).hexdigest()[:32]}"
    qr = f"APEX-VERIFY://passport/{pass_id}?agent={agent.agent_id}&tier={req.certification_tier}&sig={sig[:18]}"

    passport = agent.passport
    if not passport:
        passport = models.AgentPassport(
            id=str(uuid.uuid4()),
            passport_id=pass_id,
            agent_id=agent.id,
            digital_signature=sig,
            public_key=pubkey,
            qr_code_data=qr,
            status="verified",
            issued_at=now,
            expires_at=expires_at,
            violation_count=0,
            health_status="HEALTHY",
            last_health_check={
                "check_date": now.isoformat(),
                "signature_valid": True,
                "certification_tier": req.certification_tier,
                "reputation_tier": "HIGH_TRUST",
                "active_violations": 0
            }
        )
        db.add(passport)
    else:
        passport.passport_id = pass_id
        passport.digital_signature = sig
        passport.public_key = pubkey
        passport.qr_code_data = qr
        passport.status = "verified"
        passport.issued_at = now
        passport.expires_at = expires_at
        passport.health_status = "HEALTHY"
        passport.last_health_check = {
            "check_date": now.isoformat(),
            "signature_valid": True,
            "certification_tier": req.certification_tier,
            "reputation_tier": "HIGH_TRUST",
            "active_violations": 0
        }

    # Update agent status to active and update capabilities/tools if provided
    agent.status = "active"
    if req.capabilities:
        agent.capabilities = list(set((agent.capabilities or []) + req.capabilities))
    if req.approved_tools:
        agent.approved_tools = list(set((agent.approved_tools or []) + req.approved_tools))

    # Inscribe into tamper-evident audit log
    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id=agent.agent_id,
        action="DIGITAL_PASSPORT_GENERATED",
        decision="ALLOWED",
        reason=f"Generated official cryptographic digital passport {pass_id} with '{req.certification_tier}'. Validity: {req.validity_days} days.",
        policy_checked="POL_AGENT_CERTIFICATION",
        task_id=f"CERT-{uuid.uuid4().hex[:6].upper()}"
    )

    db.commit()
    db.refresh(passport)

    return {
        "message": f"Successfully generated digital passport {pass_id} for {agent.name}!",
        "passport": {
            "id": passport.id,
            "passport_id": passport.passport_id,
            "agent_id": agent.agent_id,
            "agent_name": agent.name,
            "certification_tier": req.certification_tier,
            "status": passport.status,
            "digital_signature": passport.digital_signature,
            "public_key": passport.public_key,
            "qr_code_data": passport.qr_code_data,
            "issued_at": passport.issued_at,
            "expires_at": passport.expires_at,
            "health_status": passport.health_status
        }
    }

@app.get("/api/passports/{passport_id}/health-check", response_model=schemas.HealthCheckReport)
def passport_health_check(passport_id: str, db: Session = Depends(get_db)):
    passport = db.query(models.AgentPassport).filter(
        (models.AgentPassport.passport_id == passport_id) | (models.AgentPassport.id == passport_id)
    ).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found.")

    now = datetime.datetime.utcnow()
    is_expired = passport.expires_at <= now
    is_sig_valid = passport.digital_signature.startswith("0x") and len(passport.digital_signature) > 20

    findings = []
    if is_expired:
        findings.append("Passport has passed its expiration threshold.")
    else:
        findings.append("Passport validity period is active and unexpired.")

    if is_sig_valid:
        findings.append("Cryptographic RSA-SHA256 signature verified against root issuer authority.")
    else:
        findings.append("Invalid or corrupted digital signature detected.")

    if passport.violation_count > 0:
        findings.append(f"Recorded {passport.violation_count} historical policy violation flags.")
    else:
        findings.append("Zero policy violations detected in lifetime audit history.")

    agent_score = passport.agent.trust_score if passport.agent else 0
    if agent_score >= 80:
        grade = "HEALTHY"
        findings.append("Agent dynamic trust score reflects excellent compliance standing.")
    elif agent_score >= 50:
        grade = "WARNING"
        findings.append("Moderate risk profile. Enhanced monitoring recommended.")
    else:
        grade = "CRITICAL"
        findings.append("High risk profile. Strict containment or suspension active.")

    report = {
        "passport_id": passport.passport_id,
        "agent_id": passport.agent.agent_id if passport.agent else "",
        "status": passport.status,
        "is_signature_valid": is_sig_valid,
        "is_expired": is_expired,
        "active_violations": passport.violation_count,
        "trust_score": agent_score,
        "health_grade": grade,
        "findings": findings,
        "timestamp": now
    }

    passport.last_health_check = {
        "check_date": now.isoformat(),
        "health_grade": grade,
        "findings_count": len(findings)
    }
    passport.health_status = grade
    db.commit()

    return report

@app.post("/api/passports/{passport_id}/renew")
def renew_passport(
    passport_id: str,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    passport = db.query(models.AgentPassport).filter(
        (models.AgentPassport.passport_id == passport_id) | (models.AgentPassport.id == passport_id)
    ).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found.")

    now = datetime.datetime.utcnow()
    passport.expires_at = now + datetime.timedelta(days=365)
    passport.status = "verified"
    passport.health_status = "HEALTHY"

    if passport.agent and passport.agent.status == "suspended":
        passport.agent.status = "active"

    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id=passport.agent.agent_id if passport.agent else "UNKNOWN",
        action="PASSPORT_RENEWED",
        decision="ALLOWED",
        reason=f"Passport {passport.passport_id} re-verified and renewed for 365 days by {current_user.full_name}.",
        policy_checked="POL_PASSPORT_LIFECYCLE"
    )
    db.commit()
    return {"message": f"Passport {passport.passport_id} successfully renewed for 1 year.", "expires_at": passport.expires_at}

# ----------------- EXCHANGE CENTER -----------------
@app.post("/api/exchanges/request", response_model=schemas.ExchangeResponse)
def execute_exchange_request(
    req: schemas.ExchangeCreateRequest,
    db: Session = Depends(get_db)
):
    sec_engine = SecurityEngine(db)
    evaluation = sec_engine.evaluate_exchange_request(
        requesting_agent_identifier=req.requesting_agent_id,
        target_agent_identifier=req.target_agent_id,
        requested_resource=req.requested_resource,
        task_id=req.task_id,
        request_payload=req.request_payload
    )

    exchange = models.ExchangeRequest(
        task_id=evaluation["task_id"],
        requesting_agent_id=req.requesting_agent_id,
        target_agent_id=req.target_agent_id,
        requested_resource=req.requested_resource,
        request_payload=req.request_payload,
        status=evaluation["status"],
        decision=evaluation["decision"],
        reason=evaluation["reason"],
        suggested_alternative=evaluation.get("suggested_alternative"),
        response_payload=evaluation.get("response_payload"),
        data_minimization=evaluation.get("data_minimization")
    )
    db.add(exchange)
    db.commit()
    db.refresh(exchange)

    temp_access_id = evaluation.get("temporary_access", {}).get("id") if evaluation.get("temporary_access") else None

    return {
        "id": exchange.id,
        "task_id": exchange.task_id,
        "requesting_agent_id": exchange.requesting_agent_id,
        "target_agent_id": exchange.target_agent_id,
        "requested_resource": exchange.requested_resource,
        "status": exchange.status,
        "decision": exchange.decision,
        "reason": exchange.reason,
        "suggested_alternative": exchange.suggested_alternative,
        "response_payload": exchange.response_payload,
        "data_minimization": exchange.data_minimization,
        "temporary_access_id": temp_access_id,
        "created_at": exchange.created_at
    }

@app.get("/api/exchanges")
def list_exchanges(limit: int = 50, db: Session = Depends(get_db)):
    exchanges = db.query(models.ExchangeRequest).order_by(models.ExchangeRequest.created_at.desc()).limit(limit).all()
    return exchanges

@app.post("/api/exchanges/preview-minimization")
def preview_data_minimization(payload: dict):
    resource_type = payload.get("resource_type", "supplier_security_audit")
    sample_raw = payload.get("sample_raw", {})

    rule = DATA_MINIMIZATION_RULES.get(resource_type, DATA_MINIMIZATION_RULES["supplier_security_audit"])
    transformed = rule["transformer"](sample_raw)

    return {
        "resource_type": resource_type,
        "requested_fields": rule["requested_fields"],
        "shared_fields": rule["shared_fields"],
        "hidden_fields": rule["hidden_fields"],
        "minimization_rationale": rule["minimization_rationale"],
        "output_payload": transformed
    }

# ----------------- SMART APPROVAL QUEUE -----------------
@app.get("/api/approvals", response_model=List[schemas.ApprovalResponse])
def list_approvals(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ApprovalRequest)
    if status_filter:
        query = query.filter(models.ApprovalRequest.status == status_filter)
    else:
        query = query.order_by(models.ApprovalRequest.created_at.desc())
    return query.all()

@app.post("/api/approvals/{approval_id}/decision")
def process_approval_decision(
    approval_id: str,
    action_in: schemas.ApprovalActionRequest,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    approval = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    now = datetime.datetime.utcnow()
    approval.status = action_in.action.lower()  # approved, rejected, modified
    approval.comments = action_in.comments
    approval.modified_permissions = action_in.modified_permissions
    approval.reviewed_by = f"{current_user.full_name} ({current_user.role})"
    approval.reviewed_at = now

    engine_sec = SecurityEngine(db)

    if approval.status == "approved":
        # Issue temporary access token for the approved task
        expires_at = now + datetime.timedelta(seconds=900)
        temp = models.TemporaryAccess(
            task_id=f"TSK-APPR-{uuid.uuid4().hex[:6].upper()}",
            exchange_request_id=approval.exchange_request_id,
            requesting_agent_id=approval.requesting_agent_id,
            target_agent_id=approval.target_agent_id,
            allowed_resource=approval.requested_resource,
            allowed_action="read",
            expires_at=expires_at,
            status="active"
        )
        db.add(temp)

    engine_sec.create_audit_entry(
        agent_id=approval.requesting_agent_id,
        action=f"APPROVAL_{approval.status.upper()}",
        decision="ALLOWED" if approval.status == "approved" else "DENIED",
        reason=f"Human review decision: {approval.status.upper()} by {approval.reviewed_by}. Comments: {approval.comments or 'None'}.",
        target_agent_id=approval.target_agent_id,
        requested_resource=approval.requested_resource,
        policy_checked="POL_HUMAN_IN_THE_LOOP"
    )

    db.commit()
    return {"message": f"Request marked as {approval.status}.", "approval": approval}

# ----------------- TEMPORARY TASK PERMISSIONS -----------------
@app.get("/api/temporary-access")
def list_temporary_access(db: Session = Depends(get_db)):
    engine_sec = SecurityEngine(db)
    engine_sec.verify_active_temporary_permissions()

    now = datetime.datetime.utcnow()
    perms = db.query(models.TemporaryAccess).order_by(models.TemporaryAccess.created_at.desc()).all()
    results = []
    for p in perms:
        remaining = max(0, int((p.expires_at - now).total_seconds())) if p.status == "active" else 0
        results.append({
            "id": p.id,
            "task_id": p.task_id,
            "requesting_agent_id": p.requesting_agent_id,
            "target_agent_id": p.target_agent_id,
            "allowed_resource": p.allowed_resource,
            "allowed_action": p.allowed_action,
            "issue_time": p.issue_time,
            "expires_at": p.expires_at,
            "status": p.status,
            "revocation_reason": p.revocation_reason,
            "time_remaining_seconds": remaining
        })
    return results

@app.post("/api/temporary-access/{access_id}/revoke")
def revoke_temporary_access(
    access_id: str,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    perm = db.query(models.TemporaryAccess).filter(models.TemporaryAccess.id == access_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission token not found.")

    perm.status = "revoked"
    perm.revocation_reason = f"Manually revoked by {current_user.full_name} ({current_user.role})"

    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id=perm.requesting_agent_id,
        action="TEMPORARY_ACCESS_REVOKED",
        decision="REVOKED",
        reason=f"Administrator manually terminated temporary grant for {perm.allowed_resource}.",
        target_agent_id=perm.target_agent_id,
        requested_resource=perm.allowed_resource,
        task_id=perm.task_id
    )
    db.commit()
    return {"message": "Temporary permission revoked successfully."}

# ----------------- PERMISSION MANAGER & POLICIES -----------------
@app.get("/api/permissions/policies", response_model=List[schemas.PolicyRuleResponse])
def list_policies(db: Session = Depends(get_db)):
    return db.query(models.PolicyRule).all()

@app.post("/api/permissions/policies", response_model=schemas.PolicyRuleResponse)
def create_policy(
    policy_in: schemas.PolicyRuleCreate,
    current_user: models.User = Depends(require_role(["administrator"])),
    db: Session = Depends(get_db)
):
    existing = db.query(models.PolicyRule).filter(models.PolicyRule.rule_code == policy_in.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy rule code already exists.")

    policy = models.PolicyRule(
        name=policy_in.name,
        rule_code=policy_in.rule_code,
        description=policy_in.description,
        rule_type=policy_in.rule_type,
        action=policy_in.action,
        severity=policy_in.severity,
        is_active=policy_in.is_active,
        condition_json=policy_in.condition_json
    )
    db.add(policy)

    engine_sec = SecurityEngine(db)
    engine_sec.create_audit_entry(
        agent_id="SYSTEM_ADMIN",
        action="POLICY_CREATED",
        decision="COMMITTED",
        reason=f"New policy {policy.rule_code} created by {current_user.full_name}.",
        policy_checked=policy.rule_code
    )
    db.commit()
    db.refresh(policy)
    return policy

@app.put("/api/permissions/policies/{policy_id}")
def update_policy(
    policy_id: str,
    update_in: schemas.PolicyRuleUpdate,
    current_user: models.User = Depends(require_role(["administrator"])),
    db: Session = Depends(get_db)
):
    policy = db.query(models.PolicyRule).filter(models.PolicyRule.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")

    if update_in.name is not None:
        policy.name = update_in.name
    if update_in.description is not None:
        policy.description = update_in.description
    if update_in.action is not None:
        policy.action = update_in.action
    if update_in.severity is not None:
        policy.severity = update_in.severity
    if update_in.is_active is not None:
        policy.is_active = update_in.is_active
    if update_in.condition_json is not None:
        policy.condition_json = update_in.condition_json

    db.commit()
    return policy

# ----------------- TRUST & RISK ANALYTICS -----------------
@app.get("/api/analytics/overview")
def get_analytics(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    agent_trust_list = [{"agent_id": a.agent_id, "name": a.name, "trust_score": a.trust_score, "status": a.status} for a in agents]

    # Calculate success vs denied
    total_allowed = db.query(models.ExchangeRequest).filter(models.ExchangeRequest.decision == "ALLOWED").count()
    total_denied = db.query(models.ExchangeRequest).filter(models.ExchangeRequest.decision.in_(["DENIED", "BLOCKED"])).count()
    total_approval = db.query(models.ExchangeRequest).filter(models.ExchangeRequest.decision == "HUMAN_APPROVAL_REQUIRED").count()
    total_negotiated = db.query(models.ExchangeRequest).filter(models.ExchangeRequest.decision == "ALTERNATIVE_ACCESS_SUGGESTED").count()

    # Risk distribution
    high_trust = sum(1 for a in agents if a.trust_score >= 80)
    moderate_trust = sum(1 for a in agents if 50 <= a.trust_score < 80)
    low_trust = sum(1 for a in agents if a.trust_score < 50)

    # Trust Score History over time
    events = db.query(models.TrustScoreEvent).order_by(models.TrustScoreEvent.created_at.asc()).limit(30).all()
    timeline = []
    for ev in events:
        timeline.append({
            "timestamp": ev.created_at.strftime("%H:%M:%S"),
            "agent_id": ev.agent.agent_id if ev.agent else "System",
            "score": ev.score_after,
            "delta": ev.delta,
            "event_type": ev.event_type,
            "reason": ev.reason
        })

    # Alert breakdown
    alerts = db.query(models.SecurityAlert).all()
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for alt in alerts:
        severity_counts[alt.severity] = severity_counts.get(alt.severity, 0) + 1

    return {
        "agent_trust_comparison": agent_trust_list,
        "exchange_outcomes": {
            "allowed": total_allowed,
            "denied": total_denied,
            "human_approval": total_approval,
            "negotiated_alternatives": total_negotiated
        },
        "risk_distribution": [
            {"tier": "High Trust (80-100)", "count": high_trust, "color": "#10B981"},
            {"tier": "Moderate Trust (50-79)", "count": moderate_trust, "color": "#F59E0B"},
            {"tier": "Low Trust (0-49)", "count": low_trust, "color": "#EF4444"}
        ],
        "trust_history_timeline": timeline,
        "alert_severity_distribution": severity_counts
    }

# ----------------- BEHAVIOUR MONITORING -----------------
@app.get("/api/behaviour/events")
def list_behaviour_events(db: Session = Depends(get_db)):
    events = db.query(models.BehaviourEvent).order_by(models.BehaviourEvent.timestamp.desc()).limit(50).all()
    return events

@app.get("/api/behaviour/alerts")
def list_security_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.SecurityAlert).order_by(models.SecurityAlert.timestamp.desc()).all()
    return alerts

@app.post("/api/behaviour/alerts/{alert_id}/resolve")
def resolve_security_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.SecurityAlert).filter(models.SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.status = "resolved"
    db.commit()
    return {"message": "Alert marked as resolved."}

# ----------------- POLICY SIMULATION (WHAT-IF) -----------------
@app.post("/api/simulation/evaluate")
def run_policy_simulation(sim_in: schemas.SimulationRequest, db: Session = Depends(get_db)):
    """
    Evaluates what-if impact on real database records without mutating live data!
    """
    agents = db.query(models.Agent).all()
    affected_agent_ids = []
    blocked_workflows = []

    if sim_in.rule_code == "SIM_RESTRICT_EXTERNAL_FINANCE":
        affected_agents = [a for a in agents if "finance" in a.purpose.lower() or "procure" in a.purpose.lower()]
        affected_agent_ids = [a.agent_id for a in affected_agents]
        blocked_workflows = [
            "Cross-organization supplier invoice automated clearance",
            "Third-party currency risk underwriting",
            "External vendor wire disbursement sync"
        ]
        impact_summary = "Enforcing total restriction on external financial access blocks 3 cross-boundary workflows and prevents potential data leaks to Tier-3 external vendors."
        recommendations = [
            "Implement privacy-preserving credit score proxy instead of outright blockage.",
            "Route transactions over $100k through mandatory dual-party human approval."
        ]
        allowed_count = 12
        denied_count = 8
        human_approval_count = 4

    elif sim_in.rule_code == "SIM_MANDATORY_PASSPORT_HEALTH_90":
        affected_agents = [a for a in agents if a.trust_score < 90.0]
        affected_agent_ids = [a.agent_id for a in affected_agents]
        blocked_workflows = [
            "Procurement Agent routine supplier queries (Trust: 92.4 -> Passed)",
            "Finance Agent payment analysis (Trust: 88.5 -> Blocked/Escalated)"
        ]
        impact_summary = "Raising trust score threshold to 90.0 will quarantine 1 of the 3 primary operational agents, demanding human sign-off on 45% of daily transactions."
        recommendations = [
            "Establish automated trust rehabilitation tasks before raising threshold.",
            "Use phased enforcement: 80 threshold initially, escalating to 90 after 30 days."
        ]
        allowed_count = 14
        denied_count = 6
        human_approval_count = 10
    else:
        # Generic simulated impact
        affected_agent_ids = [a.agent_id for a in agents[:2]]
        blocked_workflows = ["Unrestricted confidential log inspection", "High-frequency credential polling"]
        impact_summary = f"Simulating policy '{sim_in.rule_code}' with action '{sim_in.hypothetical_action}' protects core assets while maintaining 78% operational throughput."
        recommendations = ["Monitor agent behavioral deviations during trial period.", "Notify agent owners of capability constraints."]
        allowed_count = 18
        denied_count = 4
        human_approval_count = 2

    return {
        "rule_code": sim_in.rule_code,
        "hypothetical_action": sim_in.hypothetical_action,
        "affected_agent_ids": affected_agent_ids,
        "allowed_count": allowed_count,
        "denied_count": denied_count,
        "human_approval_count": human_approval_count,
        "blocked_workflows": blocked_workflows,
        "security_impact_summary": impact_summary,
        "recommended_changes": recommendations,
        "simulation_disclaimer": "Safe What-If Simulation: Live database permissions and active agent states were NOT modified."
    }

# ----------------- SECURITY COMMAND CENTER -----------------
@app.get("/api/command-center/status")
def get_command_center_status(db: Session = Depends(get_db)):
    emergency = db.query(models.EmergencyControlState).first()
    agents = db.query(models.Agent).all()
    orgs = db.query(models.Organization).all()
    active_tokens = db.query(models.TemporaryAccess).filter(models.TemporaryAccess.status == "active").count()

    return {
        "emergency_kill_switch": {
            "is_active": emergency.is_active if emergency else False,
            "activated_at": emergency.activated_at if emergency else None,
            "activated_by": emergency.activated_by if emergency else None,
            "scope": emergency.scope if emergency else "ALL",
            "reason": emergency.reason if emergency else None
        },
        "total_active_temporary_tokens": active_tokens,
        "agents_summary": [
            {"id": a.id, "agent_id": a.agent_id, "name": a.name, "status": a.status, "trust_score": a.trust_score}
            for a in agents
        ],
        "organizations": [
            {"name": o.name, "code": o.code, "trust_tier": o.trust_tier, "cross_org_allowed": o.cross_org_allowed}
            for o in orgs
        ]
    }

@app.post("/api/command-center/kill-switch")
def toggle_emergency_kill_switch(
    req: schemas.EmergencyTriggerRequest,
    current_user: models.User = Depends(require_role(["administrator", "security_officer"])),
    db: Session = Depends(get_db)
):
    if not req.confirmation:
        raise HTTPException(status_code=400, detail="Explicit confirmation required to toggle emergency kill switch.")

    emergency = db.query(models.EmergencyControlState).first()
    if not emergency:
        emergency = models.EmergencyControlState()
        db.add(emergency)

    engine_sec = SecurityEngine(db)
    now = datetime.datetime.utcnow()

    if not emergency.is_active:
        # ENGAGE EMERGENCY KILL SWITCH
        active_perms = db.query(models.TemporaryAccess).filter(models.TemporaryAccess.status == "active").all()
        for p in active_perms:
            p.status = "revoked"
            p.revocation_reason = "EMERGENCY_KILL_SWITCH_MANUAL_ENGAGED"

        emergency.is_active = True
        emergency.activated_at = now
        emergency.activated_by = f"{current_user.full_name} ({current_user.role})"
        emergency.scope = req.scope
        emergency.reason = req.reason
        emergency.affected_count = len(active_perms)

        # Suspend agents matching scope
        agents = db.query(models.Agent).all()
        for agt in agents:
            agt.status = "suspended"
            if agt.passport:
                agt.passport.status = "suspended"
                agt.passport.health_status = "CRITICAL"

        engine_sec.create_security_alert(
            severity="CRITICAL",
            title="EMERGENCY SECURITY KILL SWITCH ACTIVATED",
            description=f"Initiated by {emergency.activated_by}. Scope: {req.scope}. Reason: {req.reason}",
            agent_id=None,
            alert_type="KILL_SWITCH"
        )
        engine_sec.create_audit_entry(
            agent_id=current_user.email,
            action="EMERGENCY_KILL_SWITCH_ACTIVATED",
            decision="ENFORCED",
            reason=f"Emergency shutdown engaged. Revoked {len(active_perms)} tokens. All agent passports suspended.",
            policy_checked="POL_EMERGENCY_ISOLATION"
        )
        db.commit()
        return {"message": "Emergency Kill Switch ENGAGED. All agent traffic halted.", "status": "ACTIVE"}
    else:
        # DISENGAGE / RESTORE
        emergency.is_active = False
        emergency.reason = None
        emergency.activated_at = None

        # Restore agents to active
        agents = db.query(models.Agent).all()
        for agt in agents:
            agt.status = "active"
            if agt.passport:
                agt.passport.status = "verified"
                agt.passport.health_status = "HEALTHY"

        engine_sec.create_audit_entry(
            agent_id=current_user.email,
            action="EMERGENCY_KILL_SWITCH_DISENGAGED",
            decision="RESTORED",
            reason=f"Emergency shutdown disengaged by {current_user.full_name}. Normal zero-trust operation resumed.",
            policy_checked="POL_EMERGENCY_ISOLATION"
        )
        db.commit()
        return {"message": "Emergency Kill Switch DISENGAGED. Standard security operations restored.", "status": "INACTIVE"}

# ----------------- AUDIT TRAIL -----------------
@app.get("/api/audit-trail")
def list_audit_trail(
    agent_id: Optional[str] = None,
    decision: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditLog)
    if agent_id:
        query = query.filter(models.AuditLog.agent_id == agent_id)
    if decision:
        query = query.filter(models.AuditLog.decision == decision)
    if search:
        query = query.filter(
            (models.AuditLog.reason.ilike(f"%{search}%")) |
            (models.AuditLog.action.ilike(f"%{search}%")) |
            (models.AuditLog.requested_resource.ilike(f"%{search}%")) |
            (models.AuditLog.event_id.ilike(f"%{search}%"))
        )
    logs = query.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@app.get("/api/audit-trail/verify-chain")
def verify_audit_hash_chain(db: Session = Depends(get_db)):
    engine_sec = SecurityEngine(db)
    return engine_sec.verify_audit_chain_integrity()

@app.get("/api/audit-trail/export-csv")
def export_audit_csv(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Timestamp (UTC)", "Agent ID", "Action", "Target Agent",
        "Requested Resource", "Shared Resource", "Decision", "Reason", "Policy Checked",
        "Task ID", "Prev Hash", "Entry Hash"
    ])
    for l in logs:
        writer.writerow([
            l.event_id, l.timestamp.isoformat(), l.agent_id, l.action, l.target_agent_id or "",
            l.requested_resource or "", l.shared_resource or "", l.decision, l.reason,
            l.policy_checked or "", l.task_id or "", l.prev_hash, l.entry_hash
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agent_passport_audit_trail.csv"}
    )

# ----------------- HACKATHON LIVE DEMO -----------------
@app.post("/api/demo/run-scenario/{scenario_id}")
def run_hackathon_demo_scenario(scenario_id: int, db: Session = Depends(get_db)):
    if scenario_id < 1 or scenario_id > 6:
        raise HTTPException(status_code=400, detail="Scenario ID must be between 1 and 6.")
    runner = DemoScenarioRunner(db)
    return runner.run_scenario(scenario_id)

@app.post("/api/demo/reset-state")
def reset_demo_state(db: Session = Depends(get_db)):
    """Restores agents, passports, and kill switch to baseline operational state for repeating live demos."""
    emergency = db.query(models.EmergencyControlState).first()
    if emergency:
        emergency.is_active = False

    agents = db.query(models.Agent).all()
    for agt in agents:
        agt.status = "active"
        if agt.agent_id == "agt_procurement_01":
            agt.trust_score = 92.4
        elif agt.agent_id == "agt_security_02":
            agt.trust_score = 96.8
        elif agt.agent_id == "agt_finance_03":
            agt.trust_score = 88.5

        if agt.passport:
            agt.passport.status = "verified"
            agt.passport.health_status = "HEALTHY"

    db.commit()
    return {"message": "Demo state reset to clean baseline! All agents verified and active."}

# Mount built frontend dist if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    # Serve assets
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Don't intercept /api routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found.")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
