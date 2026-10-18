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
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { claimsService } from '../../services/claimsService';
import { Claim } from '../../types/claim';
import { ClaimStatus } from '../../types/enums';
import { ClaimStatusBadge, VerificationLevelBadge } from '../../components/common/Badge';
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
        (c) => c.collectionToken && !c.collectionToken.usedAt
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
      error('Please enter the student\'s collection code');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await claimsService.redeemToken(selectedClaimId, cleanCode);
      if (res.redeemed) {
        success('Collection token verified & redeemed! Item marked as handed over.');
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
      error(err.message || 'Invalid or expired collection code. Please check student credentials.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const selectedClaim = approvedClaims.find((c) => c.id === selectedClaimId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Handover Desk &amp; Token Redemption
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Validate student collection codes and securely log physical custody handovers at campus security desks.
          </p>
        </div>
        <button
          onClick={fetchApprovedClaims}
          disabled={isLoadingClaims}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingClaims ? 'animate-spin' : ''}`} />
          Refresh Claims
        </button>
      </div>

      {/* Handover protocol instructions alert */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Security Handover Checklist:</p>
          <ol className="list-decimal list-inside mt-1 space-y-0.5 text-blue-800">
            <li>Verify claimant identity using their official GSFC University Student/Staff ID card.</li>
            <li>Match the claimant's full name and student ID against the approved claim details below.</li>
            <li>Obtain their single-use 6-character collection token from their CIRS claim view.</li>
            <li>Enter the token to register the custody transition. Invalidate and archive once handed over.</li>
          </ol>
        </div>
      </div>

      {/* Success banner if just redeemed */}
      {lastRedemptionResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-950">Handover Registered Successfully</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Token <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">{lastRedemptionResult.code}</code> for Claim <span className="font-mono">{lastRedemptionResult.claimId}</span> was redeemed at {lastRedemptionResult.timestamp}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastRedemptionResult(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Code Redemption Input */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary-600" />
            Redeem Collection Code
          </h2>

          <form onSubmit={handleRedeem} className="space-y-5">
            {/* Claim Selection */}
            <div>
              <label htmlFor="claim-select" className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Approved Claim Awaiting Collection <span className="text-red-500">*</span>
              </label>
              {approvedClaims.length === 0 && !isLoadingClaims ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  No claims currently marked as APPROVED awaiting collection token redemption. You can still manually type a Claim ID below.
                </div>
              ) : null}

              <div className="space-y-2">
                <select
                  id="claim-select"
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                >
                  <option value="">-- Choose from active approved claims --</option>
                  {approvedClaims.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.item?.itemName || `Item ${c.itemId}`} — Claimant: {c.claimant?.name || c.claimantId} (Case #{c.item?.caseId || c.itemId})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">or manual Claim ID:</span>
                  <input
                    type="text"
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    placeholder="e.g. claim-001 or UUID"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Collection Code */}
            <div>
              <label htmlFor="collection-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                Single-Use Collection Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="collection-code"
                  type="text"
                  required
                  value={collectionCode}
                  onChange={(e) => setCollectionCode(e.target.value)}
                  placeholder="e.g. COLL-9382 or 6-digit PIN"
                  className="w-full px-4 py-3 text-lg font-mono tracking-widest uppercase bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Provided by claimant directly on their approved claim confirmation screen.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRedeeming || !selectedClaimId || !collectionCode.trim()}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {isRedeeming ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verifying &amp; Invalidation Token...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Verify &amp; Complete Handover
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Info: Selected Claim Overview */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" />
              Claim Verification Details
            </h2>

            {selectedClaim ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</span>
                    <ClaimStatusBadge status={selectedClaim.status} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base">
                    {selectedClaim.item?.itemName || `Item #${selectedClaim.itemId}`}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Case ID: {selectedClaim.item?.caseId || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block mb-0.5">Claimant</span>
                    <span className="font-semibold text-gray-900">
                      {selectedClaim.claimant?.name || selectedClaim.claimantId}
                    </span>
                    <span className="text-gray-500 block truncate">
                      {selectedClaim.claimant?.email || 'Student Email'}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block mb-0.5">Verification</span>
                    <VerificationLevelBadge level={selectedClaim.verificationLevel} />
                  </div>
                </div>

                {selectedClaim.item?.storageLocation && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-semibold text-blue-900">Physical Custody Location:</span>
                      <p className="text-blue-800">{selectedClaim.item.storageLocation.name}</p>
                      <p className="text-blue-600">GSFC University Campus</p>
                    </div>
                  </div>
                )}

                {selectedClaim.collectionToken && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                    <span className="font-semibold text-amber-900 block mb-1">Active Token Info:</span>
                    <p className="text-amber-800">
                      Expires: {new Date(selectedClaim.collectionToken.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select or enter a Claim ID to preview details before redemption.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <span>GSFC Security Desk</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> CIRS Audited
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
