import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Search,
  Eye,
  Filter,
  Check,
  Cpu
} from 'lucide-react';
import { SecurityAlert } from '../types';
import { api } from '../services/api';

export const BehaviourMonitoringPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true);
      const [alertsRes, eventsRes] = await Promise.all([
        api.getSecurityAlerts(),
        api.getBehaviourEvents()
      ]);
      setAlerts(alertsRes);
      setEvents(eventsRes);
    } catch (err) {
      console.error('Failed to load monitoring data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId);
      loadMonitoringData();
    } catch (err: any) {
      alert(`Error resolving alert: ${err.message}`);
    }
  };

  const filteredAlerts = filterSeverity
    ? alerts.filter((a) => a.severity === filterSeverity)
    : alerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Agent Behaviour Monitoring & Anomaly Detection</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based anomaly detection inspecting purpose drift, shadow agent attempts, and unauthorized privilege escalation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
          <button
            onClick={loadMonitoringData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Threat Alerts Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">Security Threat & Anomaly Alerts</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
            {alerts.filter((a) => a.status === 'open').length} Open Threats
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-slate-50/70 transition-colors text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-bold text-slate-900">{alert.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Type: {alert.alert_type}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed max-w-3xl">{alert.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Detected: {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.status === 'open' ? (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge & Resolve</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 font-mono">
                      RESOLVED
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <span>No alerts matching the selected filter.</span>
            </div>
          )}
        </div>
      </div>

      {/* Behaviour Event Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-electric-600" />
            <span>Raw Behavioural Telemetry Stream</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitors real-time inter-agent resource queries against baseline profiles.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Anomaly Score</th>
                <th className="py-3 px-4">Flagged Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{ev.event_type}</td>
                    <td className="py-3 px-4 font-mono text-electric-600">{ev.resource}</td>
                    <td className="py-3 px-4">
                      {ev.is_anomaly ? (
                        <span className="font-bold text-red-600 font-mono">
                          {ev.anomaly_score.toFixed(1)} (ANOMALOUS)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-mono">0.0 (NORMAL)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {ev.details?.reason || 'Within approved behavioral variance.'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    No anomalous telemetry recorded in current monitoring window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

