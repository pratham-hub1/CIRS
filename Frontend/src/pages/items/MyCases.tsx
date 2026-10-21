import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  ArrowRight,
  Calendar,
  MapPin,
  ChevronRight,
  ExternalLink,
  Edit3,
  XCircle,
  FileQuestion,
  Package,
} from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { Item, UpdateItemPayload } from '../../types/item';
import { ItemType, ItemStatus } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableRowSkeleton } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';
import { resolveImageUrl } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

export const MyCases: React.FC = () => {
  const { success, error } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  // Edit Modal State
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Cancel Confirmation State
  const [cancelTargetCaseId, setCancelTargetCaseId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchMyItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await itemsService.getMyItems();
      setItems(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch cases');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchMyItems();
  }, [fetchMyItems]);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'LOST') return item.type === ItemType.LOST;
    if (activeTab === 'FOUND') return item.type === ItemType.FOUND;
    return true;
  });

  const openEditModal = (item: Item) => {
    setEditItem(item);
    setEditDescription(item.description);
    setEditLocation(
      item.type === ItemType.LOST
        ? item.lastKnownLocation || ''
        : item.foundLocation || '',
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsSavingEdit(true);
    try {
      const payload: UpdateItemPayload = {
        description: editDescription.trim(),
        ...(editItem.type === ItemType.LOST
          ? { lastKnownLocation: editLocation.trim() || undefined }
          : { foundLocation: editLocation.trim() || undefined }),
      };

      await itemsService.editItem(editItem.caseId, payload);
      success(`Case ${editItem.caseId} updated successfully.`);
      setEditItem(null);
      fetchMyItems();
    } catch (err: any) {
      error(err.message || 'Failed to update case details');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelCase = async () => {
    if (!cancelTargetCaseId) return;

    setIsCanceling(true);
    try {
      await itemsService.cancelItem(cancelTargetCaseId);
      success(`Case ${cancelTargetCaseId} has been cancelled.`);
      setCancelTargetCaseId(null);
      fetchMyItems();
    } catch (err: any) {
      error(err.message || 'Failed to cancel case');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-0.5 rounded-full border border-brand-200/60 dark:border-brand-800">
                Case Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Active Cases
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-normal">
              Manage your personal lost and found incident reports and track real-time recovery
              progress with campus security.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <Link to="/report/lost">
              <Button variant="danger" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" /> Report Lost
              </Button>
            </Link>
            <Link to="/report/found">
              <Button variant="success" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" /> Report Found
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Segmented Filter Tabs */}
      <div className="inline-flex rounded-xl border border-slate-200/90 dark:border-slate-800 p-1 bg-slate-100/70 dark:bg-slate-800/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          aria-pressed={activeTab === 'ALL'}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All Cases ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LOST')}
          aria-pressed={activeTab === 'LOST'}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'LOST'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Lost Reports ({items.filter((i) => i.type === ItemType.LOST).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('FOUND')}
          aria-pressed={activeTab === 'FOUND'}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'FOUND'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Found Reports ({items.filter((i) => i.type === ItemType.FOUND).length})
        </button>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <TableRowSkeleton columns={6} />
          <TableRowSkeleton columns={6} />
          <TableRowSkeleton columns={6} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No reports in this category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
            You haven't filed any cases in this section yet. If you have misplaced or found an item on
            campus, report it below.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/report/lost">
              <Button variant="danger" size="sm">
                <FileQuestion className="w-4 h-4 mr-2" /> Report Lost Item
              </Button>
            </Link>
            <Link to="/report/found">
              <Button variant="success" size="sm">
                <Package className="w-4 h-4 mr-2" /> Report Found Item
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Case ID & Item</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date Reported</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.caseId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={resolveImageUrl(item.images[0])}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderOpen className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.itemName}
                            </div>
                            <span className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">
                              {item.caseId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ItemTypeBadge type={item.type} />
                      </td>
                      <td className="py-3.5 px-4">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="py-3.5 px-4">
                        <ItemStatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <Link to={`/items/${item.caseId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300"
                              title="Inspect Case"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                          </Link>

                          {/* Edit: Available while active */}
                          {item.status !== ItemStatus.RETURNED &&
                            item.status !== ItemStatus.ARCHIVED && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditModal(item)}
                                className="h-8 px-2.5 text-xs"
                                title="Edit Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                            )}

                          {/* Cancel: Available while active */}
                          {item.status !== ItemStatus.RETURNED &&
                            item.status !== ItemStatus.ARCHIVED && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setCancelTargetCaseId(item.caseId)}
                                className="h-8 px-2.5 text-xs"
                                title="Cancel Report"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Cancel
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredItems.map((item) => (
              <div
                key={item.caseId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={resolveImageUrl(item.images[0])}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderOpen className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.itemName}
                      </div>
                      <span className="font-mono text-xs text-primary-600 font-semibold">
                        {item.caseId}
                      </span>
                    </div>
                  </div>
                  <ItemStatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  <ItemTypeBadge type={item.type} />
                  <CategoryBadge category={item.category} />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                  </span>
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link to={`/items/${item.caseId}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  </Link>

                  {item.status !== ItemStatus.RETURNED && item.status !== ItemStatus.ARCHIVED && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="h-8 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelTargetCaseId(item.caseId)}
                        className="h-8 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Case Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit Case: ${editItem?.caseId}`}
      >
        {editItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Name
              </label>
              <input
                type="text"
                disabled
                value={editItem.itemName}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Primary item classification cannot be changed after submission.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description & Notes
              </label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {editItem.type === ItemType.LOST ? 'Last Known Location' : 'Found Location'}
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Library 2nd floor study area"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditItem(null)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingEdit}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTargetCaseId}
        onClose={() => setCancelTargetCaseId(null)}
        onConfirm={handleCancelCase}
        title="Cancel Incident Report"
        message={`Are you sure you want to cancel Case ${cancelTargetCaseId}? This will archive the report and cancel active automated matching against campus items.`}
        confirmLabel="Yes, Cancel Report"
        cancelLabel="Keep Active"
        isDestructive={true}
        isLoading={isCanceling}
      />
    </div>
  );
};
