import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  FileCode,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuditLogEntry, AuditLogResponse } from '../../types/admin';
import { RoleBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
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
    if (act.includes('APPROVE') || act.includes('HANDOVER') || act.includes('RETURN') || act.includes('REDEEM'))
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (act.includes('READY') || act.includes('HOLD') || act.includes('STATUS'))
      return 'bg-amber-100 text-amber-800 border-amber-200';
    if (act.includes('MATCH') || act.includes('CREATE'))
      return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Audit &amp; Chain-of-Custody Log
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Append-only, immutable activity log recording all status transitions, verification rulings, handovers, and staff actions.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Target ID Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Target ID / Case ID..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans"
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
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans"
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No audit log entries matching criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const isExpanded = expandedLogId === entry.id;
                  const hasDiff = entry.before || entry.after;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`hover:bg-gray-50/75 transition-colors ${isExpanded ? 'bg-primary-50/20' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          {hasDiff ? (
                            <button
                              onClick={() => toggleExpand(entry.id)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                              title="Toggle Details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-primary-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 inline-block" />
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                          {new Date(entry.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {entry.actor ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-medium text-gray-900 block text-xs">
                                  {entry.actor.name}
                                </span>
                                <span className="text-[11px] text-gray-500 font-mono">
                                  {entry.actor.email}
                                </span>
                              </div>
                              <RoleBadge role={entry.actor.role} />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">SYSTEM AUTOMATION</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-mono font-medium rounded border ${getActionBadgeColor(
                              entry.action
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500 uppercase font-semibold text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                              {entry.targetType}
                            </span>
                            <span className="font-mono text-gray-800 truncate max-w-[140px]" title={entry.targetId}>
                              {entry.targetId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasDiff && (
                            <button
                              onClick={() => setInspectEntry(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200 transition-colors"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              Inspect Payload
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline Expanded Diff Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <span className="text-gray-500 font-sans font-semibold block mb-1">
                                  Before Snapshot:
                                </span>
                                <pre className="text-gray-700 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
                                  {entry.before ? JSON.stringify(entry.before, null, 2) : 'null (Initial Creation)'}
                                </pre>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <span className="text-gray-500 font-sans font-semibold block mb-1">
                                  After Snapshot:
                                </span>
                                <pre className="text-gray-700 overflow-x-auto max-h-48 text-[11px] whitespace-pre-wrap">
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
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div>
            Showing <span className="font-semibold">{logs.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> logged events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong className="text-gray-700">Record ID:</strong>{' '}
                <span className="font-mono">{inspectEntry.id}</span>
              </p>
              <p>
                <strong className="text-gray-700">Target:</strong> {inspectEntry.targetType} #{' '}
                <span className="font-mono">{inspectEntry.targetId}</span>
              </p>
              <p>
                <strong className="text-gray-700">Actor:</strong>{' '}
                {inspectEntry.actor?.name || 'SYSTEM'} ({inspectEntry.actor?.email || 'N/A'})
              </p>
              <p>
                <strong className="text-gray-700">Logged At:</strong>{' '}
                {new Date(inspectEntry.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">Complete Event State Record:</span>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-80">
                <pre>{JSON.stringify(inspectEntry, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectEntry(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
