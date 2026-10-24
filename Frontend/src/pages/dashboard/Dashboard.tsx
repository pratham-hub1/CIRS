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
  KeyRound,
  ExternalLink,
  Layers,
  Search,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itemsService } from '../../services/itemsService';
import { claimsService } from '../../services/claimsService';
import { searchService } from '../../services/searchService';
import { matchingService } from '../../services/matchingService';
import { resolveImageUrl } from '../../services/apiClient';
import { Item, PublicItem } from '../../types/item';
import { Claim } from '../../types/claim';
import { Match } from '../../types/matching';
import { ItemCategory, ItemStatus, ItemType, ClaimStatus } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';
import { Button } from '../../components/common/Button';

export const Dashboard: React.FC = () => {
  const { user, role, isAdmin } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [recentFeed, setRecentFeed] = useState<PublicItem[]>([]);
  const [possibleMatches, setPossibleMatches] = useState<Match[]>([]);
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

        const loadedItems = itemsRes.status === 'fulfilled' ? itemsRes.value || [] : [];
        if (itemsRes.status === 'fulfilled') setMyItems(loadedItems);
        if (claimsRes.status === 'fulfilled') setMyClaims(claimsRes.value || []);
        if (feedRes.status === 'fulfilled') setRecentFeed(feedRes.value?.data || []);

        const lostItems = loadedItems.filter((i) => i.type === ItemType.LOST);
        if (lostItems.length > 0) {
          const matchPromises = lostItems.slice(0, 3).map((item) =>
            matchingService.getMatchesForCase(item.caseId).catch(() => [] as Match[]),
          );
          const matchResults = await Promise.allSettled(matchPromises);
          const aggregatedMatches: Match[] = [];
          matchResults.forEach((res) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
              aggregatedMatches.push(...res.value);
            }
          });
          setPossibleMatches(aggregatedMatches);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const lostCount = myItems.filter((i) => i.type === ItemType.LOST).length;
  const foundCount = myItems.filter((i) => i.type === ItemType.FOUND).length;
  const readyCount = myItems.filter(
    (i) => i.status === ItemStatus.READY_FOR_COLLECTION,
  ).length;
  const returnedCount = myItems.filter((i) => i.status === ItemStatus.RETURNED).length;

  const infoRequestedClaim = myClaims.find((c) => c.status === ClaimStatus.INFO_REQUESTED);
  const approvedClaim = myClaims.find((c) => c.status === ClaimStatus.APPROVED);

  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white">
      {/* Hero Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              RECOVERY TELEMETRY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              CAMPUS REPOSITORY LIVE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Track reported items, review claim verification milestones, and browse public campus discoveries in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl shadow-sm hover:bg-neutral-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Item</span>
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] text-neutral-200 hover:text-white border border-white/[0.08] text-xs font-semibold rounded-xl transition-all"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span>Browse Vault</span>
          </Link>
        </div>
      </div>

      {/* Critical Status Alert Banners (Action Required) */}
      {infoRequestedClaim && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-[#171B26] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Information Requested on Claim #{infoRequestedClaim.id.slice(0, 8)}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                The custodian has requested additional ownership details before approving collection.
              </p>
            </div>
          </div>
          <Link
            to={`/claims/${infoRequestedClaim.id}`}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Provide Information
          </Link>
        </motion.div>
      )}

      {approvedClaim && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-[#171B26] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Claim Approved — Handover Pass Ready
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Your ownership was verified. Show your digital redemption token at the campus custody desk.
              </p>
            </div>
          </div>
          <Link
            to={`/claims/${approvedClaim.id}`}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            View Redemption Pass
          </Link>
        </motion.div>
      )}

      {/* KPI Metric Blocks (Minimalist Apple/Tesla style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
              LOST REPORTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            {isLoading ? '—' : lostCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 font-mono flex items-center justify-between">
            <span>Pending recovery</span>
            <Link to="/my-cases" className="hover:text-white transition-colors">
              View cases →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
              FOUND DEPOSITS
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            {isLoading ? '—' : foundCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 font-mono flex items-center justify-between">
            <span>Items turned in</span>
            <Link to="/my-cases" className="hover:text-white transition-colors">
              View items →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
              ACTIVE CLAIMS
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            {isLoading ? '—' : myClaims.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 font-mono flex items-center justify-between">
            <span>Under adjudication</span>
            <Link to="/my-claims" className="hover:text-white transition-colors">
              View claims →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
              RESOLVED RETURNS
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            {isLoading ? '—' : returnedCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 font-mono flex items-center justify-between">
            <span>Successfully recovered</span>
            <span className="text-emerald-400 font-bold">100% Verified</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content Grid: Active Items & Community Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Cases & Claims */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Your Cases & Claims</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Current status of items you have reported or claimed.
              </p>
            </div>
            <Link
              to="/my-cases"
              className="text-xs text-neutral-300 hover:text-white font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : myItems.length === 0 && myClaims.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#12151D] border border-white/[0.07] text-center">
              <FolderOpen className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No active cases or claims</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Have you misplaced an item or found something on campus? Report it to start the recovery workflow.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  to="/report"
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Report Item
                </Link>
                <Link
                  to="/search"
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08] text-xs font-semibold rounded-xl transition-all"
                >
                  Browse Vault
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myItems.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="p-4 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] hover:bg-[#151923] transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={resolveImageUrl(item.images[0])}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Layers className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-neutral-500">#{item.caseId}</span>
                        <ItemTypeBadge type={item.type} />
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-neutral-200 transition-colors mt-0.5">
                        {item.itemName}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span>{item.foundLocation || item.lastKnownLocation || 'Campus'}</span>
                        <span className="text-neutral-600">•</span>
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <ItemStatusBadge status={item.status} />
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* AI Match Radar Highlights */}
          {possibleMatches.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-display font-bold text-white">
                    Automated Match Opportunities ({possibleMatches.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">High Confidence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {possibleMatches.slice(0, 2).map((match) => (
                  <div
                    key={match.id}
                    className="p-4 rounded-2xl bg-[#141824] border border-amber-500/20 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {Math.round(match.score * 100)}% Match
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {formatRelativeTime(match.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Potential match with case #{match.foundItemId.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                      Algorithmic correlation across location, category, and report attributes.
                    </p>
                    <div className="mt-3">
                      <Link
                        to={`/items/${match.foundItemId}`}
                        className="text-xs font-semibold text-white hover:underline inline-flex items-center gap-1"
                      >
                        Inspect match candidate <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Recent Community Feed Preview & Quick Links */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Recent Discoveries</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Found items awaiting rightful owners.</p>
            </div>
            <Link
              to="/feed"
              className="text-xs text-neutral-300 hover:text-white font-medium flex items-center space-x-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <CardSkeleton />
            ) : recentFeed.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12151D] border border-white/[0.07] text-center text-xs text-neutral-400">
                No public items published yet.
              </div>
            ) : (
              recentFeed.map((item) => (
                <Link
                  key={item.caseId}
                  to={`/items/${item.caseId}`}
                  className="p-3.5 rounded-2xl bg-[#12151D] border border-white/[0.07] hover:border-white/[0.14] hover:bg-[#151923] transition-all flex items-center space-x-3 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={resolveImageUrl(item.images[0])}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Compass className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <CategoryBadge category={item.category} />
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-neutral-200 transition-colors mt-1">
                      {item.itemName}
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {item.foundLocation || item.lastKnownLocation || 'Campus Grounds'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              ))
            )}
          </div>

          {/* Quick Help & Custody Hours Card */}
          <div className="p-5 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-3">
            <div className="flex items-center space-x-2 text-white text-xs font-semibold">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span>Campus Custody Desk</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Items stored in the CIRS vault require a valid digital redemption token and your verified student/faculty ID for physical release.
            </p>
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>HOURS: 09:00 - 18:00</span>
              <span className="text-emerald-400 font-semibold">DESK ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
