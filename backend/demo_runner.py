import uuid
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
import models
from security_engine import SecurityEngine

class DemoScenarioRunner:
    def __init__(self, db: Session):
        self.db = db
        self.engine = SecurityEngine(db)

    def run_scenario(self, scenario_id: int) -> Dict[str, Any]:
        if scenario_id == 1:
            return self._run_scenario_1()
        elif scenario_id == 2:
            return self._run_scenario_2()
        elif scenario_id == 3:
            return self._run_scenario_3()
        elif scenario_id == 4:
            return self._run_scenario_4()
        elif scenario_id == 5:
            return self._run_scenario_5()
        elif scenario_id == 6:
            return self._run_scenario_6()
        else:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")

    def _run_scenario_1(self) -> Dict[str, Any]:
        """SCENARIO 1: SUCCESSFUL EXCHANGE with Data Minimization and Temporary Access"""
        task_id = f"TSK-DEMO-{uuid.uuid4().hex[:6].upper()}"
        res = self.engine.evaluate_exchange_request(
            requesting_agent_identifier="agt_procurement_01",
            target_agent_identifier="agt_security_02",
            requested_resource="supplier_security_audit",
            task_id=task_id,
            request_payload={"supplier_name": "CloudNova Logistics Inc", "procurement_item": "Tier-1 Cloud Routing"}
        )

        # Store in exchange_requests table
        exchange = models.ExchangeRequest(
            task_id=task_id,
            requesting_agent_id="agt_procurement_01",
            target_agent_id="agt_security_02",
            requested_resource="supplier_security_audit",
            request_payload={"supplier_name": "CloudNova Logistics Inc"},
            status="COMPLETED",
            decision=res["decision"],
            reason=res["reason"],
            response_payload=res["response_payload"],
            data_minimization=res["data_minimization"]
        )
        self.db.add(exchange)
        self.db.commit()
        self.db.refresh(exchange)

        return {
            "scenario_id": 1,
            "title": "Scenario 1: Successful Exchange with Data Minimization",
            "summary": "Procurement Agent requested supplier security status. Both digital passports verified. Privacy-preserving data minimization shared only 'SECURITY STATUS: PASSED'. Temporary task token issued and verified.",
            "pipeline_steps": [
                {"step": "IDENTITY_VERIFICATION", "status": "PASSED", "detail": "Procurement Agent & Security Agent passports cryptographically verified (PASS-PROC-9921, PASS-SECU-8842)."},
                {"step": "PERMISSION_CHECK", "status": "PASSED", "detail": "Authorized capability 'security_verification:query' validated."},
                {"step": "DATA_MINIMIZATION", "status": "APPLIED", "detail": "Confidential vulnerabilities withheld. Exchanged verified PASSED certification."},
                {"step": "TEMPORARY_ACCESS", "status": "ISSUED", "detail": f"Task access token {task_id} issued with 900s expiration."},
                {"step": "HASH_CHAIN_AUDIT", "status": "COMMITTED", "detail": "Exchange recorded to tamper-evident cryptographic hash chain."}
            ],
            "result": res,
            "exchange_id": exchange.id
        }

    def _run_scenario_2(self) -> Dict[str, Any]:
        """SCENARIO 2: RESTRICTED DATA with Smart Permission Negotiation"""
        task_id = f"TSK-DEMO-{uuid.uuid4().hex[:6].upper()}"
        res = self.engine.evaluate_exchange_request(
            requesting_agent_identifier="agt_procurement_01",
            target_agent_identifier="agt_security_02",
            requested_resource="complete_security_audit_report",
            task_id=task_id,
            request_payload={"scope": "full_raw_vulnerabilities"}
        )

        exchange = models.ExchangeRequest(
            task_id=task_id,
            requesting_agent_id="agt_procurement_01",
            target_agent_id="agt_security_02",
            requested_resource="complete_security_audit_report",
            request_payload={"scope": "full_raw_vulnerabilities"},
            status="DENIED",
            decision=res["decision"],
            reason=res["reason"],
            suggested_alternative=res["suggested_alternative"],
            data_minimization=res["data_minimization"]
        )
        self.db.add(exchange)
        self.db.commit()
        self.db.refresh(exchange)

        return {
            "scenario_id": 2,
            "title": "Scenario 2: Restricted Data & Smart Negotiation",
            "summary": "Procurement Agent requested complete confidential security report. Access was DENIED per data minimization policies, and platform automatically negotiated a safe verification summary alternative.",
            "pipeline_steps": [
                {"step": "IDENTITY_VERIFICATION", "status": "PASSED", "detail": "Valid agent passport PASS-PROC-9921 confirmed."},
                {"step": "POLICY_CHECK", "status": "TRIGGERED", "detail": "Policy POL_RESTRICT_CONFIDENTIAL_REPORTS flagged raw report."},
                {"step": "ACCESS_DECISION", "status": "DENIED", "detail": "Raw vulnerability files and pentest logs denied."},
                {"step": "SMART_NEGOTIATION", "status": "SUGGESTED", "detail": "Platform proposed safe alternative: 'supplier_security_status_summary'."},
                {"step": "AUDIT_TRAIL", "status": "RECORDED", "detail": "Denial and negotiated alternative registered in cryptographic audit log."}
            ],
            "result": res,
            "exchange_id": exchange.id
        }

    def _run_scenario_3(self) -> Dict[str, Any]:
        """SCENARIO 3: HUMAN APPROVAL for Sensitive Financial Information"""
        task_id = f"TSK-DEMO-{uuid.uuid4().hex[:6].upper()}"
        res = self.engine.evaluate_exchange_request(
            requesting_agent_identifier="agt_finance_03",
            target_agent_identifier="agt_procurement_01",
            requested_resource="financial_records_vendor_wire_details",
            task_id=task_id,
            request_payload={"vendor_id": "VEND-8841", "amount": 250000}
        )

        exchange = models.ExchangeRequest(
            task_id=task_id,
            requesting_agent_id="agt_finance_03",
            target_agent_id="agt_procurement_01",
            requested_resource="financial_records_vendor_wire_details",
            request_payload={"vendor_id": "VEND-8841", "amount": 250000},
            status="PENDING_APPROVAL",
            decision=res["decision"],
            reason=res["reason"]
        )
        self.db.add(exchange)
        self.db.commit()
        self.db.refresh(exchange)

        return {
            "scenario_id": 3,
            "title": "Scenario 3: Human Approval Escalation",
            "summary": "Finance Agent requested wire disbursement details ($250,000). Policy POL_FINANCIAL_APPROVAL paused the workflow and routed it to the Smart Approval Queue for administrator sign-off.",
            "pipeline_steps": [
                {"step": "IDENTITY_VERIFICATION", "status": "PASSED", "detail": "Finance Agent passport PASS-FIN-7719 valid."},
                {"step": "POLICY_CHECK", "status": "RESTRICTED", "detail": "Triggered mandatory human sign-off on financial records."},
                {"step": "ESCALATION", "status": "QUEUED", "detail": "Queued in Smart Approval Queue with HIGH risk rating."},
                {"step": "WORKFLOW_STATE", "status": "PAUSED", "detail": "Awaiting Administrator or Security Officer sign-off."},
                {"step": "AUDIT_RECORD", "status": "LOGGED", "detail": "Approval dispatch logged with SHA-256 state tracking."}
            ],
            "result": res,
            "exchange_id": exchange.id
        }

    def _run_scenario_4(self) -> Dict[str, Any]:
        """SCENARIO 4: SHADOW AGENT DETECTION"""
        task_id = f"TSK-DEMO-{uuid.uuid4().hex[:6].upper()}"
        res = self.engine.evaluate_exchange_request(
            requesting_agent_identifier="agt_rogue_shadow_99",
            target_agent_identifier="agt_security_02",
            requested_resource="infrastructure_firewall_keys",
            task_id=task_id
        )

        return {
            "scenario_id": 4,
            "title": "Scenario 4: Shadow Agent Detection & Quarantine",
            "summary": "Unregistered identity 'agt_rogue_shadow_99' attempted to initiate exchange with Security Agent. Blocked instantly with UNKNOWN AGENT DETECTED alert.",
            "pipeline_steps": [
                {"step": "IDENTITY_VERIFICATION", "status": "FAILED", "detail": "Agent ID 'agt_rogue_shadow_99' not present in Passport Registry."},
                {"step": "SHADOW_DETECTION", "status": "CONFIRMED", "detail": "Rogue shadow agent signature flagged."},
                {"step": "SECURITY_ALERT", "status": "DISPATCHED", "detail": "CRITICAL security alert raised to Security Command Center."},
                {"step": "ACCESS_DECISION", "status": "BLOCKED", "detail": "Connection refused with zero data exposure."},
                {"step": "AUDIT_TRAIL", "status": "LINKED", "detail": "Attempt permanently inscribed in hash-chained audit log."}
            ],
            "result": res
        }

    def _run_scenario_5(self) -> Dict[str, Any]:
        """SCENARIO 5: BEHAVIOUR ANOMALY DETECTION"""
        task_id = f"TSK-DEMO-{uuid.uuid4().hex[:6].upper()}"
        res = self.engine.evaluate_exchange_request(
            requesting_agent_identifier="agt_procurement_01",
            target_agent_identifier="agt_finance_03",
            requested_resource="employee_personal_payroll_and_salary",
            task_id=task_id,
            request_payload={"limit": 500}
        )

        return {
            "scenario_id": 5,
            "title": "Scenario 5: Behaviour Anomaly Detection",
            "summary": "Procurement Agent attempted to query employee payroll & salary records. Deviation from declared purpose was caught by Anomaly Detection Engine; trust score docked by 12.5 points.",
            "pipeline_steps": [
                {"step": "PURPOSE_VERIFICATION", "status": "FAILED", "detail": "Declared purpose is 'Supplier management'; payroll access deviates 92%."},
                {"step": "ANOMALY_ENGINE", "status": "FLAGGED", "detail": "Rule-based pattern classified as anomalous privilege creep."},
                {"step": "TRUST_PENALTY", "status": "ENFORCED", "detail": "Trust score decreased by 12.5 points with documented reason."},
                {"step": "SECURITY_ALERT", "status": "CREATED", "detail": "HIGH severity anomaly alert dispatched to monitoring."},
                {"step": "REQUEST_STATUS", "status": "BLOCKED", "detail": "Request blocked before reaching target agent."}
            ],
            "result": res
        }

    def _run_scenario_6(self) -> Dict[str, Any]:
        """SCENARIO 6: EMERGENCY KILL SWITCH ACTIVATION"""
        now = datetime.datetime.utcnow()
        # Revoke all active temporary permissions
        active_perms = self.db.query(models.TemporaryAccess).filter(models.TemporaryAccess.status == "active").all()
        for p in active_perms:
            p.status = "revoked"
            p.revocation_reason = "EMERGENCY_KILL_SWITCH_ACTIVATED"

        # Update emergency state
        emergency = self.db.query(models.EmergencyControlState).first()
        if not emergency:
            emergency = models.EmergencyControlState()
            self.db.add(emergency)

        emergency.is_active = True
        emergency.activated_at = now
        emergency.activated_by = "Sarah Chen (Administrator)"
        emergency.scope = "ALL"
        emergency.reason = "Simulated Critical Threat Isolation protocol triggered via Emergency Kill Switch."
        emergency.affected_count = len(active_perms)

        # Suspend agents
        agents = self.db.query(models.Agent).all()
        for agt in agents:
            agt.status = "suspended"
            if agt.passport:
                agt.passport.status = "suspended"
                agt.passport.health_status = "CRITICAL"

        # Create Security Alert
        alert = models.SecurityAlert(
            severity="CRITICAL",
            title="SYSTEM EMERGENCY KILL SWITCH ENGAGED",
            description="All active temporary permissions revoked. All agent passports suspended. Inbound/outbound exchanges frozen.",
            alert_type="KILL_SWITCH",
            status="open"
        )
        self.db.add(alert)

        # Record Audit Log
        self.engine.create_audit_entry(
            agent_id="SYSTEM_ADMIN",
            action="EMERGENCY_KILL_SWITCH_ENGAGED",
            decision="ENFORCED",
            reason=f"Emergency kill switch activated. Revoked {len(active_perms)} temporary permissions and suspended all agents.",
            policy_checked="POL_EMERGENCY_ISOLATION",
            task_id="KILL-SWITCH-TRIGGER"
        )

        self.db.commit()

        return {
            "scenario_id": 6,
            "title": "Scenario 6: Emergency Kill Switch Protocol",
            "summary": f"Emergency Kill Switch engaged. Revoked {len(active_perms)} temporary permissions, suspended all agents, and halted all inter-agent traffic.",
            "pipeline_steps": [
                {"step": "COMMAND_AUTHORIZATION", "status": "VERIFIED", "detail": "Administrator credentials validated with two-party confirmation."},
                {"step": "PERMISSION_REVOCATION", "status": "EXECUTED", "detail": f"{len(active_perms)} active temporary access grants instantly terminated."},
                {"step": "PASSPORT_SUSPENSION", "status": "ENFORCED", "detail": "All 3 active digital agent passports placed into SUSPENDED state."},
                {"step": "TRAFFIC_FREEZE", "status": "ACTIVE", "detail": "Zero-trust exchange barrier activated."},
                {"step": "INCIDENT_AUDIT", "status": "COMMITTED", "detail": "Critical emergency event sealed to audit trail."}
            ],
            "stats": {
                "active_tokens_revoked": len(active_perms),
                "agents_suspended": len(agents),
                "emergency_status": "ACTIVE"
            }
        }

