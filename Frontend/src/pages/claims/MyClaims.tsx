import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { claimsService } from '../../services/claimsService';
import { Claim } from '../../types/claim';
import { ClaimStatus } from '../../types/enums';
import { ClaimStatusBadge, VerificationLevelBadge, CategoryBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSpinner';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Ownership Claims
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track the status of your claims, answer security verification questions, and retrieve collection tokens.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No claims submitted yet"
          description="When you spot an item in the community feed that belongs to you, submit a claim to begin verification."
          actionLabel="Browse Community Feed"
          onAction={() => (window.location.href = '/feed')}
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-subtle hover:shadow-elevated transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ClaimStatusBadge status={claim.status} size="md" />
                  <VerificationLevelBadge level={claim.verificationLevel} />
                  {claim.item && <CategoryBadge category={claim.item.category} />}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {claim.item?.itemName || 'Claimed Belonging'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Case: {claim.item?.caseId || 'Pending ID'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                  {claim.description}
                </p>

                {/* Status-specific alert banner */}
                {claim.status === ClaimStatus.INFO_REQUESTED && (
                  <div className="flex items-center text-xs font-semibold text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600" />
                    <span>Campus security requested additional verification answers. Please respond.</span>
                  </div>
                )}

                {claim.status === ClaimStatus.APPROVED && claim.collectionToken && (
                  <div className="flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <KeyRound className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600" />
                    <span>
                      Collection Code:{' '}
                      <strong className="font-mono text-sm tracking-wider text-emerald-950 ml-1">
                        {claim.collectionToken.code}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                <Link
                  to={`/claims/${claim.id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  View Details & Actions <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
