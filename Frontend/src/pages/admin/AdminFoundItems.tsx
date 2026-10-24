import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  Building2,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Item } from '../../types/item';
import { StorageLocation } from '../../types/admin';
import { ItemStatus, ItemType, STORAGE_LOCATION_LABELS } from '../../types/enums';
import { ItemStatusBadge, CategoryBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { resolveImageUrl } from '../../services/apiClient';
import { celebrateConfetti } from '../../lib/confetti';

export const AdminFoundItems: React.FC = () => {
  const { success, error } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ItemStatus | ''>('');
  const [storageLocationId, setStorageLocationId] = useState('');
  const [startDate, setStartDate] = useState('');

  // Handover modal state
  const [handoverTarget, setHandoverTarget] = useState<Item | null>(null);
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isHandingOver, setIsHandingOver] = useState(false);

  const fetchFoundItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsRes, locationsRes] = await Promise.allSettled([
        adminService.getItems({
          type: ItemType.FOUND,
          search: search.trim() || undefined,
          status: status || undefined,
          storageLocationId: storageLocationId || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          limit: 100,
        }),
        adminService.getStorageLocations(),
      ]);

      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.items || []);
      } else {
        error(itemsRes.reason?.message || 'Failed to load found items');
      }

      if (locationsRes.status === 'fulfilled') {
        setStorageLocations(locationsRes.value || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load found items');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, storageLocationId, startDate, error]);

  useEffect(() => {
    fetchFoundItems();
  }, [fetchFoundItems]);

  const handleMarkReady = async (caseId: string) => {
    try {
      await adminService.markReadyForCollection(caseId);
      celebrateConfetti();
      success(`Case ${caseId} marked Ready for Collection`);
      fetchFoundItems();
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
      success(`Handover completed for Case ${handoverTarget.caseId}`);
      setHandoverTarget(null);
      setOverride(false);
      setOverrideReason('');
      fetchFoundItems();
    } catch (err: any) {
      error(err.message || 'Failed to record handover');
    } finally {
      setIsHandingOver(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = items.length;
    const inVault = items.filter((i) => i.status === ItemStatus.FOUND).length;
    const ready = items.filter((i) => i.status === ItemStatus.READY_FOR_COLLECTION).length;
    const returned = items.filter((i) => i.status === ItemStatus.RETURNED).length;
    return { total, inVault, ready, returned };
  }, [items]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
                Vault Custody
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
              Found Items & Custody
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage custody inventory, physical holding lockers, and verified handovers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/storage">
              <Button variant="secondary" size="sm">
                <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
                Manage Lockers
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Found</span>
              <Package className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-white">
              {metrics.total}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Logged in registry</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">In Custody</span>
              <Building2 className="w-4 h-4 text-amber-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-amber-400">
              {metrics.inVault}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Secured in facility</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Ready for Collection</span>
              <Clock className="w-4 h-4 text-blue-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-blue-400">
              {metrics.ready}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Pass issued to claimant</p>
          </div>

          <div className="bg-[#12151D] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Handed Over</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-semibold text-emerald-400">
              {metrics.returned}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Restored to rightful owners</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#12151D] p-4 rounded-2xl border border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search case ID, item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>

            {/* Storage Vault Filter */}
            <div className="relative">
              <select
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
                aria-label="Filter by storage vault"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="" className="bg-[#12151D]">All Storage Locations</option>
                {storageLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#12151D]">
                    {STORAGE_LOCATION_LABELS[loc.name] || loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus | '')}
                aria-label="Filter by holding status"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="" className="bg-[#12151D]">All Holding Statuses</option>
                <option value={ItemStatus.FOUND} className="bg-[#12151D]">FOUND (In Custody)</option>
                <option value={ItemStatus.READY_FOR_COLLECTION} className="bg-[#12151D]">READY FOR COLLECTION</option>
                <option value={ItemStatus.RETURNED} className="bg-[#12151D]">RETURNED</option>
                <option value={ItemStatus.UNCLAIMED} className="bg-[#12151D]">UNCLAIMED</option>
                <option value={ItemStatus.ARCHIVED} className="bg-[#12151D]">ARCHIVED</option>
              </select>
            </div>

            {/* Date filter */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Filter by date received"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>
        </div>

        {/* Found Items Table */}
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Item & Case ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Locker / Vault</th>
                  <th className="py-3 px-4">Date Logged</th>
                  <th className="py-3 px-4">Holding Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRowSkeleton key={idx} columns={6} />
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
                      No found articles match the selected filters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const vault = storageLocations.find((l) => l.id === item.storageLocationId);
                    const vaultName = vault
                      ? STORAGE_LOCATION_LABELS[vault.name as keyof typeof STORAGE_LOCATION_LABELS] || vault.name
                      : item.storageLocation?.name
                        ? STORAGE_LOCATION_LABELS[item.storageLocation.name as keyof typeof STORAGE_LOCATION_LABELS] || item.storageLocation.name
                        : 'Unassigned';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 flex items-center justify-center border border-white/[0.08]">
                              {item.images && item.images.length > 0 ? (
                                <img
                                  src={resolveImageUrl(item.images[0])}
                                  alt={item.itemName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-neutral-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {item.itemName}
                              </div>
                              <span className="font-mono text-xs text-neutral-400">
                                {item.caseId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <CategoryBadge category={item.category} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            <span>{vaultName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-400 font-mono">
                          {item.dateFound ? new Date(item.dateFound).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <ItemStatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect case */}
                            <Link to={`/items/${item.caseId}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Inspect Case"
                                className="h-8 px-2 text-neutral-300 hover:text-white"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                            </Link>

                            {/* Mark Ready */}
                            {item.status === ItemStatus.FOUND && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleMarkReady(item.caseId)}
                                title="Mark Ready for Collection"
                                className="h-8 px-2.5 text-xs text-emerald-300 hover:text-emerald-200"
                              >
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                Ready
                              </Button>
                            )}

                            {/* Handover */}
                            {item.status !== ItemStatus.RETURNED &&
                              item.status !== ItemStatus.ARCHIVED && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setHandoverTarget(item)}
                                  title="Perform Handover"
                                  className="h-8 px-2.5 text-xs"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                  Handover
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Handover Modal */}
        <Modal
          isOpen={!!handoverTarget}
          onClose={() => {
            setHandoverTarget(null);
            setOverride(false);
            setOverrideReason('');
          }}
          title={`Staff Handover: ${handoverTarget?.caseId}`}
        >
          {handoverTarget && (
            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.08] text-sm">
                <div className="font-medium text-white">
                  {handoverTarget.itemName}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Status:{' '}
                  <span className="font-medium text-neutral-200">
                    {handoverTarget.status}
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                <div>
                  Confirming this action marks the item as{' '}
                  <span className="font-semibold text-white">RETURNED</span> in the system and completes the
                  case lifecycle.
                </div>
              </div>

              {/* Security Override */}
              <div className="pt-2 border-t border-white/[0.08]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={override}
                    onChange={(e) => setOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-white bg-black/40 border-white/[0.12] focus:ring-0"
                  />
                  <span className="text-xs font-medium text-neutral-300">
                    Supervisor / Security Manual Override Handover
                  </span>
                </label>

                {override && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Override Reason (Mandatory for audit logs)
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Claimant identity confirmed manually with departmental head."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setHandoverTarget(null);
                    setOverride(false);
                    setOverrideReason('');
                  }}
                  disabled={isHandingOver}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isHandingOver}>
                  Confirm Handover
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
};
