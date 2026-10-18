import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Plus, Trash2, ArrowRight, Search, Tag, MapPin } from 'lucide-react';
import { searchService } from '../../services/searchService';
import { SavedSearch, CreateSavedSearchPayload } from '../../types/savedSearch';
import { ItemCategory, ItemType, CATEGORY_LABELS } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

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
      success(`Watch '${name}' created successfully`);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saved Searches & Watches</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated watches monitor new community reports and alert you immediately upon matches.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Watch
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading your watches...</div>
      ) : searches.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No search watches active"
          description="Create a watch to monitor for specific items (e.g. 'Casio Calculator' or 'Black Wallet'). You will receive immediate in-app notifications whenever a matching item is posted."
          actionLabel="Create First Watch"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {searches.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle hover:shadow-elevated transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Watch
                  </span>
                  <button
                    onClick={() => setDeleteTargetId(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete watch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
                  {s.criteria.q && (
                    <div className="flex items-center">
                      <Search className="w-3 h-3 mr-1.5 text-slate-400" />
                      <span>
                        Keyword: <strong>"{s.criteria.q}"</strong>
                      </span>
                    </div>
                  )}
                  {s.criteria.category && (
                    <div className="flex items-center">
                      <Tag className="w-3 h-3 mr-1.5 text-slate-400" />
                      <span>
                        Category: <strong>{CATEGORY_LABELS[s.criteria.category]}</strong>
                      </span>
                    </div>
                  )}
                  {s.criteria.type && (
                    <div>
                      Type: <strong>{s.criteria.type}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Created {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to={`/feed?${s.criteria.q ? `q=${encodeURIComponent(s.criteria.q)}&` : ''}${
                    s.criteria.category ? `category=${s.criteria.category}&` : ''
                  }${s.criteria.type ? `type=${s.criteria.type}` : ''}`}
                  className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Run Search <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Watch Label
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Missing Wallet or Scientific Calculator"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Search Keywords (Optional)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. WildHorn, Casio, Silver, Blue"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Any Category</option>
                {Object.values(ItemCategory).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Report Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType | '')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Lost or Found</option>
                <option value={ItemType.LOST}>Lost Reports</option>
                <option value={ItemType.FOUND}>Found Reports</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
            >
              {isCreating ? 'Saving...' : 'Activate Watch'}
            </button>
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
    </div>
  );
};
