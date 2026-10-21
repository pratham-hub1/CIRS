import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  RefreshCw,
  FileCode,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuditLogEntry, AuditLogResponse } from '../../types/admin';
import { RoleBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';

export const AdminAuditLog: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Filters
  const [searchTarget, setSearchTarget] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('');

  // Expandable row state (diff view)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [inspectEntry, setInspectEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, any> = {
        page: currentPage,
        limit,
      };
      if (searchTarget.trim()) query.targetId = searchTarget.trim();
      if (selectedAction) query.action = selectedAction;
      if (selectedTargetType) query.targetType = selectedTargetType;

      const res: AuditLogResponse = await adminService.getAuditLog(query);
      setLogs(res.logs || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      error(err.message || 'Failed to retrieve audit log records');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTarget, selectedAction, selectedTargetType, error]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('OVERRIDE')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (act.includes('REJECT') || act.includes('CANCEL') || act.includes('DISMISS'))
      return 'bg-red-100 text-red-800 border-red-200';
    if (
      act.includes('APPROVE') ||
      act.includes('HANDOVER') ||
      act.includes('RETURN') ||
      act.includes('REDEEM')
    )
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (act.includes('READY') || act.includes('HOLD') || act.includes('STATUS'))
      return 'bg-amber-100 text-amber-800 border-amber-200';
    if (act.includes('MATCH') || act.includes('CREATE'))
      return 'bg-brand-100 text-brand-800 border-brand-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <FadeIn className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 flex items-center">
              <History className="w-3 h-3 mr-1 text-brand-600" />
              Security Governance Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Audit &amp; Chain-of-Custody Log
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl font-normal">
            Append-only, immutable security event log recording all custody transitions, verifications, handovers, and staff actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Log
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Target ID Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Target ID / Case ID..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
          >
            <option value="">All Actions</option>
            <option value="ITEM_CREATED">ITEM_CREATED</option>
            <option value="ITEM_STATUS_UPDATED">ITEM_STATUS_UPDATED</option>
            <option value="ITEM_READY_FOR_COLLECTION">ITEM_READY_FOR_COLLECTION</option>
            <option value="ITEM_HANDED_OVER">ITEM_HANDED_OVER</option>
            <option value="CLAIM_CREATED">CLAIM_CREATED</option>
            <option value="CLAIM_APPROVED">CLAIM_APPROVED</option>
            <option value="CLAIM_REJECTED">CLAIM_REJECTED</option>
            <option value="TOKEN_REDEEMED">TOKEN_REDEEMED</option>
            <option value="MATCH_CONFIRMED">MATCH_CONFIRMED</option>
            <option value="STORAGE_LOCATION_UPDATED">STORAGE_LOCATION_UPDATED</option>
          </select>

          {/* Target Type Filter */}
          <select
            value={selectedTargetType}
            onChange={(e) => {
              setSelectedTargetType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
          >
            <option value="">All Target Types</option>
            <option value="ITEM">ITEM</option>
            <option value="CLAIM">CLAIM</option>
            <option value="MATCH">MATCH</option>
            <option value="USER">USER</option>
            <option value="STORAGE_LOCATION">STORAGE_LOCATION</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200/80 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No audit events match current criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const isExpanded = expandedLogId === entry.id;
                  const hasDiff = entry.before || entry.after;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isExpanded ? 'bg-brand-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {hasDiff ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(entry.id)}
                              className="text-slate-400 hover:text-slate-600 focus:outline-none"
                              title="Toggle Details"
                              aria-label="Toggle change details"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-brand-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 inline-block" />
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {new Date(entry.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {entry.actor ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">
                                  {entry.actor.name}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {entry.actor.email}
                                </span>
                              </div>
                              <RoleBadge role={entry.actor.role} />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">SYSTEM AUTOMATION</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border ${getActionBadgeColor(
                              entry.action,
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 uppercase font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                              {entry.targetType}
                            </span>
                            <span
                              className="font-mono text-slate-800 truncate max-w-[140px] font-medium"
                              title={entry.targetId}
                            >
                              {entry.targetId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {hasDiff && (
                            <button
                              onClick={() => setInspectEntry(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              Payload
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline Expanded Diff Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                <span className="text-slate-500 font-sans font-bold block mb-1 text-[10px] uppercase">
                                  Before Snapshot:
                                </span>
                                <pre className="text-slate-700 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
                                  {entry.before
                                    ? JSON.stringify(entry.before, null, 2)
                                    : 'null (Initial Creation)'}
                                </pre>
                              </div>
                              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                <span className="text-slate-500 font-sans font-bold block mb-1 text-[10px] uppercase">
                                  After Snapshot:
                                </span>
                                <pre className="text-slate-700 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
                                  {entry.after ? JSON.stringify(entry.after, null, 2) : 'null (Deleted)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> logged events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle"
            >
              Previous
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectEntry && (
        <Modal
          isOpen={true}
          onClose={() => setInspectEntry(null)}
          title={`Audit Payload: ${inspectEntry.action}`}
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <strong className="text-slate-700">Record ID:</strong>{' '}
                <span className="font-mono">{inspectEntry.id}</span>
              </p>
              <p>
                <strong className="text-slate-700">Target:</strong> {inspectEntry.targetType} #{' '}
                <span className="font-mono">{inspectEntry.targetId}</span>
              </p>
              <p>
                <strong className="text-slate-700">Actor:</strong>{' '}
                {inspectEntry.actor?.name || 'SYSTEM'} ({inspectEntry.actor?.email || 'N/A'})
              </p>
              <p>
                <strong className="text-slate-700">Logged At:</strong>{' '}
                {new Date(inspectEntry.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Complete Event State Record:
              </span>
              <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80">
                <pre>{JSON.stringify(inspectEntry, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectEntry(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </FadeIn>
  );
};
