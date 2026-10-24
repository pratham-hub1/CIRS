import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Package,
  Calendar,
  Building,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { claimsService } from '../../services/claimsService';
import { Claim } from '../../types/claim';
import { ClaimStatus } from '../../types/enums';
import { ClaimStatusBadge, VerificationLevelBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { celebrateConfetti } from '../../lib/confetti';

export const AdminRedeemToken: React.FC = () => {
  const { success, error } = useToast();
  const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  // Form inputs
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [collectionCode, setCollectionCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [lastRedemptionResult, setLastRedemptionResult] = useState<{
    claimId: string;
    itemId: string;
    code: string;
    timestamp: string;
  } | null>(null);

  const fetchApprovedClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const claims = await adminService.getClaims(ClaimStatus.APPROVED);
      const pendingRedemption = claims.filter(
        (c) => c.collectionToken && !c.collectionToken.usedAt,
      );
      setApprovedClaims(pendingRedemption);
      if (pendingRedemption.length > 0 && !selectedClaimId) {
        setSelectedClaimId(pendingRedemption[0].id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch pending collection claims');
    } finally {
      setIsLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchApprovedClaims();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) {
      error('Please select or specify a Claim ID');
      return;
    }
    const cleanCode = collectionCode.trim().toUpperCase();
    if (!cleanCode) {
      error("Please enter the student's collection code");
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await claimsService.redeemToken(selectedClaimId, cleanCode);
      if (res.redeemed) {
        celebrateConfetti();
        success('Collection token verified & redeemed! Custody safely transferred.');
        setLastRedemptionResult({
          claimId: selectedClaimId,
          itemId: res.itemId,
          code: cleanCode,
          timestamp: new Date().toLocaleTimeString(),
        });
        setCollectionCode('');
        fetchApprovedClaims();
      }
    } catch (err: any) {
      error(err.message || 'Invalid or expired collection code. Please check credentials.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const selectedClaim = approvedClaims.find((c) => c.id === selectedClaimId);

  return (
    <FadeIn className="space-y-8 max-w-5xl mx-auto text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              SECURITY DESK TERMINAL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              CUSTODY RELEASE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Token Redemption Desk
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Validate single-use student collection vouchers and authorize physical custody release.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchApprovedClaims}
          isLoading={isLoadingClaims}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Registry
        </Button>
      </div>

      {/* Protocol instructions alert */}
      <div className="p-5 bg-[#12151D] border border-white/[0.07] rounded-2xl flex items-start gap-4">
        <ShieldCheck className="w-5 h-5 text-neutral-300 mt-0.5 shrink-0" />
        <div className="text-xs text-neutral-300 space-y-1">
          <p className="font-semibold text-white">Security Officer Physical Handover Protocol:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-neutral-400 text-xs">
            <li>Examine claimant's university ID card (Student / Faculty ID).</li>
            <li>Confirm claimant identity corresponds to the verified case record.</li>
            <li>Request the 6-character voucher code from the claimant's CIRS screen.</li>
            <li>Enter voucher code below to invalidate the token and log university custody transfer.</li>
          </ol>
        </div>
      </div>

      {/* Success banner if just redeemed */}
      {lastRedemptionResult && (
        <div className="p-4 sm:p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">Custody Transfer Recorded Successfully</p>
              <p className="text-xs text-emerald-300 mt-0.5 font-mono">
                Voucher <code className="font-bold bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">{lastRedemptionResult.code}</code> was redeemed at {lastRedemptionResult.timestamp}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastRedemptionResult(null)}
            className="text-xs font-semibold text-emerald-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Code Redemption Input */}
        <div className="lg:col-span-7 bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <KeyRound className="w-4 h-4 text-neutral-400" />
            Redeem Voucher &amp; Authorize Release
          </h2>

          <form onSubmit={handleRedeem} className="space-y-5">
            {/* Claim Selection */}
            <div>
              <label htmlFor="claim-select" className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Target Approved Claim <span className="text-rose-400">*</span>
              </label>
              {approvedClaims.length === 0 && !isLoadingClaims && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  No claims currently marked as APPROVED awaiting collection. You can also manually paste a Claim ID below.
                </div>
              )}

              <div className="space-y-2">
                <select
                  id="claim-select"
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white font-mono text-white"
                >
                  <option value="" className="bg-[#12151D]">-- Select from approved claims queue --</option>
                  {approvedClaims.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#12151D]">
                      {c.item?.itemName || `Item ${c.itemId}`} — Claimant: {c.claimant?.name || c.claimantId} (Case #{c.item?.caseId || c.itemId})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-mono">Or enter Claim ID:</span>
                  <input
                    type="text"
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    placeholder="e.g. claim-001 or UUID"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>
            </div>

            {/* Collection Code */}
            <div>
              <label htmlFor="collection-code" className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Single-Use Collection Code <span className="text-rose-400">*</span>
              </label>
              <input
                id="collection-code"
                type="text"
                required
                value={collectionCode}
                onChange={(e) => setCollectionCode(e.target.value)}
                placeholder="ENTER 6-DIGIT VOUCHER CODE"
                className="w-full px-4 py-3 text-lg sm:text-xl font-mono tracking-widest uppercase bg-neutral-900 border border-white/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-white font-bold text-white text-center transition-all"
              />
              <p className="mt-1.5 text-[11px] text-neutral-500 font-mono">
                Displayed exclusively inside the claimant's CIRS approved voucher pass.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isRedeeming}
              disabled={!selectedClaimId || !collectionCode.trim()}
              className="w-full py-3"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verify &amp; Finalize Custody Handover
            </Button>
          </form>
        </div>

        {/* Right Info: Selected Claim Overview */}
        <div className="lg:col-span-5 bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Package className="w-4 h-4 text-neutral-400" />
              Dossier Snapshot
            </h2>

            {selectedClaim ? (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-900 rounded-xl border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      Item In Custody
                    </span>
                    <ClaimStatusBadge status={selectedClaim.status} size="sm" />
                  </div>
                  <h3 className="font-semibold text-white text-base">
                    {selectedClaim.item?.itemName || `Item #${selectedClaim.itemId}`}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Case #{selectedClaim.item?.caseId || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-900 rounded-xl border border-white/[0.06]">
                    <span className="text-neutral-500 text-[10px] uppercase block mb-0.5 font-mono">
                      Claimant
                    </span>
                    <span className="font-semibold text-white block truncate">
                      {selectedClaim.claimant?.name || selectedClaim.claimantId}
                    </span>
                    <span className="text-[11px] text-neutral-400 block truncate font-mono">
                      {selectedClaim.claimant?.email || 'Student Email'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-white/[0.06]">
                    <span className="text-neutral-500 text-[10px] uppercase block mb-0.5 font-mono">
                      Verification
                    </span>
                    <VerificationLevelBadge level={selectedClaim.verificationLevel} />
                  </div>
                </div>

                {selectedClaim.item?.storageLocation && (
                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-white/[0.06] flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-semibold text-white">Physical Storage Vault:</span>
                      <p className="text-neutral-300 font-medium">{selectedClaim.item.storageLocation.name}</p>
                      <p className="text-[11px] text-neutral-500">GSFC University Security Depot</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500 font-mono">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-500" />
                <p className="text-xs">Select a claim to preview validation details before token entry.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-neutral-400 flex items-center justify-between font-mono">
            <span>GSFC Security Office</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Station
            </span>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
