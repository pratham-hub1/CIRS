import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Package,
  MapPin,
  Calendar,
  Grid,
  List,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { searchService, FeedQueryParams } from '../../services/searchService';
import { resolveImageUrl } from '../../services/apiClient';
import { PublicItem } from '../../types/item';
import { ItemCategory, ItemStatus, ItemType, CATEGORY_LABELS, STATUS_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { GlassCard } from '../../components/common/GlassCard';
import { DynamicTicker } from '../../components/common/DynamicTicker';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';

export const SearchBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = (searchParams.get('category') as ItemCategory) || '';
  const initialType = (searchParams.get('type') as ItemType) || '';
  const initialStatus = (searchParams.get('status') as ItemStatus) || '';

  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState<ItemCategory | ''>(initialCategory);
  const [type, setType] = useState<ItemType | ''>(initialType);
  const [status, setStatus] = useState<ItemStatus | ''>(initialStatus);
  const [locationQuery, setLocationQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [items, setItems] = useState<PublicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== search) setSearch(q);
  }, [searchParams]);

  const fetchItems = useCallback(async (isLoadMore = false, cursor?: string) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: FeedQueryParams = {
        q: search.trim() || undefined,
        category: category || undefined,
        type: type || undefined,
        status: status || undefined,
        cursor: cursor,
        limit: 12,
      };

      const res = await searchService.getCommunityFeed(params);
      let fetched = res.data || [];

      if (locationQuery.trim()) {
        const lq = locationQuery.trim().toLowerCase();
        fetched = fetched.filter(
          (i) =>
            (i.foundLocation && i.foundLocation.toLowerCase().includes(lq)) ||
            (i.lastKnownLocation && i.lastKnownLocation.toLowerCase().includes(lq)),
        );
      }

      if (isLoadMore) {
        setItems((prev) => [...prev, ...fetched]);
      } else {
        setItems(fetched);
      }
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Error fetching search items:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [search, category, type, status, locationQuery]);

  useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (search.trim()) newParams.q = search.trim();
    if (category) newParams.category = category;
    if (type) newParams.type = type;
    if (status) newParams.status = status;
    setSearchParams(newParams);
    fetchItems(false);
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setStatus('');
    setLocationQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search.trim() || category || type || status || locationQuery.trim(),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                VAULT INVENTORY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-neutral-400">
                ACTIVE SEARCH
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Search & Browse Vault
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Locate registered lost and found articles across campus zones using keywords, category tags, or location.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <Link to="/report">
              <Button variant="primary" size="sm">
                Report Item
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Search and Filters Bar */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, markings, brand, serial, or color..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-neutral-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                aria-label="Clear keyword"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative md:w-60">
            <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Filter by campus zone..."
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-neutral-500 transition-all"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="flex-shrink-0">
            <Search className="w-4 h-4 mr-1.5" /> Search
          </Button>
        </form>

        {/* Faceted Dropdowns & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType | '')}
              className="px-3 py-1.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-neutral-300 focus:outline-none focus:border-white/40"
            >
              <option value="" className="bg-[#12151D] text-neutral-300">All Types (Lost & Found)</option>
              <option value={ItemType.LOST} className="bg-[#12151D] text-neutral-300">Lost Items</option>
              <option value={ItemType.FOUND} className="bg-[#12151D] text-neutral-300">Found Items</option>
            </select>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
              className="px-3 py-1.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-neutral-300 focus:outline-none focus:border-white/40"
            >
              <option value="" className="bg-[#12151D] text-neutral-300">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey} className="bg-[#12151D] text-neutral-300">
                  {label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus | '')}
              className="px-3 py-1.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-neutral-300 focus:outline-none focus:border-white/40"
            >
              <option value="" className="bg-[#12151D] text-neutral-300">All Status Codes</option>
              {Object.entries(STATUS_LABELS).map(([statKey, label]) => (
                <option key={statKey} value={statKey} className="bg-[#12151D] text-neutral-300">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center space-x-1 border border-white/10 rounded-xl p-1 bg-neutral-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              Active Parameters:
            </span>
            {search && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-xs border border-white/10">
                Keyword: "{search}"
                <button onClick={() => setSearch('')} className="ml-1.5 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-xs border border-white/10">
                Type: {type}
                <button onClick={() => setType('')} className="ml-1.5 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-xs border border-white/10">
                Category: {CATEGORY_LABELS[category] || category}
                <button onClick={() => setCategory('')} className="ml-1.5 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-xs border border-white/10">
                Status: {STATUS_LABELS[status] || status}
                <button onClick={() => setStatus('')} className="ml-1.5 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {locationQuery && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-xs border border-white/10">
                Zone: "{locationQuery}"
                <button onClick={() => setLocationQuery('')} className="ml-1.5 text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-400 hover:text-rose-300 ml-1 hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 font-mono px-1">
        <span>
          ARTICLES IDENTIFIED: <strong className="text-white">{items.length}</strong>
        </span>
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              ? 'No registered items match the active parameters. Reset filters to expand your search.'
              : 'Zero active articles are currently logged in the directory.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Report an Item'}
          onAction={hasActiveFilters ? clearAllFilters : () => (window.location.href = '/report')}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const rawImage = item.images && item.images.length > 0 ? item.images[0] : null;
            const displayImage = resolveImageUrl(rawImage);
            return (
              <StaggerItem key={item.caseId}>
                <GlassCard enableTilt enableSheen className="overflow-hidden flex flex-col justify-between h-full">
                  <div>
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
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white flex items-center space-x-1 border border-white/20">
                            <Camera className="w-3 h-3 text-neutral-300" />
                            <span>{item.images.length}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 w-full bg-neutral-900 flex items-center justify-center relative border-b border-white/[0.06]">
                        <Package className="w-10 h-10 text-neutral-600 group-hover:scale-105 transition-all" />
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

                      <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[11px] text-neutral-400 font-mono">
                        <div className="flex items-center text-neutral-300">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-neutral-400 flex-shrink-0" />
                          <span className="truncate">
                            {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                          </span>
                        </div>
                        <div className="flex items-center text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                          <span>
                            {item.type === ItemType.LOST ? 'LOST: ' : 'FOUND: '}
                            {item.dateLost || item.dateFound
                              ? new Date(item.dateLost || item.dateFound || '').toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        #{item.caseId}
                      </span>
                      <Link
                        to={`/items/${item.caseId}`}
                        className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        /* List / Table Layout */
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-neutral-900 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-5">Item Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Zone / Location</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {items.map((item) => (
                  <tr key={item.caseId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white">{item.itemName}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">#{item.caseId}</div>
                    </td>
                    <td className="py-4 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1.5">
                        <ItemTypeBadge type={item.type} />
                        <ItemStatusBadge status={item.status} size="sm" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-neutral-300 text-[11px] max-w-xs truncate">
                      {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                    </td>
                    <td className="py-4 px-4 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                      {item.dateLost || item.dateFound
                        ? new Date(item.dateLost || item.dateFound || '').toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : formatRelativeTime(item.createdAt)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        to={`/items/${item.caseId}`}
                        className="inline-flex items-center text-xs font-semibold text-white hover:text-neutral-300"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cursor Pagination / Load More */}
      {nextCursor && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchItems(true, nextCursor)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoadingMore ? 'Loading items...' : 'Load more items'}
          </Button>
        </div>
      )}
    </div>
  );
};
