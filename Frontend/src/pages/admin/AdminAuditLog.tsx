import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  RefreshCw,
  FileCode,
  ChevronDown,
  ChevronRight,
  Terminal,
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
    if (act.includes('OVERRIDE')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (act.includes('REJECT') || act.includes('CANCEL') || act.includes('DISMISS'))
      return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (
      act.includes('APPROVE') ||
      act.includes('HANDOVER') ||
      act.includes('RETURN') ||
      act.includes('REDEEM')
    )
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    if (act.includes('READY') || act.includes('HOLD') || act.includes('STATUS'))
      return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (act.includes('MATCH') || act.includes('CREATE'))
      return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    return 'bg-white/[0.04] text-neutral-300 border-white/[0.08]';
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <FadeIn className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06] flex items-center">
              <History className="w-3 h-3 mr-1 text-neutral-400" />
              Security Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
            Audit & Chain-of-Custody Log
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl">
            Append-only, immutable security event log recording all custody transitions, verifications, handovers, and staff actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={isLoading}
          className="self-start sm:self-auto text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Log
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#12151D] p-4 rounded-2xl border border-white/[0.08] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Target ID Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Target ID / Case ID..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 font-mono"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white font-mono"
          >
            <option value="" className="bg-[#12151D]">All Actions</option>
            <option value="ITEM_CREATED" className="bg-[#12151D]">ITEM_CREATED</option>
            <option value="ITEM_STATUS_UPDATED" className="bg-[#12151D]">ITEM_STATUS_UPDATED</option>
            <option value="ITEM_READY_FOR_COLLECTION" className="bg-[#12151D]">ITEM_READY_FOR_COLLECTION</option>
            <option value="ITEM_HANDED_OVER" className="bg-[#12151D]">ITEM_HANDED_OVER</option>
            <option value="CLAIM_CREATED" className="bg-[#12151D]">CLAIM_CREATED</option>
            <option value="CLAIM_APPROVED" className="bg-[#12151D]">CLAIM_APPROVED</option>
            <option value="CLAIM_REJECTED" className="bg-[#12151D]">CLAIM_REJECTED</option>
            <option value="TOKEN_REDEEMED" className="bg-[#12151D]">TOKEN_REDEEMED</option>
            <option value="MATCH_CONFIRMED" className="bg-[#12151D]">MATCH_CONFIRMED</option>
            <option value="STORAGE_LOCATION_UPDATED" className="bg-[#12151D]">STORAGE_LOCATION_UPDATED</option>
          </select>

          {/* Target Type Filter */}
          <select
            value={selectedTargetType}
            onChange={(e) => {
              setSelectedTargetType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white font-mono"
          >
            <option value="" className="bg-[#12151D]">All Target Types</option>
            <option value="ITEM" className="bg-[#12151D]">ITEM</option>
            <option value="CLAIM" className="bg-[#12151D]">CLAIM</option>
            <option value="MATCH" className="bg-[#12151D]">MATCH</option>
            <option value="USER" className="bg-[#12151D]">USER</option>
            <option value="STORAGE_LOCATION" className="bg-[#12151D]">STORAGE_LOCATION</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/[0.01] text-[11px] uppercase font-medium text-neutral-400 border-b border-white/[0.06] tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
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
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isExpanded ? 'bg-white/[0.03]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {hasDiff ? (
                            <button
                              onClick={() => toggleExpand(entry.id)}
                              className="text-neutral-400 hover:text-white focus:outline-none transition-colors"
                              title="Toggle Details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-white" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 inline-block" />
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-neutral-400 font-mono">
                          {new Date(entry.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {entry.actor ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-medium text-white block text-xs">
                                  {entry.actor.name}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                  {entry.actor.email}
                                </span>
                              </div>
                              <RoleBadge role={entry.actor.role} />
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 font-mono flex items-center">
                              <Terminal className="w-3 h-3 mr-1 text-neutral-500" />
                              SYSTEM
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full border ${getActionBadgeColor(
                              entry.action,
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-neutral-400 uppercase font-medium text-[10px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded font-mono">
                              {entry.targetType}
                            </span>
                            <span
                              className="font-mono text-neutral-300 truncate max-w-[140px]"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-colors"
                            >
                              <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline Expanded Diff Row */}
                      {isExpanded && (
                        <tr className="bg-black/30">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06]">
                                <span className="text-neutral-400 font-medium block mb-1 text-[11px] uppercase">
                                  Before State:
                                </span>
                                <pre className="text-rose-300/90 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
                                  {entry.before
                                    ? JSON.stringify(entry.before, null, 2)
                                    : 'null (Initial Creation)'}
                                </pre>
                              </div>
                              <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06]">
                                <span className="text-neutral-400 font-medium block mb-1 text-[11px] uppercase">
                                  After State:
                                </span>
                                <pre className="text-emerald-300/90 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
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
        <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 font-mono">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{' '}
            <span className="font-semibold text-white">{totalCount}</span> events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 bg-[#12151D] border border-white/[0.08] rounded-lg font-medium text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-2 text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 bg-[#12151D] border border-white/[0.08] rounded-lg font-medium text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            <div className="text-xs text-neutral-300 space-y-1 font-mono bg-black/30 p-3.5 rounded-xl border border-white/[0.08]">
              <p>
                <strong className="text-white">Record ID:</strong>{' '}
                <span className="text-neutral-300">{inspectEntry.id}</span>
              </p>
              <p>
                <strong className="text-white">Target:</strong> {inspectEntry.targetType} #{' '}
                <span className="text-neutral-300">{inspectEntry.targetId}</span>
              </p>
              <p>
                <strong className="text-white">Actor:</strong>{' '}
                {inspectEntry.actor?.name || 'SYSTEM'} ({inspectEntry.actor?.email || 'N/A'})
              </p>
              <p>
                <strong className="text-white">Logged At:</strong>{' '}
                {new Date(inspectEntry.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400 block font-mono">
                Complete Event Snapshot:
              </span>
              <div className="bg-black/50 text-neutral-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 border border-white/[0.08]">
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
