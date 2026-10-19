import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, AlertCircle, KeyRound, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { claimsService } from '../../services/claimsService';
import { Claim } from '../../types/claim';
import { ClaimStatus } from '../../types/enums';
import { ClaimStatusBadge, VerificationLevelBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';
import { formatRelativeTime } from '../../lib/utils';

export const MyClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      try {
        const data = await claimsService.getMyClaims();
        setClaims(data || []);
      } catch (err) {
        console.error('Error fetching claims:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClaims();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <FadeIn>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
              Verification Portfolio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Ownership Claims
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Track verification progress, provide supplemental evidence requested by security staff, and retrieve authorized collection tokens.
          </p>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No claims submitted yet"
          description="When you spot an item in the community feed that matches your lost belonging, submit a claim to start the verification process."
          actionLabel="Explore Community Feed"
          onAction={() => (window.location.href = '/feed')}
        />
      ) : (
        <StaggerContainer className="space-y-4">
          {claims.map((claim) => (
            <StaggerItem key={claim.id}>
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-subtle hover:shadow-elevated transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} size="md" />
                    <VerificationLevelBadge level={claim.verificationLevel} />
                    {claim.item && <CategoryBadge category={claim.item.category} />}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                      {claim.item?.itemName || 'Claimed Belonging'}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 font-medium">
                      <span className="font-mono">Case: {claim.item?.caseId || 'Pending ID'}</span>
                      <span>•</span>
                      <span>Submitted {formatRelativeTime(claim.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl leading-relaxed font-normal">
                    {claim.description}
                  </p>

                  {/* Status-specific alert banner */}
                  {claim.status === ClaimStatus.INFO_REQUESTED && (
                    <div className="flex items-center text-xs font-bold text-purple-800 bg-purple-50 p-3 rounded-xl border border-purple-200 shadow-subtle">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 animate-pulse" />
                      <span>Security officers requested answers to verification questions. Click details to respond.</span>
                    </div>
                  )}

                  {claim.status === ClaimStatus.APPROVED && claim.collectionToken && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 rounded-xl border border-emerald-200 shadow-subtle">
                      <div className="flex items-center">
                        <KeyRound className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
                        <span>Ready For Collection — Voucher Code:</span>
                      </div>
                      <span className="font-mono font-extrabold text-sm tracking-widest text-emerald-950 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-sm ml-2">
                        {claim.collectionToken.code}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                  <Link
                    to={`/claims/${claim.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-brand-700 bg-brand-50/80 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors shadow-subtle group-hover:border-brand-300"
                  >
                    <span>Inspect Claim</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-transform" />
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
