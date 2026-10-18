import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  CheckCircle,
  Compass,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  ClipboardCheck,
  Layers,
  Bell,
  Shield,
  Clock,
  MapPin,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itemsService } from '../../services/itemsService';
import { claimsService } from '../../services/claimsService';
import { matchingService } from '../../services/matchingService';
import { searchService } from '../../services/searchService';
import { Item, PublicItem } from '../../types/item';
import { Claim } from '../../types/claim';
import { ItemStatusBadge, ItemTypeBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const { user, role, isAdmin } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [recentFeed, setRecentFeed] = useState<PublicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [itemsRes, claimsRes, feedRes] = await Promise.allSettled([
          itemsService.getMyItems(),
          claimsService.getMyClaims(),
          searchService.getCommunityFeed({ limit: 4 }),
        ]);

        if (itemsRes.status === 'fulfilled') setMyItems(itemsRes.value || []);
        if (claimsRes.status === 'fulfilled') setMyClaims(claimsRes.value || []);
        if (feedRes.status === 'fulfilled') setRecentFeed(feedRes.value?.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const activeCasesCount = myItems.filter(
    (i) => i.status !== 'ARCHIVED' && i.status !== 'RETURNED' && i.status !== 'UNCLAIMED',
  ).length;

  const pendingClaimsCount = myClaims.filter(
    (c) => c.status === 'PENDING' || c.status === 'INFO_REQUESTED',
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-elevated">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/30 text-brand-200 border border-brand-400/30 mb-3">
            GSFC University • Campus Item Recovery System
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || 'Member'}!
          </h1>
          <p className="mt-2 text-sm text-brand-100/90 leading-relaxed">
            Report lost or found belongings, track ownership claim verifications, and discover items securely held by campus security.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/report/lost"
              className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Report Lost Item
            </Link>
            <Link
              to="/report/found"
              className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Report Found Item
            </Link>
            <Link
              to="/feed"
              className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <Compass className="w-4 h-4 mr-2" />
              Browse Campus Feed
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Cases
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeCasesCount}</h3>
            <Link to="/my-cases" className="text-xs text-brand-600 hover:underline mt-1 inline-block">
              View your cases →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Claims
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingClaimsCount}</h3>
            <Link to="/my-claims" className="text-xs text-brand-600 hover:underline mt-1 inline-block">
              Track status →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved Cases
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {myItems.filter((i) => i.status === 'RETURNED').length}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Belongings recovered</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Security Desk
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-1">Ground Floor</h3>
            <p className="text-xs text-slate-400 mt-1">Main Academic Block</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Discoveries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Campus Discoveries</h2>
            <Link to="/feed" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center">
              View all items <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : recentFeed.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
              No recent discoveries reported yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentFeed.map((item) => (
                <div
                  key={item.caseId}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle hover:shadow-elevated transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <ItemTypeBadge type={item.type} />
                      <ItemStatusBadge status={item.status} size="sm" />
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3 flex items-center text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.caseId}
                    </span>
                    <Link
                      to={`/items/${item.caseId}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Campus Help & Guidelines */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Recovery Guide</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Physical Collection</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Approved items are handed over at Campus Security Office. Present your single-use collection token.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Verification Desk Hours</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Monday to Saturday: 9:00 AM – 5:30 PM. Closed on university holidays.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">High-Value Items</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Laptops, phones and wallets require high verification (serial numbers, invoice, or lock screen match).
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-center py-2 px-3 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Open Security Admin Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
