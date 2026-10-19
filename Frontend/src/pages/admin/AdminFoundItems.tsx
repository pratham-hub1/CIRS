import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Archive,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Item } from '../../types/item';
import { StorageLocation } from '../../types/admin';
import { ItemCategory, ItemStatus, ItemType, STORAGE_LOCATION_LABELS } from '../../types/enums';
import { ItemStatusBadge, CategoryBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { resolveImageUrl } from '../../services/apiClient';

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/40">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Found Items & Storage
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Operational vault queue, holding statuses, and handover coordination.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/storage">
              <Button variant="secondary" size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Manage Vaults
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Found</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.total}
            </div>
            <p className="text-xs text-slate-500 mt-1">Logged in system</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">In Storage Vault</span>
              <Building2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.inVault}
            </div>
            <p className="text-xs text-slate-500 mt-1">Safely secured</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Ready for Collection</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.ready}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting claimant</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Handed Over</span>
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.returned}
            </div>
            <p className="text-xs text-slate-500 mt-1">Returned to owners</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search case ID, item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Storage Vault Filter */}
            <div className="relative">
              <select
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
                aria-label="Filter by storage vault"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Storage Vaults</option>
                {storageLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Holding Statuses</option>
                <option value={ItemStatus.FOUND}>FOUND (Secured)</option>
                <option value={ItemStatus.READY_FOR_COLLECTION}>READY FOR COLLECTION</option>
                <option value={ItemStatus.RETURNED}>RETURNED</option>
                <option value={ItemStatus.UNCLAIMED}>UNCLAIMED</option>
                <option value={ItemStatus.ARCHIVED}>ARCHIVED</option>
              </select>
            </div>

            {/* Date filter */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Filter by date received"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Found Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Item & Case ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Storage Vault</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4">Holding Status</th>
                  <th className="py-3 px-4 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRowSkeleton key={idx} columns={6} />
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No found items found matching the current criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const vault = storageLocations.find((l) => l.id === item.storageLocationId);
                    const vaultName = vault
                      ? STORAGE_LOCATION_LABELS[vault.name as keyof typeof STORAGE_LOCATION_LABELS] || vault.name
                      : item.storageLocation?.name
                        ? STORAGE_LOCATION_LABELS[item.storageLocation.name as keyof typeof STORAGE_LOCATION_LABELS] || item.storageLocation.name
                        : 'Unassigned Vault';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              {item.images && item.images.length > 0 ? (
                                <img
                                  src={resolveImageUrl(item.images[0])}
                                  alt={item.itemName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.itemName}
                              </div>
                              <span className="font-mono text-xs text-primary-600 dark:text-primary-400 font-semibold">
                                {item.caseId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <CategoryBadge category={item.category} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{vaultName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {item.dateFound ? new Date(item.dateFound).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <ItemStatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect case */}
                            <Link to={`/items/${item.caseId}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Inspect Case"
                                className="h-8 px-2"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                Inspect
                              </Button>
                            </Link>

                            {/* Mark Ready */}
                            {item.status === ItemStatus.FOUND && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleMarkReady(item.caseId)}
                                title="Mark Ready for Collection"
                                className="h-8 px-2.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800"
                              >
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                Mark Ready
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {handoverTarget.itemName}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Status:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {handoverTarget.status}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  Confirming this action marks the item as{' '}
                  <span className="font-semibold">RETURNED</span> in the system and completes the
                  case lifecycle.
                </div>
              </div>

              {/* Security Override */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={override}
                    onChange={(e) => setOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Supervisor / Security Override Handover
                  </span>
                </label>

                {override && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Override Reason (Mandatory for audit logs)
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g., Claimant identity confirmed manually with Dean of Student Affairs."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
