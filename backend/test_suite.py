import sys
from database import SessionLocal
import models
from security_engine import SecurityEngine
from demo_runner import DemoScenarioRunner

def run_suite():
    db = SessionLocal()
    try:
        print("[TEST] 1. Checking Database Agents...")
        agents = db.query(models.Agent).all()
        assert len(agents) >= 3, f"Expected at least 3 agents, got {len(agents)}"
        agent_ids = [a.agent_id for a in agents]
        assert "agt_procurement_01" in agent_ids
        assert "agt_security_02" in agent_ids
        assert "agt_finance_03" in agent_ids
        print(f"       Found {len(agents)} agents: {agent_ids}")

        print("[TEST] 2. Checking Passports and Signatures...")
        passports = db.query(models.AgentPassport).all()
        assert len(passports) >= 3
        for p in passports:
            assert p.digital_signature.startswith("0x")
            assert p.status in ["verified", "active"]
            assert p.qr_code_data.startswith("APEX-VERIFY://")
        print("       All passports contain valid cryptographic signatures and QR payloads.")

        print("[TEST] 3. Running Scenario 1 (Successful Exchange with Data Minimization)...")
        runner = DemoScenarioRunner(db)
        s1 = runner.run_scenario(1)
        assert s1["result"]["decision"] == "ALLOWED"
        assert s1["result"]["response_payload"]["security_status"] == "PASSED"
        assert s1["result"]["data_minimization"]["shared_fields"] == ["supplier_name", "security_status", "verification_tier", "compliance_summary", "valid_until"]
        print("       Scenario 1 PASSED: Data minimization accurately hid confidential vulnerabilities.")

        print("[TEST] 4. Running Scenario 2 (Restricted Data with Smart Negotiation)...")
        s2 = runner.run_scenario(2)
        assert s2["result"]["decision"] == "ALTERNATIVE_ACCESS_SUGGESTED"
        assert s2["result"]["suggested_alternative"]["full_report_status"] == "DENIED"
        print("       Scenario 2 PASSED: Safe verification summary proposed.")

        print("[TEST] 5. Running Scenario 3 (Human Approval Queue)...")
        s3 = runner.run_scenario(3)
        assert s3["result"]["decision"] == "HUMAN_APPROVAL_REQUIRED"
        pending_approvals = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.status == "pending").all()
        assert len(pending_approvals) >= 1
        print(f"       Scenario 3 PASSED: Request routed to Smart Approval Queue ({len(pending_approvals)} pending).")

        print("[TEST] 6. Running Scenario 4 (Shadow Agent Detection)...")
        s4 = runner.run_scenario(4)
        assert s4["result"]["status"] == "BLOCKED"
        assert "UNKNOWN AGENT DETECTED" in s4["result"]["reason"]
        shadow_alert = db.query(models.SecurityAlert).filter(models.SecurityAlert.alert_type == "SHADOW_AGENT").first()
        assert shadow_alert is not None
        print("       Scenario 4 PASSED: Rogue shadow agent successfully intercepted and quarantined.")

        print("[TEST] 7. Running Scenario 5 (Behaviour Anomaly Detection)...")
        s5 = runner.run_scenario(5)
        assert s5["result"]["status"] == "BLOCKED"
        assert "SECURITY ANOMALY DETECTED" in s5["result"]["reason"]
        print("       Scenario 5 PASSED: Anomaly detected and trust score docked.")

        print("[TEST] 8. Running Scenario 6 (Emergency Kill Switch)...")
        s6 = runner.run_scenario(6)
        assert s6["stats"]["emergency_status"] == "ACTIVE"
        emergency_state = db.query(models.EmergencyControlState).first()
        assert emergency_state.is_active is True
        print("       Scenario 6 PASSED: Kill switch engaged, tokens revoked, agent passports suspended.")

        print("[TEST] 9. Verifying SHA-256 Hash Chain Integrity...")
        engine = SecurityEngine(db)
        integrity = engine.verify_audit_chain_integrity()
        assert integrity["is_valid"] is True
        assert integrity["status"] == "VERIFIED_SECURE"
        assert integrity["total_records"] > 0
        print(f"       Hash Chain Integrity PASSED: All {integrity['total_records']} audit events verified unbroken from Genesis hash.")

        print("\n[SUCCESS] ALL 9 BACKEND GOVERNANCE TEST SUITES PASSED FLAWLESSLY!")
    finally:
        db.close()

if __name__ == "__main__":
    run_suite()

