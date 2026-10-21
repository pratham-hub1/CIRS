import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  MapPin,
  Calendar,
  Bookmark,
  Sparkles,
  ArrowRight,
  Package,
  SlidersHorizontal,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { searchService, FeedQueryParams } from '../../services/searchService';
import { resolveImageUrl } from '../../services/apiClient';
import { PublicItem } from '../../types/item';
import { ItemCategory, ItemStatus, ItemType, CATEGORY_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

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

  const fetchFeed = useCallback(
    async (isLoadMore: boolean = false) => {
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
    },
    [searchQuery, selectedType, selectedCategory, selectedStatus, nextCursor, error],
  );

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
      success(`Watch '${watchName}' created. You will receive alerts for new matches!`);
      setShowSaveModal(false);
      setWatchName('');
    } catch (err: any) {
      error(err.message || 'Failed to create saved search');
    } finally {
      setIsSavingWatch(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedType || selectedCategory || selectedStatus,
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                Campus Registry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Community Discovery Feed
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
              Live bulletin of all reported lost items and secured campus recoveries at GSFC University.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveModal(true)}
            className="self-start sm:self-auto border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
            Create Search Watch
          </Button>
        </div>
      </FadeIn>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-subtle space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, model, serial hint, color, or location..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/60 font-medium placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Segmented Type Switch */}
          <div className="inline-flex rounded-xl border border-slate-200/90 p-0.5 bg-slate-100/70">
            <button
              type="button"
              onClick={() => setSelectedType('')}
              aria-pressed={selectedType === ''}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === ''
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedType(ItemType.LOST)}
              aria-pressed={selectedType === ItemType.LOST}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === ItemType.LOST
                  ? 'bg-rose-50 text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => setSelectedType(ItemType.FOUND)}
              aria-pressed={selectedType === ItemType.FOUND}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === ItemType.FOUND
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ItemCategory | '')}
            className="py-1.5 px-3 text-xs font-semibold border border-slate-200/90 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
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
            className="py-1.5 px-3 text-xs font-semibold border border-slate-200/90 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value={ItemStatus.LOST_REPORTED}>Lost Reported</option>
            <option value={ItemStatus.FOUND}>Found (In Custody)</option>
            <option value={ItemStatus.READY_FOR_COLLECTION}>Ready for Collection</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset Filters
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
              ? 'No items match your active search and filter criteria. Try clearing some filters to expand your search.'
              : 'There are currently no items logged in the community feed.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Report an Item'}
          onAction={
            hasActiveFilters ? handleClearFilters : () => (window.location.href = '/report/lost')
          }
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((item) => {
            const rawImage = item.images && item.images.length > 0 ? item.images[0] : null;
            const displayImage = resolveImageUrl(rawImage);
            return (
              <StaggerItem key={item.caseId}>
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group h-full">
                  <div>
                    {/* Photo or Category Placeholder Banner */}
                    {displayImage ? (
                      <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={displayImage}
                          alt={item.itemName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling;
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div
                          style={{ display: 'none' }}
                          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 items-center justify-center"
                        >
                          <Package className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="absolute top-3 left-3">
                          <ItemTypeBadge type={item.type} />
                        </div>
                        {item.images && item.images.length > 1 && (
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white flex items-center space-x-1">
                            <Camera className="w-3 h-3" />
                            <span>{item.images.length}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center relative">
                        <Package className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-200" />
                        <div className="absolute top-3 left-3">
                          <ItemTypeBadge type={item.type} />
                        </div>
                      </div>
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2.5">
                        <CategoryBadge category={item.category} />
                        <ItemStatusBadge status={item.status} size="sm" />
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium text-[11px]">
                            {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                          </span>
                        </div>
                        <div className="flex items-center text-slate-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-slate-400" />
                          <span>Reported {formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0">
                    <Link
                      to={`/items/${item.caseId}`}
                      className="w-full flex items-center justify-center py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-subtle group-hover:border-brand-300"
                    >
                      <span>View Details & Claim</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {/* Load More Button */}
      {nextCursor && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchFeed(true)}
            isLoading={isLoadingMore}
            className="px-6 py-2.5"
          >
            Load more items
          </Button>
        </div>
      )}

      {/* Save Search Watch Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Create Search Watch"
        description="Receive proactive in-app alerts whenever a newly reported item matches this search."
        maxWidth="md"
      >
        <form onSubmit={handleSaveWatch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Watch Label
            </label>
            <input
              type="text"
              required
              value={watchName}
              onChange={(e) => setWatchName(e.target.value)}
              placeholder="e.g. My Blue Titan Rucksack or Calculator"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-medium">
            <span className="font-bold block text-slate-800">Watch Query Parameters:</span>
            <p>• Keyword: {searchQuery || 'Any keyword'}</p>
            <p>• Type: {selectedType || 'Lost or Found'}</p>
            <p>
              • Category: {selectedCategory ? CATEGORY_LABELS[selectedCategory] : 'All Categories'}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingWatch}
            >
              Save Watch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
