import os
import sys
import unittest
from fastapi.testclient import TestClient

from main import app
from database import get_db, Base, engine

client = TestClient(app)

class TestAgentPassportPlatform(unittest.TestCase):
    def test_01_health_check(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "HEALTHY")

    def test_02_default_agents_and_passports(self):
        res = client.get("/api/agents")
        self.assertEqual(res.status_code, 200)
        agents = res.json()
        agent_ids = [a["agent_id"] for a in agents]
        self.assertIn("agt_procurement_01", agent_ids)
        self.assertIn("agt_security_02", agent_ids)
        self.assertIn("agt_finance_03", agent_ids)

        # Check passports
        pass_res = client.get("/api/passports")
        self.assertEqual(pass_res.status_code, 200)
        passports = pass_res.json()
        self.assertGreaterEqual(len(passports), 3)

    def test_03_login_and_roles(self):
        res = client.post("/api/auth/login", json={"email": "admin@agentpassport.io", "password": "admin123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "administrator")

    def test_04_scenario_1_successful_exchange_with_minimization(self):
        res = client.post("/api/demo/run-scenario/1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["result"]["decision"], "ALLOWED")
        self.assertIsNotNone(data["result"]["data_minimization"])
        # Verify supplier status was PASSED
        self.assertEqual(data["result"]["response_payload"]["security_status"], "PASSED")
        # Verify temporary access token was issued
        self.assertIsNotNone(data["result"]["temporary_access"])

    def test_05_scenario_2_restricted_data_and_smart_negotiation(self):
        res = client.post("/api/demo/run-scenario/2")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["result"]["decision"], "ALTERNATIVE_ACCESS_SUGGESTED")
        self.assertIsNotNone(data["result"]["suggested_alternative"])

    def test_06_scenario_3_human_approval_queue(self):
        res = client.post("/api/demo/run-scenario/3")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["result"]["decision"], "HUMAN_APPROVAL_REQUIRED")

        # Verify it appears in approvals queue
        appr_res = client.get("/api/approvals?status_filter=pending")
        self.assertEqual(appr_res.status_code, 200)
        self.assertGreaterEqual(len(appr_res.json()), 1)

    def test_07_scenario_4_shadow_agent_detection(self):
        res = client.post("/api/demo/run-scenario/4")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["result"]["status"], "BLOCKED")
        self.assertIn("UNKNOWN AGENT DETECTED", data["result"]["reason"])

    def test_08_scenario_5_behaviour_anomaly_detection(self):
        res = client.post("/api/demo/run-scenario/5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["result"]["status"], "BLOCKED")
        self.assertIn("SECURITY ANOMALY DETECTED", data["result"]["reason"])

    def test_09_scenario_6_emergency_kill_switch(self):
        res = client.post("/api/demo/run-scenario/6")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["stats"]["emergency_status"], "ACTIVE")

        # Verify command center reflects active kill switch
        cc_res = client.get("/api/command-center/status")
        self.assertEqual(cc_res.status_code, 200)
        self.assertTrue(cc_res.json()["emergency_kill_switch"]["is_active"])

        # Reset demo state for baseline
        reset_res = client.post("/api/demo/reset-state")
        self.assertEqual(reset_res.status_code, 200)

    def test_10_cryptographic_audit_chain_verification(self):
        res = client.get("/api/audit-trail/verify-chain")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_valid"])
        self.assertEqual(data["status"], "VERIFIED_SECURE")
        self.assertGreater(data["total_records"], 0)

if __name__ == "__main__":
    unittest.main()

