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
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                PERSONAL REPORTS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-neutral-400">
                ACTIVE CASES
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
              My Reported Cases
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Track the live recovery status of items you have reported lost or deposited at campus security.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <Link to="/report">
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Report Item
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Segmented Filter Tabs */}
      <div className="inline-flex rounded-xl border border-white/[0.08] p-1 bg-neutral-900 text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'ALL'
              ? 'bg-white/10 text-white font-semibold shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Cases ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'LOST'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Lost Reports ({items.filter((i) => i.type === ItemType.LOST).length})
        </button>
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'FOUND'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Found Reports ({items.filter((i) => i.type === ItemType.FOUND).length})
        </button>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      {isLoading ? (
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 space-y-4">
          <TableRowSkeleton columns={6} />
          <TableRowSkeleton columns={6} />
          <TableRowSkeleton columns={6} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/[0.08] text-neutral-400 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            No incident reports registered
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            You currently have zero active reports logged in this filter bracket.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/report">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Report Lost or Found Item
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#12151D] rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-neutral-900 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-5">Case ID & Item</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Report Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.caseId}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 flex items-center justify-center border border-white/10">
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={resolveImageUrl(item.images[0])}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderOpen className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {item.itemName}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              #{item.caseId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <ItemTypeBadge type={item.type} />
                      </td>
                      <td className="py-4 px-4">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="py-4 px-4">
                        <ItemStatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-neutral-400 font-mono text-[11px]">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {item.status === ItemStatus.LOST_REPORTED && (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                title="Edit Specifications"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCancelTargetCaseId(item.caseId)}
                                className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                                title="Cancel Case"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <Link
                            to={`/items/${item.caseId}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
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
                className="p-5 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ItemTypeBadge type={item.type} />
                    <span className="text-[10px] text-neutral-500 font-mono">#{item.caseId}</span>
                  </div>
                  <ItemStatusBadge status={item.status} size="sm" />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{item.itemName}</h4>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                  <Link
                    to={`/items/${item.caseId}`}
                    className="text-xs font-semibold text-white flex items-center"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Specifications Modal */}
      <Modal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title="Edit Case Specifications"
        description="Update your item description and last known coordinates."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Campus Zone / Location
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Case Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTargetCaseId)}
        onClose={() => setCancelTargetCaseId(null)}
        onConfirm={handleCancelCase}
        title="Cancel This Case Report?"
        message="Are you sure you want to cancel this report? This will discontinue radar scanning and close the case."
        confirmLabel="Yes, Cancel Report"
        isDestructive={true}
        isLoading={isCanceling}
      />
    </div>
  );
};
