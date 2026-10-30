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
  Radio,
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
import { GlassCard } from '../../components/common/GlassCard';
import { DynamicTicker } from '../../components/common/DynamicTicker';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../lib/utils';
import { celebrateConfetti } from '../../lib/confetti';

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
      celebrateConfetti();
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
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                PUBLIC INVENTORY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-neutral-400">
                LIVE BULLETIN
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Community Discovery Feed
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Live bulletin of all reported lost items and secured campus recoveries. Search by title, keywords, or location.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveModal(true)}
            className="self-start sm:self-auto"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
            <span>Create Search Watch</span>
          </Button>
        </div>
      </FadeIn>

      {/* Dynamic Telemetry Marquee with Interactive Hover Pause */}
      <DynamicTicker className="rounded-2xl border border-white/[0.08]" />

      {/* Filter and Search Bar */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-5 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, model, serial hint, color, or location..."
            className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white focus:border-white/40 bg-neutral-900 text-white placeholder:text-neutral-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06] text-xs">
          {/* Segmented Type Switch */}
          <div className="inline-flex rounded-xl border border-white/[0.08] p-1 bg-neutral-900">
            <button
              onClick={() => setSelectedType('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === ''
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType(ItemType.LOST)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === ItemType.LOST
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setSelectedType(ItemType.FOUND)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === ItemType.FOUND
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Found
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ItemCategory | '')}
            className="py-2 px-3 text-xs font-medium border border-white/[0.08] rounded-xl bg-neutral-900 text-white focus:outline-none focus:border-white/40 shadow-sm"
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
            className="py-2 px-3 text-xs font-medium border border-white/[0.08] rounded-xl bg-neutral-900 text-white focus:outline-none focus:border-white/40 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value={ItemStatus.LOST_REPORTED}>Lost Reported</option>
            <option value={ItemStatus.FOUND}>Found (In Custody)</option>
            <option value={ItemStatus.READY_FOR_COLLECTION}>Ready for Collection</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Feed Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            hasActiveFilters ? handleClearFilters : () => (window.location.href = '/report')
          }
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const rawImage = item.images && item.images.length > 0 ? item.images[0] : null;
            const displayImage = resolveImageUrl(rawImage);
            return (
              <StaggerItem key={item.caseId}>
                <GlassCard enableTilt enableSheen className="overflow-hidden flex flex-col justify-between h-full">
                  <div>
                    {/* Photo or Category Placeholder Banner */}
                    {displayImage ? (
                      <div className="h-48 w-full bg-neutral-900 overflow-hidden relative">
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
                          className="absolute inset-0 w-full h-full bg-neutral-900 items-center justify-center"
                        >
                          <Package className="w-10 h-10 text-neutral-600" />
                        </div>
                        <div className="absolute top-3 left-3">
                          <ItemTypeBadge type={item.type} />
                        </div>
                        {item.images && item.images.length > 1 && (
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-white flex items-center space-x-1 border border-white/10">
                            <Camera className="w-3 h-3" />
                            <span>{item.images.length}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 w-full bg-neutral-900 flex items-center justify-center relative border-b border-white/[0.06]">
                        <Package className="w-10 h-10 text-neutral-600 group-hover:scale-105 transition-transform" />
                        <div className="absolute top-3 left-3">
                          <ItemTypeBadge type={item.type} />
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <CategoryBadge category={item.category} />
                        <ItemStatusBadge status={item.status} size="sm" />
                      </div>

                      <h3 className="font-semibold text-white text-base leading-snug line-clamp-1 group-hover:text-neutral-200 transition-colors">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-xs text-neutral-400 font-mono">
                        <div className="flex items-center text-neutral-300">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-neutral-400 flex-shrink-0" />
                          <span className="truncate font-medium text-[11px]">
                            {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                          </span>
                        </div>
                        <div className="flex items-center text-neutral-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-neutral-500" />
                          <span>Reported {formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0">
                    <Link
                      to={`/items/${item.caseId}`}
                      className="w-full flex items-center justify-center py-2.5 px-3 text-xs font-semibold text-white bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.12] transition-all group-hover:border-white/20"
                    >
                      <span>View Dossier &amp; Claim</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </GlassCard>
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
            className="px-6 py-2.5 text-xs"
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
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Watch Label
            </label>
            <input
              type="text"
              required
              value={watchName}
              onChange={(e) => setWatchName(e.target.value)}
              placeholder="e.g. My Blue Titan Rucksack or Calculator"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white bg-neutral-900 text-white placeholder-neutral-500 font-medium"
            />
          </div>

          <div className="p-3.5 bg-neutral-900 rounded-xl border border-white/[0.08] text-xs text-neutral-400 space-y-1.5 font-mono">
            <span className="font-semibold block text-white">Watch Query Parameters:</span>
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
