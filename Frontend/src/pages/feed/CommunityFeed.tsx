import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  Bookmark,
  Layers,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react';
import { searchService, FeedQueryParams } from '../../services/searchService';
import { PublicItem } from '../../types/item';
import { ItemCategory, ItemStatus, ItemType, CATEGORY_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const CommunityFeed: React.FC = () => {
  const { success, error } = useToast();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | ''>('');

  // Save search modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [watchName, setWatchName] = useState('');
  const [isSavingWatch, setIsSavingWatch] = useState(false);

  const fetchFeed = useCallback(async (isLoadMore: boolean = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const params: FeedQueryParams = {
        limit: 12,
        cursor: isLoadMore ? nextCursor : undefined,
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedType) params.type = selectedType;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await searchService.getCommunityFeed(params);
      if (isLoadMore) {
        setItems((prev) => [...prev, ...(res.data || [])]);
      } else {
        setItems(res.data || []);
      }
      setNextCursor(res.nextCursor);
    } catch (err: any) {
      console.error('Error fetching feed:', err);
      error(err.message || 'Failed to fetch community feed');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedType, selectedCategory, selectedStatus, nextCursor, error]);

  useEffect(() => {
    fetchFeed(false);
  }, [searchQuery, selectedType, selectedCategory, selectedStatus]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  const handleSaveWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchName.trim()) return;

    setIsSavingWatch(true);
    try {
      await searchService.createSavedSearch({
        name: watchName.trim(),
        criteria: {
          q: searchQuery || undefined,
          category: selectedCategory || undefined,
          type: selectedType || undefined,
        },
      });
      success(`Watch '${watchName}' created. You'll be notified of new reports!`);
      setShowSaveModal(false);
      setWatchName('');
    } catch (err: any) {
      error(err.message || 'Failed to create saved search');
    } finally {
      setIsSavingWatch(false);
    }
  };

  const hasActiveFilters = Boolean(searchQuery || selectedType || selectedCategory || selectedStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community Feed</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and discover lost and found items posted across GSFC University.
          </p>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Bookmark className="w-3.5 h-3.5 mr-1.5" />
          Save Search Watch
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name, description, brand, or color..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Item Type filter */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setSelectedType('')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedType === '' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType(ItemType.LOST)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedType === ItemType.LOST ? 'bg-rose-50 text-rose-700 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setSelectedType(ItemType.FOUND)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedType === ItemType.FOUND ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ItemCategory | '')}
            className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {Object.values(ItemCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ItemStatus | '')}
            className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Active Statuses</option>
            <option value={ItemStatus.LOST_REPORTED}>Lost Reported</option>
            <option value={ItemStatus.FOUND}>Found (In Custody)</option>
            <option value={ItemStatus.READY_FOR_COLLECTION}>Ready for Collection</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Feed Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items found"
          description={
            hasActiveFilters
              ? "We couldn't find any items matching your selected filters. Try broadening your search or clear all filters."
              : 'There are currently no items reported in the community feed.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Report an Item'}
          onAction={hasActiveFilters ? handleClearFilters : () => (window.location.href = '/report/lost')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const displayImage = item.images && item.images.length > 0 ? item.images[0] : null;
            return (
              <div
                key={item.caseId}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo or Category Placeholder Banner */}
                  {displayImage ? (
                    <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={displayImage}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <ItemTypeBadge type={item.type} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                      <Package className="w-10 h-10 text-slate-300" />
                      <div className="absolute top-2.5 left-2.5">
                        <ItemTypeBadge type={item.type} />
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <CategoryBadge category={item.category} />
                      <ItemStatusBadge status={item.status} size="sm" />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-400 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        <span>
                          Reported on {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-0">
                  <Link
                    to={`/items/${item.caseId}`}
                    className="w-full flex items-center justify-center py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
                  >
                    View Details & Claim <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {nextCursor && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchFeed(true)}
            disabled={isLoadingMore}
            className="px-6 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading items...' : 'Load more items'}
          </button>
        </div>
      )}

      {/* Save Search Watch Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Create Search Watch"
        description="Receive in-app alerts whenever a newly reported item matches this search."
        maxWidth="md"
      >
        <form onSubmit={handleSaveWatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Watch Name
            </label>
            <input
              type="text"
              required
              value={watchName}
              onChange={(e) => setWatchName(e.target.value)}
              placeholder="e.g. My Lost Dell XPS or Blue Backpack"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold block text-slate-700 mb-1">Watch Criteria:</span>
            <p>• Keyword: {searchQuery || 'Any keyword'}</p>
            <p>• Type: {selectedType || 'Lost or Found'}</p>
            <p>• Category: {selectedCategory ? CATEGORY_LABELS[selectedCategory] : 'All Categories'}</p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingWatch}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
            >
              {isSavingWatch ? 'Saving...' : 'Save Watch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
