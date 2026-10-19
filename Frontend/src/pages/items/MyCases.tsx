import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, ArrowRight, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { Item } from '../../types/item';
import { ItemType } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';

export const MyCases: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  useEffect(() => {
    const fetchMyItems = async () => {
      setIsLoading(true);
      try {
        const data = await itemsService.getMyItems();
        setItems(data || []);
      } catch (err) {
        console.error('Error fetching my items:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyItems();
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'LOST') return item.type === ItemType.LOST;
    if (activeTab === 'FOUND') return item.type === ItemType.FOUND;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                Case Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Active Cases
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
              Manage your personal lost and found incident reports and track real-time recovery progress with campus security.
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
      <div className="inline-flex rounded-xl border border-slate-200/90 p-1 bg-slate-100/70 text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Cases ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'LOST'
              ? 'bg-rose-50 text-rose-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lost Reports ({items.filter((i) => i.type === ItemType.LOST).length})
        </button>
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'FOUND'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Found Reports ({items.filter((i) => i.type === ItemType.FOUND).length})
        </button>
      </div>

      {/* Case Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No reports in this category"
          description="You haven't filed any cases in this section yet."
          actionLabel="Report an Item"
          onAction={() => (window.location.href = '/report/lost')}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredItems.map((item) => (
            <StaggerItem key={item.caseId}>
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between group h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <ItemTypeBadge type={item.type} />
                    <ItemStatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-brand-700 font-extrabold bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200/60">
                      {item.caseId}
                    </span>
                    <CategoryBadge category={item.category} />
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mt-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {item.itemName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-[11px] font-medium">
                        {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                      </span>
                    </div>
                    <div className="flex items-center text-slate-400 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span>Reported {formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    to={`/items/${item.caseId}`}
                    className="inline-flex items-center text-xs font-bold text-brand-600 hover:text-brand-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Inspect Case Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
};
