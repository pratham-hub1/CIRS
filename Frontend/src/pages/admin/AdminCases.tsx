import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tag,
  KeyRound,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Item } from '../../types/item';
import { StorageLocation } from '../../types/admin';
import { ItemCategory, ItemStatus, ItemType, CATEGORY_LABELS, STATUS_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const AdminCases: React.FC = () => {
  const { success, error } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [status, setStatus] = useState<ItemStatus | ''>('');
  const [type, setType] = useState<ItemType | ''>('');
  const [storageLocationId, setStorageLocationId] = useState('');

  // Handover modal state
  const [handoverTarget, setHandoverTarget] = useState<Item | null>(null);
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isHandingOver, setIsHandingOver] = useState(false);

  // Status advance modal state
  const [advanceTarget, setAdvanceTarget] = useState<Item | null>(null);
  const [newStatus, setNewStatus] = useState<ItemStatus>(ItemStatus.FOUND);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Archive & Unclaimed dialog states
  const [archiveTargetCaseId, setArchiveTargetCaseId] = useState<string | null>(null);
  const [unclaimedTargetCaseId, setUnclaimedTargetCaseId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsRes, locationsRes] = await Promise.allSettled([
        adminService.getItems({
          search: search.trim() || undefined,
          category: category || undefined,
          status: status || undefined,
          type: type || undefined,
          storageLocationId: storageLocationId || undefined,
        }),
        adminService.getStorageLocations(),
      ]);
      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.items || []);
      } else {
        error(itemsRes.reason?.message || 'Failed to load cases');
      }
      if (locationsRes.status === 'fulfilled') {
        setStorageLocations(locationsRes.value || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, type, storageLocationId, error]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleMarkReady = async (caseId: string) => {
    try {
      await adminService.markReadyForCollection(caseId);
      success(`Case ${caseId} marked Ready for Collection`);
      fetchCases();
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverTarget) return;

    setIsHandingOver(true);
    try {
      await adminService.staffHandover(handoverTarget.caseId, {
        override,
        overrideReason: override ? overrideReason.trim() : undefined,
      });
      success(`Handover recorded for Case ${handoverTarget.caseId}`);
      setHandoverTarget(null);
      setOverride(false);
      setOverrideReason('');
      fetchCases();
    } catch (err: any) {
      error(err.message || 'Failed to record handover');
    } finally {
      setIsHandingOver(false);
    }
  };

  const handleAdvanceStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceTarget) return;

    setIsAdvancing(true);
    try {
      await adminService.advanceItemStatus(advanceTarget.caseId, newStatus);
      success(`Case ${advanceTarget.caseId} advanced to ${STATUS_LABELS[newStatus]}`);
      setAdvanceTarget(null);
      fetchCases();
    } catch (err: any) {
      error(err.message || 'Failed to advance status');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTargetCaseId) return;
    setIsProcessingAction(true);
    try {
      await adminService.archiveItem(archiveTargetCaseId);
      success(`Case ${archiveTargetCaseId} archived`);
      setArchiveTargetCaseId(null);
      fetchCases();
    } catch (err: any) {
      error(err.message || 'Failed to archive case');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleMarkUnclaimed = async () => {
    if (!unclaimedTargetCaseId) return;
    setIsProcessingAction(true);
    try {
      await adminService.markUnclaimed(unclaimedTargetCaseId);
      success(`Case ${unclaimedTargetCaseId} marked Unclaimed`);
      setUnclaimedTargetCaseId(null);
      fetchCases();
    } catch (err: any) {
      error(err.message || 'Failed to update case');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Case Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, advance lifecycle state, and execute physical handovers for all reported items across campus.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case ID, title, serial..."
              className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as ItemType | '')}
            className="py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Types</option>
            <option value={ItemType.LOST}>Lost Items</option>
            <option value={ItemType.FOUND}>Found Items</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
            className="py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Categories</option>
            {Object.values(ItemCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemStatus | '')}
            className="py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            {Object.values(ItemStatus).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5">Case ID</th>
                <th className="px-6 py-3.5">Item & Specs</th>
                <th className="px-6 py-3.5">Type & Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Storage Location</th>
                <th className="px-6 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No cases match the specified filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.caseId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      <Link to={`/items/${item.caseId}`} className="hover:text-brand-600 hover:underline">
                        {item.caseId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{item.itemName}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.brand} • {item.colour}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <ItemTypeBadge type={item.type} />
                        <div>
                          <CategoryBadge category={item.category} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ItemStatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.storageLocation?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status === ItemStatus.FOUND && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkReady(item.caseId)}
                            className="px-2.5 py-1 text-[11px] h-auto font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-200"
                            title="Mark Ready for Collection"
                          >
                            Mark Ready
                          </Button>
                        )}

                        {item.status === ItemStatus.READY_FOR_COLLECTION && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => setHandoverTarget(item)}
                            className="px-2.5 py-1 text-[11px] h-auto font-semibold"
                            title="Record Staff Handover"
                          >
                            Handover
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdvanceTarget(item);
                            setNewStatus(item.status);
                          }}
                          className="px-2 py-1 text-[11px] h-auto font-medium text-slate-700"
                        >
                          Status
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArchiveTargetCaseId(item.caseId)}
                          className="px-2 py-1 text-[11px] h-auto font-medium text-slate-500 hover:text-rose-600"
                          title="Archive Case"
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handover Modal */}
      <Modal
        isOpen={!!handoverTarget}
        onClose={() => setHandoverTarget(null)}
        title="Record Staff Handover"
        description={`Record physical item handover for Case ${handoverTarget?.caseId}`}
      >
        <form onSubmit={handleHandoverSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            Record that the claimant visited the security desk, proved ownership, and physically received this item.
          </div>

          <div className="pt-2">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-700 leading-normal">
                <strong>Staff Emergency Override:</strong> Mark item immediately RETURNED even if user has not yet completed phone token confirmation.
              </span>
            </label>
          </div>

          {override && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Override Justification / Officer Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State the reason (e.g. claimant phone battery dead, verified physically in-person)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setHandoverTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              isLoading={isHandingOver}
            >
              Confirm Handover
            </Button>
          </div>
        </form>
      </Modal>

      {/* Advance Status Modal */}
      <Modal
        isOpen={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        title="Advance Case State"
        description={`Manually transition Case ${advanceTarget?.caseId} along the state machine`}
      >
        <form onSubmit={handleAdvanceStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Target Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ItemStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {Object.values(ItemStatus).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdvanceTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAdvancing}
            >
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTargetCaseId}
        onClose={() => setArchiveTargetCaseId(null)}
        onConfirm={handleArchive}
        title="Archive Case?"
        message="Are you sure you want to archive this case? It will be removed from active search listings."
        confirmLabel="Archive Case"
        isDestructive={false}
        isLoading={isProcessingAction}
      />
    </PageTransition>
  );
};
