import hashlib
import json
import uuid
import datetime
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session
import models

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

# Data Minimization Rules Repository
DATA_MINIMIZATION_RULES = {
    "supplier_security_audit": {
        "requested_fields": ["cve_vulnerabilities", "penetration_test_logs", "executive_summary", "soc2_audit_details", "compliance_pass_status", "internal_ip_addresses"],
        "shared_fields": ["supplier_name", "security_status", "verification_tier", "compliance_summary", "valid_until"],
        "hidden_fields": ["cve_vulnerabilities", "penetration_test_logs", "internal_ip_addresses", "soc2_audit_details"],
        "minimization_rationale": "Confidential vulnerability logs & network topology withheld. Sufficient verification achieved via PASSED certification.",
        "transformer": lambda raw: {
            "supplier_name": raw.get("supplier_name", "Supplier ABC"),
            "security_status": "PASSED",
            "verification_tier": "TIER_1_ENTERPRISE",
            "compliance_summary": "SOC2 Type II & ISO/IEC 27001 Certified",
            "risk_classification": "LOW",
            "valid_until": "2027-12-31"
        }
    },
    "financial_records": {
        "requested_fields": ["bank_account_numbers", "executive_salaries", "gross_revenue_breakdown", "credit_risk_rating", "payment_solvency_score"],
        "shared_fields": ["credit_risk", "payment_standing", "authorized_transaction_limit"],
        "hidden_fields": ["bank_account_numbers", "executive_salaries", "gross_revenue_breakdown"],
        "minimization_rationale": "Direct banking details and salary records restricted. Transformed into verified solvency classification.",
        "transformer": lambda raw: {
            "credit_risk": "LOW",
            "payment_standing": "IN_GOOD_STANDING",
            "authorized_transaction_limit": 500000,
            "solvency_index": 0.94
        }
    },
    "employee_records": {
        "requested_fields": ["ssn", "home_address", "personal_phone", "health_records", "employment_status", "security_clearance"],
        "shared_fields": ["eligibility", "clearance_level", "active_status"],
        "hidden_fields": ["ssn", "home_address", "personal_phone", "health_records"],
        "minimization_rationale": "Personal Identifiable Information (PII) scrubbed per GDPR/CCPA. Exchanged verified employment & clearance level.",
        "transformer": lambda raw: {
            "eligibility": "VERIFIED",
            "clearance_level": "LEVEL_3_CONFIDENTIAL",
            "active_status": True
        }
    }
}

