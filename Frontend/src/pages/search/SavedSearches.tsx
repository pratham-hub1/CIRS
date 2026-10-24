import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Plus, Trash2, ArrowRight, Search, Tag, Radio } from 'lucide-react';
import { searchService } from '../../services/searchService';
import { SavedSearch } from '../../types/savedSearch';
import { ItemCategory, ItemType, CATEGORY_LABELS } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { celebrateConfetti } from '../../lib/confetti';

export const SavedSearches: React.FC = () => {
  const { success, error } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [type, setType] = useState<ItemType | ''>('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSearches = async () => {
    setIsLoading(true);
    try {
      const data = await searchService.getSavedSearches();
      setSearches(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await searchService.createSavedSearch({
        name: name.trim(),
        criteria: {
          q: query.trim() || undefined,
          category: category || undefined,
          type: type || undefined,
        },
      });
      celebrateConfetti();
      success(`Watch '${name}' activated successfully`);
      setShowCreateModal(false);
      setName('');
      setQuery('');
      setCategory('');
      setType('');
      fetchSearches();
    } catch (err: any) {
      error(err.message || 'Failed to create watch');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await searchService.deleteSavedSearch(deleteTargetId);
      success('Search watch removed');
      setDeleteTargetId(null);
      fetchSearches();
    } catch (err: any) {
      error(err.message || 'Failed to delete watch');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06] flex items-center">
              <Radio className="w-3 h-3 mr-1 text-neutral-400" />
              Automated Monitors
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
            Saved Searches & Watches
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Automated watches monitor new community reports and alert you immediately upon matches.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="sm"
          className="self-start sm:self-auto inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Watch
        </Button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs font-mono text-neutral-500">
          Querying active radar watches...
        </div>
      ) : searches.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No search watches active"
          description="Create a watch to monitor for specific items (e.g. 'Casio Calculator' or 'Black Wallet'). You will receive immediate in-app notifications whenever a matching item is posted."
          actionLabel="Create First Watch"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searches.map((s) => (
            <StaggerItem
              key={s.id}
              className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Active Watch
                  </span>
                  <button
                    onClick={() => setDeleteTargetId(s.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete watch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-white text-base">{s.name}</h3>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] text-xs space-y-1.5 text-neutral-300 font-mono">
                  {s.criteria.q && (
                    <div className="flex items-center">
                      <Search className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                      <span>
                        Keyword: <strong className="text-white">"{s.criteria.q}"</strong>
                      </span>
                    </div>
                  )}
                  {s.criteria.category && (
                    <div className="flex items-center">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                      <span>
                        Category: <strong className="text-white">{CATEGORY_LABELS[s.criteria.category]}</strong>
                      </span>
                    </div>
                  )}
                  {s.criteria.type && (
                    <div>
                      Type: <strong className="text-white">{s.criteria.type}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono">
                <span className="text-xs text-neutral-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to={`/feed?${s.criteria.q ? `q=${encodeURIComponent(s.criteria.q)}&` : ''}${
                    s.criteria.category ? `category=${s.criteria.category}&` : ''
                  }${s.criteria.type ? `type=${s.criteria.type}` : ''}`}
                  className="inline-flex items-center text-xs font-medium text-white hover:text-neutral-300 transition-colors"
                >
                  View Feed Query <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Search Watch"
        description="Set alert criteria for newly posted reports across campus."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Watch Label
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Missing Wallet or Scientific Calculator"
              className="w-full px-3 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 bg-black/40 text-white placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Search Keywords (Optional)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. WildHorn, Casio, Silver, Blue"
              className="w-full px-3 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 bg-black/40 text-white placeholder-neutral-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
                className="w-full px-3 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 bg-black/40 text-white"
              >
                <option value="" className="bg-[#12151D]">Any Category</option>
                {Object.values(ItemCategory).map((c) => (
                  <option key={c} value={c} className="bg-[#12151D]">
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Report Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType | '')}
                className="w-full px-3 py-2 text-sm border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 bg-black/40 text-white"
              >
                <option value="" className="bg-[#12151D]">Lost or Found</option>
                <option value={ItemType.LOST} className="bg-[#12151D]">Lost Reports</option>
                <option value={ItemType.FOUND} className="bg-[#12151D]">Found Reports</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
            >
              Activate Watch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Remove Search Watch?"
        message="Are you sure you want to delete this search watch? You will no longer receive alerts for matching reports."
        confirmLabel="Delete Watch"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </PageTransition>
  );
};
