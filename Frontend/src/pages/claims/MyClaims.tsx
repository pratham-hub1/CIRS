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
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      <FadeIn>
        <div className="pb-6 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              OWNERSHIP VERIFICATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              CLAIMS REGISTRY
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            My Claims Portfolio
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
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
          title="No claims registered"
          description="When you spot an article in the directory that matches your lost belonging, submit a claim to start the ownership verification process."
          actionLabel="Explore Community Feed"
          onAction={() => (window.location.href = '/feed')}
        />
      ) : (
        <StaggerContainer className="space-y-4">
          {claims.map((claim) => (
            <StaggerItem key={claim.id}>
              <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 hover:border-white/[0.14] hover:bg-[#151923] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} size="md" />
                    <VerificationLevelBadge level={claim.verificationLevel} />
                    {claim.item && <CategoryBadge category={claim.item.category} />}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-base group-hover:text-neutral-200 transition-colors">
                      {claim.item?.itemName || 'Claimed Belonging'}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5 font-mono">
                      <span>Case #{claim.item?.caseId || 'Pending ID'}</span>
                      <span>•</span>
                      <span>SUBMITTED {formatRelativeTime(claim.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-2 max-w-2xl leading-relaxed">
                    {claim.description}
                  </p>

                  {/* Status-specific alert banner */}
                  {claim.status === ClaimStatus.INFO_REQUESTED && (
                    <div className="flex items-center text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-400" />
                      <span>Security officers requested answers to verification questions. Click inspect to respond.</span>
                    </div>
                  )}

                  {claim.status === ClaimStatus.APPROVED && claim.collectionToken && (
                    <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center">
                        <KeyRound className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                        <span className="font-medium">Ready For Collection — Voucher Pass Token:</span>
                      </div>
                      <span className="font-mono font-bold text-sm tracking-widest text-emerald-300 bg-black/40 px-3 py-1 rounded-lg border border-emerald-500/30 ml-2">
                        {claim.collectionToken.code}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06] flex-shrink-0">
                  <Link
                    to={`/claims/${claim.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.12] transition-all"
                  >
                    <span>Inspect Claim</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
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
