import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  UserCheck,
  Shield,
  MessageSquare,
  Sliders,
  Send
} from 'lucide-react';
import { ApprovalRequest } from '../types';
import { api } from '../services/api';

export const ApprovalQueuePage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [activeDecisionModal, setActiveDecisionModal] = useState<{
    approval: ApprovalRequest;
    action: 'approve' | 'reject' | 'modify';
  } | null>(null);
  const [reviewerComment, setReviewerComment] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getApprovals(filter === 'pending' ? 'pending' : undefined);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!activeDecisionModal) return;
    try {
      await api.decideApproval(
        activeDecisionModal.approval.id,
        activeDecisionModal.action,
        reviewerComment || `Action ${activeDecisionModal.action.toUpperCase()} authorized via web console.`
      );
      setNotification(`Request marked as ${activeDecisionModal.action.toUpperCase()} and inscribed in audit trail.`);
      setTimeout(() => setNotification(null), 4000);
      setActiveDecisionModal(null);
      setReviewerComment('');
      loadApprovals();
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">HIGH RISK</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">MEDIUM RISK</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Smart Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-Loop governance for high-risk data exchanges, low-trust agent queries, and financial transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                filter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending ({approvals.filter((a) => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              History
            </button>
          </div>
          <button
            onClick={loadApprovals}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.length > 0 ? (
          approvals.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {getRiskBadge(req.risk_level)}
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {req.requesting_agent_id} → {req.target_agent_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900">
                  Requested Resource: <span className="font-mono text-electric-600">{req.requested_resource}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {req.reason}
                </p>

                {req.reviewed_by && (
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Reviewed by: {req.reviewed_by} on {new Date(req.reviewed_at!).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setActiveDecisionModal({ approval: req, action: 'approve' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setActiveDecisionModal({ approval: req, action: 'modify' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Modify</span>
                  </button>

                  <button
                    onClick={() => setActiveDecisionModal({ approval: req, action: 'reject' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h4 className="font-semibold text-slate-800 text-sm">Approval Queue is Clear</h4>
            <p className="text-xs text-slate-500 mt-1">No sensitive inter-agent operations pending administrator authorization.</p>
          </div>
        )}
      </div>

      {/* Decision Comment Modal */}
      {activeDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-base text-slate-900 mb-2">
              Confirm {activeDecisionModal.action.toUpperCase()} Decision
            </h3>
            <p className="text-slate-600 mb-4">
              Agent: <span className="font-mono font-bold text-slate-800">{activeDecisionModal.approval.requesting_agent_id}</span>
              <br />
              Resource: <span className="font-mono text-electric-600">{activeDecisionModal.approval.requested_resource}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Administrator Comments (Logged to Hash-Chained Audit Trail)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain justification, security conditions, or rationale..."
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-electric-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveDecisionModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecisionSubmit}
                  className={`px-4 py-2 text-white rounded-lg font-semibold shadow-sm ${
                    activeDecisionModal.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : activeDecisionModal.action === 'modify'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm & Inscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

