import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { Item } from '../../types/item';
import { ItemType } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Active Cases</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal lost and found reports and track their recovery progress.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/report/lost"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Report Lost
          </Link>
          <Link
            to="/report/found"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-medium text-slate-500">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-colors ${
            activeTab === 'ALL'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          All Cases ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-colors ${
            activeTab === 'LOST'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Lost Reports ({items.filter((i) => i.type === ItemType.LOST).length})
        </button>
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-colors ${
            activeTab === 'FOUND'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent hover:text-slate-700'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.caseId}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle hover:shadow-elevated transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <ItemTypeBadge type={item.type} />
                  <ItemStatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    {item.caseId}
                  </span>
                  <CategoryBadge category={item.category} />
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">
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
                  <div className="flex items-center text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <Link
                  to={`/items/${item.caseId}`}
                  className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Manage Case <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
