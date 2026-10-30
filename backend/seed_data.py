import datetime
import hashlib
import uuid
from sqlalchemy.orm import Session
import models
from auth import hash_password
from security_engine import SecurityEngine, GENESIS_HASH

def seed_database(db: Session):
    # Check if already seeded
    existing_org = db.query(models.Organization).first()
    if existing_org:
        return

    print("[SEED] Initializing Agent Passport Exchange database with enterprise seed data...")

    # 1. Create Organizations
    acme_org = models.Organization(
        id=str(uuid.uuid4()),
        name="Acme Enterprise Global",
        code="ORG-ACME-01",
        domain="acme-global.com",
        trust_tier="Enterprise",
        is_external=False,
        cross_org_allowed=True
    )
    cyber_org = models.Organization(
        id=str(uuid.uuid4()),
        name="CyberShield Security Alliance",
        code="ORG-CYBER-02",
        domain="cybershield.org",
        trust_tier="Verified",
        is_external=False,
        cross_org_allowed=True
    )
    ext_org = models.Organization(
        id=str(uuid.uuid4()),
        name="Apex Vendor Partner Corp",
        code="ORG-APEX-03",
        domain="apexvendor.net",
        trust_tier="External",
        is_external=True,
        cross_org_allowed=False
    )
    db.add_all([acme_org, cyber_org, ext_org])
    db.commit()

    # 2. Create Users
    admin_user = models.User(
        id=str(uuid.uuid4()),
        email="admin@agentpassport.io",
        password_hash=hash_password("admin123"),
        full_name="Sarah Chen (Chief AI Safety Officer)",
        role="administrator",
        organization_id=acme_org.id
    )
    security_user = models.User(
        id=str(uuid.uuid4()),
        email="security@agentpassport.io",
        password_hash=hash_password("security123"),
        full_name="Marcus Vance (Security Operations Lead)",
        role="security_officer",
        organization_id=acme_org.id
    )
    viewer_user = models.User(
        id=str(uuid.uuid4()),
        email="viewer@agentpassport.io",
        password_hash=hash_password("viewer123"),
        full_name="Elena Rostova (Compliance Auditor)",
        role="viewer",
        organization_id=acme_org.id
    )
    db.add_all([admin_user, security_user, viewer_user])
    db.commit()

    # 3. Create Default Agents
    now = datetime.datetime.utcnow()
    one_year_later = now + datetime.timedelta(days=365)

    procurement_agent = models.Agent(
        id=str(uuid.uuid4()),
        agent_id="agt_procurement_01",
        name="Procurement Agent",
        purpose="Supplier management, vendor evaluation, contract bidding, and procurement workflows.",
        organization_id=acme_org.id,
        owner_name="Enterprise Supply Chain Unit",
        status="active",
        trust_score=92.4,
        approved_tools=["VendorDB_API", "Supplier_Catalog_Tool", "Security_Verification_Query", "Contract_Drafting_Engine"],
        capabilities=["supplier:read", "vendor_evaluation:write", "security_verification:query", "bid_comparison:execute"],
        permissions={"supplier_info": "read_write", "security_status": "read", "confidential_security_reports": "restricted", "finance_records": "restricted"},
        is_shadow=False,
        expires_at=one_year_later
    )

    security_agent = models.Agent(
        id=str(uuid.uuid4()),
        agent_id="agt_security_02",
        name="Security Agent",
        purpose="Security reviews, risk assessment, vulnerability scanning, and supplier verification.",
        organization_id=acme_org.id,
        owner_name="Cyber Defense Division",
        status="active",
        trust_score=96.8,
        approved_tools=["Vulnerability_Scanner_v4", "Compliance_Verifier", "Audit_Report_Indexer", "PenTest_Simulator"],
        capabilities=["security_audit:read", "supplier_verification:generate", "cve_analysis:execute", "compliance_report:publish"],
        permissions={"security_reports": "read_write", "supplier_audit": "read", "financial_records": "restricted", "pii_records": "restricted"},
        is_shadow=False,
        expires_at=one_year_later
    )

    finance_agent = models.Agent(
        id=str(uuid.uuid4()),
        agent_id="agt_finance_03",
        name="Finance Agent",
        purpose="Financial verification, payment analysis, solvency validation, and invoice auditing.",
        organization_id=acme_org.id,
        owner_name="Treasury Operations",
        status="active",
        trust_score=88.5,
        approved_tools=["Ledger_Analytics_Tool", "Solvency_Calculator", "Tax_Compliance_Validator", "Invoice_Auditor"],
        capabilities=["finance:read", "payment_analysis:execute", "credit_risk:calculate", "invoice:verify"],
        permissions={"financial_records": "read_write", "solvency_data": "read", "confidential_security_reports": "restricted"},
        is_shadow=False,
        expires_at=one_year_later
    )

    db.add_all([procurement_agent, security_agent, finance_agent])
    db.commit()

    # 4. Create Digital Passports
    def make_qr_and_sig(agent_code: str, pass_code: str):
        sig = hashlib.sha256(f"AGENT_PASSPORT_SIG_{agent_code}_{pass_code}_KEY2026".encode()).hexdigest()
        qr = f"APEX-VERIFY://passport/{pass_code}?agent={agent_code}&sig={sig[:16]}"
        pubkey = f"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA{hashlib.sha256(agent_code.encode()).hexdigest()}"
        return sig, qr, pubkey

    sig1, qr1, pk1 = make_qr_and_sig("agt_procurement_01", "PASS-PROC-9921")
    proc_passport = models.AgentPassport(
        id=str(uuid.uuid4()),
        passport_id="PASS-PROC-9921",
        agent_id=procurement_agent.id,
        digital_signature=f"0x{sig1}",
        public_key=pk1,
        qr_code_data=qr1,
        status="verified",
        issued_at=now - datetime.timedelta(days=30),
        expires_at=one_year_later,
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

    sig2, qr2, pk2 = make_qr_and_sig("agt_security_02", "PASS-SECU-8842")
    sec_passport = models.AgentPassport(
        id=str(uuid.uuid4()),
        passport_id="PASS-SECU-8842",
        agent_id=security_agent.id,
        digital_signature=f"0x{sig2}",
        public_key=pk2,
        qr_code_data=qr2,
        status="verified",
        issued_at=now - datetime.timedelta(days=45),
        expires_at=one_year_later,
        violation_count=0,
        health_status="HEALTHY",
        last_health_check={
            "check_date": now.isoformat(),
            "signature_valid": True,
            "capabilities_drift": False,
            "active_violations": 0,
            "reputation_tier": "CRITICAL_INFRASTRUCTURE"
        }
    )

    sig3, qr3, pk3 = make_qr_and_sig("agt_finance_03", "PASS-FIN-7719")
    fin_passport = models.AgentPassport(
        id=str(uuid.uuid4()),
        passport_id="PASS-FIN-7719",
        agent_id=finance_agent.id,
        digital_signature=f"0x{sig3}",
        public_key=pk3,
        qr_code_data=qr3,
        status="verified",
        issued_at=now - datetime.timedelta(days=20),
        expires_at=one_year_later,
        violation_count=0,
        health_status="HEALTHY",
        last_health_check={
            "check_date": now.isoformat(),
            "signature_valid": True,
            "capabilities_drift": False,
            "active_violations": 0,
            "reputation_tier": "FINANCIAL_COMPLIANCE"
        }
    )

    db.add_all([proc_passport, sec_passport, fin_passport])
    db.commit()

    # 5. Create Core Enterprise Policy Rules
    policies = [
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Confidential External Data Restriction",
            rule_code="POL_CONFIDENTIAL_EXTERNAL",
            description="Confidential data cannot be shared with external or unverified cross-organization agents.",
            rule_type="DATA_SHARING",
            action="DENY",
            severity="CRITICAL",
            is_active=True,
            condition_json={"target_org_trust_tier": ["External"], "classification": ["Confidential", "Secret"]}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Mandatory Financial Authorization",
            rule_code="POL_FINANCIAL_APPROVAL",
            description="Direct financial verification, disbursements, and account balance requests require human administrator authorization.",
            rule_type="APPROVAL_REQUIREMENT",
            action="HUMAN_APPROVAL",
            severity="HIGH",
            is_active=True,
            condition_json={"resource_category": ["financial_records", "payment_disbursement", "ledger_export"]}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Strict Minimum Necessary Exchange",
            rule_code="POL_RESTRICT_CONFIDENTIAL_REPORTS",
            description="Full confidential security audit reports and raw vulnerability pentests are restricted; only verification summaries allowed.",
            rule_type="ACCESS_CONTROL",
            action="MINIMIZE",
            severity="HIGH",
            is_active=True,
            condition_json={"restricted_raw_reports": ["complete_security_audit_report", "raw_audit_report", "source_code_scan"]}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Automated Shadow Agent Detection",
            rule_code="POL_SHADOW_AGENT_BLOCK",
            description="Unknown, rogue, or unregistered agents attempting platform communication are immediately blocked and flagged.",
            rule_type="ACCESS_CONTROL",
            action="DENY",
            severity="CRITICAL",
            is_active=True,
            condition_json={"unregistered_identity": True}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Degraded Trust Escrow & Approval",
            rule_code="POL_LOW_TRUST_ESCALATION",
            description="Agents with dynamic trust score below 50.0 require mandatory human security officer approval for all operations.",
            rule_type="APPROVAL_REQUIREMENT",
            action="HUMAN_APPROVAL",
            severity="HIGH",
            is_active=True,
            condition_json={"trust_score_threshold": 50.0}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Temporary Access Auto-Revocation",
            rule_code="POL_TEMP_PERMISSION_EXPIRY",
            description="Task-specific permissions expire immediately upon task completion or expiration of time-to-live (TTL).",
            rule_type="TEMPORARY_ACCESS",
            action="DENY",
            severity="MEDIUM",
            is_active=True,
            condition_json={"max_ttl_seconds": 900}
        ),
        models.PolicyRule(
            id=str(uuid.uuid4()),
            name="Behavior Anomaly & Deviation Blocker",
            rule_code="POL_BEHAVIOUR_ANOMALY_PREVENTION",
            description="Requests that deviate significantly from declared agent purpose or approved tools trigger automatic quarantine.",
            rule_type="ACCESS_CONTROL",
            action="DENY",
            severity="HIGH",
            is_active=True,
            condition_json={"purpose_drift_threshold": 0.85}
        )
    ]
    db.add_all(policies)
    db.commit()

    # 6. Initialize Emergency Control State (Deactivated)
    emergency = models.EmergencyControlState(
        id=str(uuid.uuid4()),
        is_active=False,
        scope="ALL",
        affected_agent_ids=[]
    )
    db.add(emergency)
    db.commit()

    # 7. Seed Initial Hash-Linked Audit Trail (5 initial realistic events)
    sec_engine = SecurityEngine(db)

    # Event 1: Genesis Agent Registration
    sec_engine.create_audit_entry(
        agent_id="agt_procurement_01",
        action="AGENT_REGISTERED",
        decision="ALLOWED",
        reason="Agent registered with verified credentials and issued digital passport PASS-PROC-9921.",
        policy_checked="SYSTEM_INIT",
        task_id="INIT-001"
    )

    # Event 2: Security Agent Registration
    sec_engine.create_audit_entry(
        agent_id="agt_security_02",
        action="AGENT_REGISTERED",
        decision="ALLOWED",
        reason="Security Agent onboarded and bound to cryptographic certificate PASS-SECU-8842.",
        policy_checked="SYSTEM_INIT",
        task_id="INIT-002"
    )

    # Event 3: Finance Agent Registration
    sec_engine.create_audit_entry(
        agent_id="agt_finance_03",
        action="AGENT_REGISTERED",
        decision="ALLOWED",
        reason="Finance Agent registered with strict ledger read policies under PASS-FIN-7719.",
        policy_checked="SYSTEM_INIT",
        task_id="INIT-003"
    )

    # Event 4: Routine exchange
    sec_engine.create_audit_entry(
        agent_id="agt_procurement_01",
        action="EXCHANGE_ALLOWED",
        decision="ALLOWED",
        reason="Vendor compliance status queried. Privacy-preserving transformation applied (PASSED).",
        target_agent_id="agt_security_02",
        requested_resource="supplier_security_audit",
        shared_resource="Supplier ABC - SECURITY STATUS: PASSED",
        policy_checked="POL_MINIMUM_NECESSARY_EXCHANGE",
        task_id="TSK-INIT-901"
    )

    # Seed Trust History points for each agent
    for agt in [procurement_agent, security_agent, finance_agent]:
        th = models.TrustScoreEvent(
            agent_id=agt.id,
            score_before=80.0,
            score_after=agt.trust_score,
            delta=agt.trust_score - 80.0,
            event_type="INITIAL_BASELINE",
            reason="Initial passport verification, signature validation, and capability baseline established."
        )
        db.add(th)

    # Seed one pending approval request for demonstration in Smart Approval Queue
    demo_approval = models.ApprovalRequest(
        id=str(uuid.uuid4()),
        requesting_agent_id="agt_finance_03",
        target_agent_id="agt_procurement_01",
        requested_resource="financial_records_quarterly_disbursement",
        risk_level="HIGH",
        status="pending",
        reason="Finance Agent requested raw quarterly disbursement ledger. POL_FINANCIAL_APPROVAL requires administrator authorization."
    )
    db.add(demo_approval)

    # Seed one recent security alert
    demo_alert = models.SecurityAlert(
        id=str(uuid.uuid4()),
        severity="MEDIUM",
        title="Unusual Access Query Rate",
        description="Procurement Agent conducted 4 consecutive status checks in 60 seconds. Pattern evaluated as benign but logged for awareness.",
        agent_id=procurement_agent.id,
        alert_type="POLICY_BREACH",
        status="open"
    )
    db.add(demo_alert)

    db.commit()
    print("[SEED] Successfully seeded Agent Passport Exchange database!")