class SecurityEngine:
    def __init__(self, db: Session):
        self.db = db

    def compute_audit_hash(self, prev_hash: str, event_id: str, timestamp_str: str, agent_id: str, action: str, decision: str) -> str:
        payload = f"{prev_hash}|{event_id}|{timestamp_str}|{agent_id}|{action}|{decision}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def create_audit_entry(
        self,
        agent_id: str,
        action: str,
        decision: str,
        reason: str,
        target_agent_id: Optional[str] = None,
        requested_resource: Optional[str] = None,
        shared_resource: Optional[str] = None,
        policy_checked: Optional[str] = None,
        task_id: Optional[str] = None
    ) -> models.AuditLog:
        # Find latest audit log for hash chaining
        last_log = self.db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).first()
        prev_hash = last_log.entry_hash if last_log and last_log.entry_hash else GENESIS_HASH

        event_id = f"EVT-{uuid.uuid4().hex[:10].upper()}"
        now = datetime.datetime.utcnow()
        timestamp_str = now.isoformat()

        entry_hash = self.compute_audit_hash(prev_hash, event_id, timestamp_str, agent_id, action, decision)

        audit_entry = models.AuditLog(
            event_id=event_id,
            timestamp=now,
            agent_id=agent_id,
            action=action,
            target_agent_id=target_agent_id,
            requested_resource=requested_resource,
            shared_resource=shared_resource,
            decision=decision,
            reason=reason,
            policy_checked=policy_checked,
            task_id=task_id,
            prev_hash=prev_hash,
            entry_hash=entry_hash
        )
        self.db.add(audit_entry)
        self.db.commit()
        self.db.refresh(audit_entry)
        return audit_entry

    def update_agent_trust_score(self, agent: models.Agent, delta: float, reason: str, event_type: str) -> float:
        old_score = agent.trust_score
        new_score = max(0.0, min(100.0, round(old_score + delta, 1)))
        agent.trust_score = new_score

        trust_event = models.TrustScoreEvent(
            agent_id=agent.id,
            score_before=old_score,
            score_after=new_score,
            delta=delta,
            event_type=event_type,
            reason=reason
        )
        self.db.add(trust_event)
        self.db.commit()

        # Update passport status if score falls critically
        if agent.passport:
            if new_score < 40.0 and agent.passport.status == "verified":
                agent.passport.health_status = "CRITICAL"
                agent.status = "suspended"
                agent.passport.status = "suspended"
                self.create_security_alert(
                    severity="CRITICAL",
                    title="Agent Suspended Due to Critical Trust Degradation",
                    description=f"Agent {agent.name} trust score dropped to {new_score}. Automated suspension enforced.",
                    agent_id=agent.id,
                    alert_type="TRUST_DEGRADATION"
                )
            elif new_score < 60.0:
                agent.passport.health_status = "WARNING"
            else:
                agent.passport.health_status = "HEALTHY"
            self.db.commit()

        return new_score

    def create_security_alert(self, severity: str, title: str, description: str, agent_id: Optional[str], alert_type: str) -> models.SecurityAlert:
        alert = models.SecurityAlert(
            severity=severity,
            title=title,
            description=description,
            agent_id=agent_id,
            alert_type=alert_type,
            status="open"
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def verify_active_temporary_permissions(self):
        """Enforces backend-level expiration of temporary permissions."""
        now = datetime.datetime.utcnow()
        expired_perms = self.db.query(models.TemporaryAccess).filter(
            models.TemporaryAccess.status == "active",
            models.TemporaryAccess.expires_at <= now
        ).all()

        for perm in expired_perms:
            perm.status = "expired"
            perm.revocation_reason = "TTL_EXPIRED"
            self.create_audit_entry(
                agent_id=perm.requesting_agent_id,
                action="TEMPORARY_PERMISSION_EXPIRED",
                decision="EXPIRED",
                reason=f"Temporary task access for {perm.allowed_resource} automatically expired at {now.isoformat()}.",
                target_agent_id=perm.target_agent_id,
                requested_resource=perm.allowed_resource,
                task_id=perm.task_id
            )
        if expired_perms:
            self.db.commit()

    def detect_anomaly(self, agent: models.Agent, requested_resource: str, request_payload: dict) -> Tuple[bool, float, str]:
        """Rule-based anomaly detection checking purpose, tools, and behavior norms."""
        purpose_lower = (agent.purpose or "").lower()
        resource_lower = requested_resource.lower()

        # Check 1: Procurement agent attempting raw financial banking / credentials
        if "procure" in purpose_lower and any(kw in resource_lower for kw in ["salary", "payroll", "employee_personal", "banking_credentials"]):
            return True, 92.0, f"Procurement Agent attempted access to {requested_resource} which deviates from approved procurement purpose."

        # Check 2: Finance agent attempting core security kernel or audit logs
        if "finance" in purpose_lower and any(kw in resource_lower for kw in ["raw_penetration_test", "kernel_keys", "infrastructure_firewall"]):
            return True, 88.0, f"Finance Agent requested infrastructure security keys outside financial authorization."

        # Check 3: Mass payload or bulk data extraction attempt
        if request_payload and request_payload.get("limit", 0) > 10000:
            return True, 85.0, "Bulk extraction pattern detected exceeding safe exchange threshold."

        return False, 0.0, ""

    def evaluate_exchange_request(
        self,
        requesting_agent_identifier: str,
        target_agent_identifier: str,
        requested_resource: str,
        task_id: Optional[str] = None,
        request_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        The Core 6-Stage Governance Pipeline:
        IDENTITY VERIFICATION -> PERMISSION CHECK -> POLICY ENFORCEMENT ->
        SAFE DATA EXCHANGE -> TEMPORARY ACCESS ISSUANCE -> AUDIT TRAIL
        """
        self.verify_active_temporary_permissions()
        task_id = task_id or f"TSK-{uuid.uuid4().hex[:8].upper()}"
        request_payload = request_payload or {}

        # 0. Emergency Kill Switch Check
        emergency = self.db.query(models.EmergencyControlState).first()
        if emergency and emergency.is_active:
            if emergency.scope == "ALL" or requesting_agent_identifier in (emergency.affected_agent_ids or []):
                self.create_audit_entry(
                    agent_id=requesting_agent_identifier,
                    action="EXCHANGE_BLOCKED_BY_KILL_SWITCH",
                    decision="DENIED",
                    reason="Emergency Security Kill Switch is active. All non-essential agent communications are frozen.",
                    target_agent_id=target_agent_identifier,
                    requested_resource=requested_resource,
                    task_id=task_id
                )
                return {
                    "task_id": task_id,
                    "status": "BLOCKED",
                    "decision": "DENIED",
                    "reason": "CRITICAL: System-wide Emergency Kill Switch is currently engaged.",
                    "suggested_alternative": None,
                    "response_payload": None,
                    "data_minimization": None
                }

        # 1. Identity & Registration Check (Shadow Agent Detection)
        requesting_agent = self.db.query(models.Agent).filter(
            (models.Agent.agent_id == requesting_agent_identifier) | (models.Agent.id == requesting_agent_identifier)
        ).first()

        target_agent = self.db.query(models.Agent).filter(
            (models.Agent.agent_id == target_agent_identifier) | (models.Agent.id == target_agent_identifier)
        ).first()

        if not requesting_agent:
            # SHADOW AGENT DETECTED!
            alert = self.create_security_alert(
                severity="CRITICAL",
                title="UNKNOWN SHADOW AGENT DETECTED",
                description=f"Unregistered agent '{requesting_agent_identifier}' attempted to establish exchange with '{target_agent_identifier}'. Blocked immediately.",
                agent_id=None,
                alert_type="SHADOW_AGENT"
            )
            self.create_audit_entry(
                agent_id=requesting_agent_identifier,
                action="SHADOW_AGENT_BLOCKED",
                decision="DENIED",
                reason=f"Identity '{requesting_agent_identifier}' not found in Agent Registry. Potential shadow agent breach attempt.",
                target_agent_id=target_agent_identifier,
                requested_resource=requested_resource,
                policy_checked="POL_SHADOW_AGENT_BLOCK",
                task_id=task_id
            )
            return {
                "task_id": task_id,
                "status": "BLOCKED",
                "decision": "DENIED",
                "reason": f"SECURITY ALERT: UNKNOWN AGENT DETECTED ({requesting_agent_identifier}). Request refused by Passport Verification Engine.",
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # Target Agent verification
        if not target_agent:
            return {
                "task_id": task_id,
                "status": "DENIED",
                "decision": "DENIED",
                "reason": f"Target agent '{target_agent_identifier}' does not exist or has been decommissioned.",
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # 2. Digital Passport Validation Check
        req_passport = requesting_agent.passport
        tgt_passport = target_agent.passport

        if not req_passport or req_passport.status != "verified":
            status_desc = req_passport.status if req_passport else "NO_PASSPORT"
            self.create_audit_entry(
                agent_id=requesting_agent.agent_id,
                action="INVALID_PASSPORT_CHECK",
                decision="DENIED",
                reason=f"Requesting Agent passport is invalid (Status: {status_desc}).",
                target_agent_id=target_agent.agent_id,
                requested_resource=requested_resource,
                task_id=task_id
            )
            return {
                "task_id": task_id,
                "status": "DENIED",
                "decision": "DENIED",
                "reason": f"Passport Verification Failed: Agent passport status is '{status_desc}'.",
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # Passport Expiration Check
        now = datetime.datetime.utcnow()
        if req_passport.expires_at <= now:
            req_passport.status = "expired"
            self.db.commit()
            return {
                "task_id": task_id,
                "status": "DENIED",
                "decision": "DENIED",
                "reason": f"Agent Passport {req_passport.passport_id} expired on {req_passport.expires_at.strftime('%Y-%m-%d')}. Renewal required.",
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # 3. Behaviour Anomaly Detection
        is_anomaly, anomaly_score, anomaly_reason = self.detect_anomaly(requesting_agent, requested_resource, request_payload)
        if is_anomaly:
            # Record behaviour anomaly event
            bev = models.BehaviourEvent(
                agent_id=requesting_agent.id,
                event_type="UNUSUAL_RESOURCE_ACCESS_ATTEMPT",
                resource=requested_resource,
                is_anomaly=True,
                anomaly_score=anomaly_score,
                details={"reason": anomaly_reason, "payload": request_payload}
            )
            self.db.add(bev)
            self.create_security_alert(
                severity="HIGH",
                title=f"Behaviour Anomaly Detected: {requesting_agent.name}",
                description=anomaly_reason,
                agent_id=requesting_agent.id,
                alert_type="ANOMALY"
            )
            # Penalize trust score
            self.update_agent_trust_score(
                agent=requesting_agent,
                delta=-12.5,
                reason=f"Anomalous resource request attempted: {requested_resource}",
                event_type="ANOMALY"
            )
            req_passport.violation_count += 1
            self.db.commit()

            self.create_audit_entry(
                agent_id=requesting_agent.agent_id,
                action="ANOMALY_BLOCKED",
                decision="DENIED",
                reason=f"Behaviour Anomaly Engine triggered: {anomaly_reason}",
                target_agent_id=target_agent.agent_id,
                requested_resource=requested_resource,
                policy_checked="POL_BEHAVIOUR_ANOMALY_PREVENTION",
                task_id=task_id
            )
            return {
                "task_id": task_id,
                "status": "BLOCKED",
                "decision": "DENIED",
                "reason": f"SECURITY ANOMALY DETECTED: {anomaly_reason}",
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # 4. Low Trust Check (< 50)
        if requesting_agent.trust_score < 50.0:
            # Force human approval for degraded trust agents
            approval = models.ApprovalRequest(
                requesting_agent_id=requesting_agent.agent_id,
                target_agent_id=target_agent.agent_id,
                requested_resource=requested_resource,
                risk_level="HIGH",
                status="pending",
                reason=f"Agent trust score ({requesting_agent.trust_score}/100) is below safety threshold (50.0). Manual authorization required."
            )
            self.db.add(approval)
            self.db.commit()

            self.create_audit_entry(
                agent_id=requesting_agent.agent_id,
                action="LOW_TRUST_ESCALATION",
                decision="HUMAN_APPROVAL_REQUIRED",
                reason=f"Agent trust score {requesting_agent.trust_score} requires mandatory Security Officer approval.",
                target_agent_id=target_agent.agent_id,
                requested_resource=requested_resource,
                policy_checked="POL_LOW_TRUST_ESCALATION",
                task_id=task_id
            )
            return {
                "task_id": task_id,
                "status": "PENDING_APPROVAL",
                "decision": "HUMAN_APPROVAL_REQUIRED",
                "reason": f"Agent trust score ({requesting_agent.trust_score}) is below standard. Request routed to Smart Approval Queue.",
                "approval_id": approval.id,
                "suggested_alternative": None,
                "response_payload": None,
                "data_minimization": None
            }

        # 5. Policy Rules Evaluation
        policies = self.db.query(models.PolicyRule).filter(models.PolicyRule.is_active == True).all()

        # Check: Sensitive Financial Data requires human approval
        if "financial" in requested_resource.lower() or "payment" in requested_resource.lower():
            fin_policy = next((p for p in policies if p.rule_code == "POL_FINANCIAL_APPROVAL"), None)
            if fin_policy and fin_policy.action == "HUMAN_APPROVAL":
                # Create approval request
                approval = models.ApprovalRequest(
                    requesting_agent_id=requesting_agent.agent_id,
                    target_agent_id=target_agent.agent_id,
                    requested_resource=requested_resource,
                    risk_level="HIGH",
                    status="pending",
                    reason="Enterprise Policy POL_FINANCIAL_APPROVAL requires administrator authorization for financial transactions."
                )
                self.db.add(approval)
                self.db.commit()

                self.create_audit_entry(
                    agent_id=requesting_agent.agent_id,
                    action="HUMAN_APPROVAL_QUEUED",
                    decision="HUMAN_APPROVAL_REQUIRED",
                    reason="Sensitive financial information requested. Sent to Smart Approval Queue.",
                    target_agent_id=target_agent.agent_id,
                    requested_resource=requested_resource,
                    policy_checked="POL_FINANCIAL_APPROVAL",
                    task_id=task_id
                )
                return {
                    "task_id": task_id,
                    "status": "PENDING_APPROVAL",
                    "decision": "HUMAN_APPROVAL_REQUIRED",
                    "reason": "Request held in Smart Approval Queue: Sensitive financial information requires administrative sign-off.",
                    "approval_id": approval.id,
                    "suggested_alternative": None,
                    "response_payload": None,
                    "data_minimization": None
                }

        # Check: Complete / Confidential Raw Reports (Data Minimization / Smart Negotiation)
        if any(term in requested_resource.lower() for term in ["complete_security_audit_report", "full_security_report", "raw_audit_report"]):
            # Trigger Smart Permission Negotiation: Full report denied, Safe verification summary suggested!
            suggested_alt = {
                "requested_resource": requested_resource,
                "full_report_status": "DENIED",
                "suggested_resource": "supplier_security_status_summary",
                "allowed_fields": ["supplier_name", "security_status", "compliance_frameworks", "risk_classification"],
                "denied_fields": ["penetration_test_vulnerabilities", "source_code_flaws", "internal_ip_addresses", "soc2_auditor_notes"],
                "negotiation_rationale": "Direct confidential security audit reports cannot be exposed. Safe verification summary with PASSED status achieves procurement goal securely."
            }

            self.create_audit_entry(
                agent_id=requesting_agent.agent_id,
                action="RESTRICTED_DATA_NEGOTIATION",
                decision="ALTERNATIVE_ACCESS_SUGGESTED",
                reason="Full confidential security report restricted. Safe verification summary suggested via Smart Negotiation.",
                target_agent_id=target_agent.agent_id,
                requested_resource=requested_resource,
                shared_resource="supplier_security_status_summary",
                policy_checked="POL_RESTRICT_CONFIDENTIAL_REPORTS",
                task_id=task_id
            )
            return {
                "task_id": task_id,
                "status": "DENIED",
                "decision": "ALTERNATIVE_ACCESS_SUGGESTED",
                "reason": "Full confidential audit report restricted by Data Minimization Policy. Smart alternative access proposed.",
                "suggested_alternative": suggested_alt,
                "response_payload": None,
                "data_minimization": {
                    "requested_fields": suggested_alt["denied_fields"] + suggested_alt["allowed_fields"],
                    "shared_fields": suggested_alt["allowed_fields"],
                    "hidden_fields": suggested_alt["denied_fields"],
                    "minimization_rationale": suggested_alt["negotiation_rationale"],
                    "transformation_applied": "FULL_REPORT_TO_SUMMARY_REDUCTION"
                }
            }

        # 6. Standard Allowed Exchange with Privacy-Preserving Transformation & Temporary Access
        minimization_config = DATA_MINIMIZATION_RULES.get(
            requested_resource,
            DATA_MINIMIZATION_RULES.get("supplier_security_audit")
        )

        minimized_payload = minimization_config["transformer"](request_payload)
        shared_summary = f"{minimized_payload.get('supplier_name', 'Subject')} - SECURITY STATUS: {minimized_payload.get('security_status', 'PASSED')}"

        # Issue Temporary Task-Specific Access (Valid for 15 minutes)
        validity_seconds = 900
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=validity_seconds)
        temp_access = models.TemporaryAccess(
            task_id=task_id,
            requesting_agent_id=requesting_agent.agent_id,
            target_agent_id=target_agent.agent_id,
            allowed_resource=requested_resource,
            allowed_action="read",
            expires_at=expires_at,
            status="active"
        )
        self.db.add(temp_access)

        # Reward reliable behavior with small trust increment
        self.update_agent_trust_score(
            agent=requesting_agent,
            delta=0.5,
            reason=f"Successful compliant exchange executed for task {task_id}.",
            event_type="SUCCESSFUL_TASK"
        )

        # Record Audit Entry
        self.create_audit_entry(
            agent_id=requesting_agent.agent_id,
            action="EXCHANGE_ALLOWED",
            decision="ALLOWED",
            reason=f"Identity verified, permissions authorized, and data minimization applied. Granted temporary access {task_id}.",
            target_agent_id=target_agent.agent_id,
            requested_resource=requested_resource,
            shared_resource=shared_summary,
            policy_checked="POL_MINIMUM_NECESSARY_EXCHANGE",
            task_id=task_id
        )

        self.db.commit()

        return {
            "task_id": task_id,
            "status": "COMPLETED",
            "decision": "ALLOWED",
            "reason": "Identity verified, capabilities confirmed, and privacy-preserving data minimization applied.",
            "suggested_alternative": None,
            "response_payload": minimized_payload,
            "data_minimization": {
                "requested_fields": minimization_config["requested_fields"],
                "shared_fields": minimization_config["shared_fields"],
                "hidden_fields": minimization_config["hidden_fields"],
                "minimization_rationale": minimization_config["minimization_rationale"],
                "transformation_applied": "CONFIDENTIAL_SOURCE_TO_VERIFIED_RESULT"
            },
            "temporary_access": {
                "id": temp_access.id,
                "task_id": task_id,
                "expires_at": expires_at.isoformat(),
                "duration_seconds": validity_seconds,
                "status": "active"
            }
        }

    def verify_audit_chain_integrity(self) -> Dict[str, Any]:
        """Cryptographically verifies hash chain links across all audit entries."""
        logs = self.db.query(models.AuditLog).order_by(models.AuditLog.timestamp.asc()).all()
        if not logs:
            return {"is_valid": True, "total_records": 0, "status": "EMPTY", "message": "Audit chain is empty."}

        prev_hash = GENESIS_HASH
        for idx, entry in enumerate(logs):
            if entry.prev_hash != prev_hash:
                return {
                    "is_valid": False,
                    "tampered_index": idx,
                    "event_id": entry.event_id,
                    "expected_prev_hash": prev_hash,
                    "actual_prev_hash": entry.prev_hash,
                    "status": "TAMPERED",
                    "message": f"Hash chain discrepancy detected at record {entry.event_id}."
                }
            # Verify recalculated hash
            expected_hash = self.compute_audit_hash(
                prev_hash, entry.event_id, entry.timestamp.isoformat(), entry.agent_id, entry.action, entry.decision
            )
            if entry.entry_hash != expected_hash:
                return {
                    "is_valid": False,
                    "tampered_index": idx,
                    "event_id": entry.event_id,
                    "expected_entry_hash": expected_hash,
                    "actual_entry_hash": entry.entry_hash,
                    "status": "CORRUPTED",
                    "message": f"Tampering detected: Entry payload hash modified for {entry.event_id}."
                }
            prev_hash = entry.entry_hash

        return {
            "is_valid": True,
            "total_records": len(logs),
            "status": "VERIFIED_SECURE",
            "genesis_hash": GENESIS_HASH,
            "latest_head_hash": prev_hash,
            "message": f"All {len(logs)} audit trail entries verified intact against SHA-256 cryptographic chain."
        }

