import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LiveDemoModal } from './components/demo/LiveDemoModal';
import { DashboardPage } from './pages/DashboardPage';
import { AgentRegistryPage } from './pages/AgentRegistryPage';
import { DigitalPassportsPage } from './pages/DigitalPassportsPage';
import { ExchangeCenterPage } from './pages/ExchangeCenterPage';
import { PermissionManagerPage } from './pages/PermissionManagerPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { TrustAnalyticsPage } from './pages/TrustAnalyticsPage';
import { BehaviourMonitoringPage } from './pages/BehaviourMonitoringPage';
import { PolicySimulationPage } from './pages/PolicySimulationPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

import { User, UserRole, DashboardStats } from './types';
import { api } from './services/api';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [agentIdentity, setAgentIdentity] = useState<any | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const storedAgent = localStorage.getItem('agent_passport_identity');
      if (storedAgent) {
        setAgentIdentity(JSON.parse(storedAgent));
      }

      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      // Default auto-login to Procurement Agent for demonstration readiness
      try {
        const res = await api.agentLogin({ agent_id: 'agt_procurement_01' });
        localStorage.setItem('agent_passport_token', res.access_token);
        localStorage.setItem('agent_passport_identity', JSON.stringify(res.agent));
        setAgentIdentity(res.agent);
        setCurrentUser(res.user);
      } catch {
        setCurrentUser(null);
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      console.warn('Could not load stats', err);
    }
  };

  const handleAgentSelect = async (agentId: string) => {
    try {
      const res = await api.agentLogin({ agent_id: agentId });
      localStorage.setItem('agent_passport_token', res.access_token);
      localStorage.setItem('agent_passport_identity', JSON.stringify(res.agent));
      setAgentIdentity(res.agent);
      setCurrentUser(res.user);
      loadStats();
    } catch (err) {
      console.error('Agent login failed', err);
    }
  };

  const handleRoleSelect = async (roleEmail: string, rolePass: string) => {
    try {
      const res = await api.login({ email: roleEmail, password: rolePass });
      localStorage.setItem('agent_passport_token', res.access_token);
      localStorage.removeItem('agent_passport_identity');
      setAgentIdentity(null);
      setCurrentUser(res.user);
      loadStats();
    } catch (err) {
      console.error('Role switch failed', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agent_passport_token');
    localStorage.removeItem('agent_passport_identity');
    setAgentIdentity(null);
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-electric-500 animate-ping"></div>
          <span>INITIALIZING AGENT PASSPORT SECURITY FABRIC...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user, token, agentData) => {
          setCurrentUser(user);
          if (agentData) {
            setAgentIdentity(agentData);
          } else {
            setAgentIdentity(null);
          }
          loadStats();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Left Sidebar for all 12 Core Pages */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        pendingApprovalsCount={stats?.pending_approvals || 0}
        openAlertsCount={stats?.open_alerts || 0}
        isEmergencyActive={stats?.emergency_kill_switch_active || false}
        authenticatedAgent={agentIdentity}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          agentIdentity={agentIdentity}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onAgentSelect={handleAgentSelect}
          onRoleSelect={handleRoleSelect}
          onLogout={handleLogout}
          isEmergencyActive={stats?.emergency_kill_switch_active || false}
          activeTemporaryTokensCount={stats?.active_temporary_permissions || 0}
        />

        {/* 12 Core Platform Pages Router */}
        <main className="flex-1 p-6 mt-16 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onOpenDemo={() => setIsDemoModalOpen(true)}
            />
          )}
          {currentPage === 'agents' && <AgentRegistryPage />}
          {currentPage === 'passports' && <DigitalPassportsPage />}
          {currentPage === 'exchanges' && <ExchangeCenterPage />}
          {currentPage === 'permissions' && <PermissionManagerPage />}
          {currentPage === 'approvals' && <ApprovalQueuePage />}
          {currentPage === 'analytics' && <TrustAnalyticsPage />}
          {currentPage === 'behaviour' && <BehaviourMonitoringPage />}
          {currentPage === 'simulation' && <PolicySimulationPage />}
          {currentPage === 'command-center' && <CommandCenterPage />}
          {currentPage === 'audit-trail' && <AuditTrailPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Live Hackathon Demo Interactive Modal */}
      <LiveDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onRefreshData={loadStats}
      />
    </div>
  );
}

export default App;
