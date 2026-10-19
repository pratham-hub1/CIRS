import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  CheckCircle,
  Compass,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  ClipboardCheck,
  Shield,
  Clock,
  MapPin,
  Building,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itemsService } from '../../services/itemsService';
import { claimsService } from '../../services/claimsService';
import { searchService } from '../../services/searchService';
import { Item, PublicItem } from '../../types/item';
import { Claim } from '../../types/claim';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';

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

  const resolvedCount = myItems.filter((i) => i.status === 'RETURNED').length;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-9 text-white shadow-elevated border border-brand-800/40">
          <div className="relative z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/25 text-brand-200 border border-brand-400/30 backdrop-blur-sm">
                GSFC University • Central Recovery Hub
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Live Desk
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {getGreeting()}, {user?.name || 'Scholar'}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
              Report lost belongings, register found property, and track ownership verification with campus security in real time.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/report/lost"
                className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-subtle hover:shadow-elevated transition-all active:scale-95"
              >
                <FileQuestion className="w-4 h-4 mr-2" />
                Report Lost Item
              </Link>
              <Link
                to="/report/found"
                className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-subtle hover:shadow-elevated transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Report Found Item
              </Link>
              <Link
                to="/feed"
                className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm transition-all"
              >
                <Compass className="w-4 h-4 mr-2" />
                Campus Feed
              </Link>
            </div>
          </div>

          {/* Ambient luminous glow circles */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-10 bottom-0 w-64 h-64 bg-accent-500/15 rounded-full blur-2xl pointer-events-none" />
        </div>
      </FadeIn>

      {/* Summary KPI Cards with Stagger Animation */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Cases
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {activeCasesCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <FolderOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Under active review</span>
              <Link
                to="/my-cases"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center"
              >
                Cases <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pending Claims
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {pendingClaimsCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Awaiting security staff</span>
              <Link
                to="/my-claims"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center"
              >
                Claims <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recovered Items
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">
                  {resolvedCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Returned to owner
              </span>
              <span className="text-[11px] text-slate-400">Total</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Security Vault
                </p>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">Ground Floor</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Main Academic Block</span>
              <span className="text-[10px] font-bold text-brand-600 uppercase">Ext. 4012</span>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Grid: Feed + Campus Protocol Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Recent Campus Discoveries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Recent Campus Discoveries
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Recently found and reported items across campus grounds
              </p>
            </div>
            <Link
              to="/feed"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center group"
            >
              <span>Explore all</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : recentFeed.length === 0 ? (
            <div className="p-10 bg-white border border-slate-200/80 rounded-2xl text-center shadow-subtle">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No recent reports found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No items have been posted to the campus feed yet.
              </p>
              <div className="mt-4">
                <Link
                  to="/report/lost"
                  className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-subtle transition-colors"
                >
                  Report a lost item
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentFeed.map((item) => (
                <div
                  key={item.caseId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <ItemTypeBadge type={item.type} />
                        {item.category && <CategoryBadge category={item.category} />}
                      </div>
                      <ItemStatusBadge status={item.status} size="sm" />
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3.5 flex items-center text-[11px] text-slate-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-slate-400" />
                      <span className="truncate">
                        {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {item.caseId}
                    </span>
                    <Link
                      to={`/items/${item.caseId}`}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View case</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Campus Recovery Protocol & Security Guidelines */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Recovery Protocol
            </h2>
            <p className="text-xs text-slate-500 font-normal">Official GSFC Security procedure</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle space-y-4 text-xs">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Physical Collection</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Approved items are handed over at the Campus Security Office. Present your single-use 6-character collection token.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Verification Desk Hours</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Monday to Saturday: 9:00 AM – 5:30 PM. Closed on university holidays.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">High-Value Items</h4>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Laptops, phones and wallets require high verification (serial numbers, invoice, or lock screen match).
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-center py-2.5 px-3.5 text-xs font-bold text-brand-700 bg-brand-50/80 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors shadow-subtle"
                >
                  <Shield className="w-4 h-4 mr-2 text-brand-600" /> Open Security Operations Desk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
