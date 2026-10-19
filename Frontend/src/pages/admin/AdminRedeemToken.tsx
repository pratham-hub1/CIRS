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
      // Filter for claims that have a collectionToken and haven't been used yet
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
        success('Collection token verified & redeemed! Custody safely transferred.');
        setLastRedemptionResult({
          claimId: selectedClaimId,
          itemId: res.itemId,
          code: cleanCode,
          timestamp: new Date().toLocaleTimeString(),
        });
        setCollectionCode('');
        // Refresh approved claims list
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
    <FadeIn className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 flex items-center">
              <KeyRound className="w-3 h-3 mr-1 text-brand-600" />
              Handover Clearance Terminal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Token Redemption Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal">
            Validate single-use student collection vouchers and securely log physical custody release.
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

      {/* Handover protocol instructions alert */}
      <div className="p-4 sm:p-5 bg-brand-50/70 border border-brand-200/80 rounded-2xl flex items-start gap-3.5 shadow-subtle">
        <ShieldCheck className="w-5 h-5 text-brand-700 mt-0.5 shrink-0" />
        <div className="text-xs text-brand-950 space-y-1">
          <p className="font-bold text-sm text-brand-900">Security Officer Physical Handover Protocol:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-brand-800 font-medium">
            <li>Examine the claimant's university ID card (Student / Faculty ID).</li>
            <li>Confirm that the claimant identity corresponds to the verified case record.</li>
            <li>Request the 6-character voucher code from the claimant's CIRS screen.</li>
            <li>Enter the voucher code below to invalidate the token and complete university custody transfer.</li>
          </ol>
        </div>
      </div>

      {/* Success banner if just redeemed */}
      {lastRedemptionResult && (
        <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950 text-sm">Custody Transfer Recorded Successfully</p>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                Voucher <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">{lastRedemptionResult.code}</code> for Claim <span className="font-mono font-bold">{lastRedemptionResult.claimId}</span> was redeemed at {lastRedemptionResult.timestamp}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastRedemptionResult(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Form: Code Redemption Input */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-4 h-4 text-brand-600" />
            Redeem Voucher &amp; Authorize Release
          </h2>

          <form onSubmit={handleRedeem} className="space-y-5">
            {/* Claim Selection */}
            <div>
              <label htmlFor="claim-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Approved Claim <span className="text-rose-500">*</span>
              </label>
              {approvedClaims.length === 0 && !isLoadingClaims && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  No claims currently marked as APPROVED awaiting collection. You can also manually paste a Claim ID below.
                </div>
              )}

              <div className="space-y-2">
                <select
                  id="claim-select"
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                >
                  <option value="">-- Select from approved claims queue --</option>
                  {approvedClaims.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.item?.itemName || `Item ${c.itemId}`} — Claimant: {c.claimant?.name || c.claimantId} (Case #{c.item?.caseId || c.itemId})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Or enter Claim ID:</span>
                  <input
                    type="text"
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    placeholder="e.g. claim-001 or UUID"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Collection Code */}
            <div>
              <label htmlFor="collection-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Single-Use Collection Code <span className="text-rose-500">*</span>
              </label>
              <input
                id="collection-code"
                type="text"
                required
                value={collectionCode}
                onChange={(e) => setCollectionCode(e.target.value)}
                placeholder="e.g. 6-digit code from student app"
                className="w-full px-4 py-3 text-lg sm:text-xl font-mono tracking-widest uppercase bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-extrabold transition-all"
              />
              <p className="mt-1.5 text-[11px] text-slate-400 font-normal">
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
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-4 h-4 text-brand-600" />
              Dossier Snapshot
            </h2>

            {selectedClaim ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Item In Custody
                    </span>
                    <ClaimStatusBadge status={selectedClaim.status} size="sm" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {selectedClaim.item?.itemName || `Item #${selectedClaim.itemId}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Case: {selectedClaim.item?.caseId || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block mb-0.5">
                      Claimant
                    </span>
                    <span className="font-bold text-slate-900 block truncate">
                      {selectedClaim.claimant?.name || selectedClaim.claimantId}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {selectedClaim.claimant?.email || 'Student Email'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block mb-0.5">
                      Verification
                    </span>
                    <VerificationLevelBadge level={selectedClaim.verificationLevel} />
                  </div>
                </div>

                {selectedClaim.item?.storageLocation && (
                  <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200/60 flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-brand-900">Physical Storage Vault:</span>
                      <p className="text-brand-800 font-medium">{selectedClaim.item.storageLocation.name}</p>
                      <p className="text-[11px] text-brand-600">GSFC University Security Depot</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Select a claim to preview validation details before token entry.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between font-medium">
            <span>GSFC Security Office</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Station
            </span>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
