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

  // Sync state if URL search params change
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

      // Filter locally by location if user entered locationQuery
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
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                Item Discovery & Search
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Search & Browse
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
              Find registered lost and found articles across all campus premises using faceted search filters.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <Link to="/report/lost">
              <Button variant="danger" size="sm">
                Report Lost Item
              </Button>
            </Link>
            <Link to="/report/found">
              <Button variant="success" size="sm">
                Report Found Item
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-subtle space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, description, brand, or color..."
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear keyword"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative md:w-56">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Filter by location..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 placeholder-slate-400"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="flex-shrink-0">
            <Search className="w-4 h-4 mr-1.5" /> Search
          </Button>
        </form>

        {/* Faceted Dropdowns & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType | '')}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Types (Lost & Found)</option>
              <option value={ItemType.LOST}>Lost Items</option>
              <option value={ItemType.FOUND}>Found Items</option>
            </select>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>
                  {label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus | '')}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([statKey, label]) => (
                <option key={statKey} value={statKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-700 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-brand-700 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700'
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>
            {search && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-semibold border border-brand-200/60">
                Keyword: "{search}"
                <button onClick={() => setSearch('')} className="ml-1.5 text-brand-400 hover:text-brand-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Type: {type}
                <button onClick={() => setType('')} className="ml-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Category: {CATEGORY_LABELS[category] || category}
                <button onClick={() => setCategory('')} className="ml-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Status: {STATUS_LABELS[status] || status}
                <button onClick={() => setStatus('')} className="ml-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {locationQuery && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Location: "{locationQuery}"
                <button onClick={() => setLocationQuery('')} className="ml-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing <strong>{items.length}</strong> permitted public item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              : 'There are currently no items logged in the campus directory.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Report an Item'}
          onAction={hasActiveFilters ? clearAllFilters : () => (window.location.href = '/report/lost')}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
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

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">
                            {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                          </span>
                        </div>
                        <div className="flex items-center text-slate-400">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                          <span>
                            {item.type === ItemType.LOST ? 'Lost on ' : 'Discovered on '}
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

                  <div className="p-4 sm:p-5 pt-0">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                        {item.caseId}
                      </span>
                      <Link
                        to={`/items/${item.caseId}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        /* List / Table Layout */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type &amp; Status</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => (
                  <tr key={item.caseId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.caseId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <ItemTypeBadge type={item.type} />
                        <ItemStatusBadge status={item.status} size="sm" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                      {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {item.dateLost || item.dateFound
                        ? new Date(item.dateLost || item.dateFound || '').toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : formatRelativeTime(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/items/${item.caseId}`}
                        className="inline-flex items-center text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        <span>View</span>
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
            className="shadow-subtle"
          >
            {isLoadingMore ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoadingMore ? 'Loading more items...' : 'Load more items'}
          </Button>
        </div>
      )}
    </div>
  );
};
