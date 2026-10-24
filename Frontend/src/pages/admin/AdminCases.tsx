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
  Shield,
  Layers,
  Sparkles,
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
import { celebrateConfetti } from '../../lib/confetti';

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
      celebrateConfetti();
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
      celebrateConfetti();
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
      success(`Status updated for Case ${advanceTarget.caseId}`);
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

  return (
    <PageTransition className="space-y-8 max-w-7xl mx-auto text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              CASE ADMINISTRATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              DESK OPERATIONS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Campus Cases Desk
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Review, advance lifecycle state, and execute physical handovers for all reported items across campus.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case ID, title, serial..."
              className="w-full pl-10 pr-3 py-2 text-xs border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-mono"
            />
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as ItemType | '')}
            className="py-2 px-3 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white font-mono focus:outline-none focus:border-white/40"
          >
            <option value="">All Types</option>
            <option value={ItemType.LOST}>Lost Items</option>
            <option value={ItemType.FOUND}>Found Items</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
            className="py-2 px-3 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white font-mono focus:outline-none focus:border-white/40"
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
            className="py-2 px-3 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white font-mono focus:outline-none focus:border-white/40"
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
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 border-b border-white/[0.06] text-neutral-400 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5">Case ID</th>
                <th className="px-6 py-3.5">Item &amp; Specs</th>
                <th className="px-6 py-3.5">Type &amp; Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Storage Location</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-neutral-300">
              {isLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 italic font-mono">
                    No cases match the specified filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.caseId} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 font-mono font-semibold text-white">
                      <Link to={`/items/${item.caseId}`} className="text-white hover:text-neutral-300 transition-colors flex items-center">
                        #{item.caseId}
                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{item.itemName}</div>
                      <div className="text-[11px] text-neutral-400 truncate font-mono">
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
                    <td className="px-6 py-4 text-neutral-300 font-mono">
                      {item.storageLocation?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status === ItemStatus.FOUND && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkReady(item.caseId)}
                            className="px-2.5 py-1 text-[11px] h-auto font-medium"
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
                            className="px-2.5 py-1 text-[11px] h-auto font-medium"
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
                          className="px-2 py-1 text-[11px] h-auto font-medium"
                        >
                          Status
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArchiveTargetCaseId(item.caseId)}
                          className="px-2 py-1 text-[11px] h-auto font-medium text-neutral-500 hover:text-rose-400"
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
          <div className="p-3 bg-neutral-900 rounded-xl border border-white/[0.06] text-xs text-neutral-300 leading-relaxed font-mono">
            Record that the claimant visited the security desk, proved ownership, and physically received this item.
          </div>

          <div className="pt-2">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
                className="mt-0.5 rounded text-white focus:ring-0 bg-neutral-800 border-white/20"
              />
              <span className="text-xs text-neutral-300 leading-normal">
                <strong className="text-white">Staff Emergency Override:</strong> Mark item immediately RETURNED even if user has not yet completed phone token confirmation.
              </span>
            </label>
          </div>

          {override && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Override Justification / Officer Remarks <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State the reason (e.g. claimant phone battery dead, verified physically in-person)..."
                className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 font-mono focus:outline-none focus:ring-1 focus:ring-white"
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
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Select Target Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ItemStatus)}
              className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-neutral-900 text-white font-mono focus:outline-none focus:ring-1 focus:ring-white"
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
