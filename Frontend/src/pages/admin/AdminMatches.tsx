import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, CheckCircle, XCircle, ExternalLink, Search, RefreshCw, Sparkles } from 'lucide-react';
import { matchingService } from '../../services/matchingService';
import { adminService } from '../../services/adminService';
import { Match } from '../../types/matching';
import { MatchStatus } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { PageTransition } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import { DEMO_MATCHES } from '../../services/demoFixtures';
import { celebrateConfetti } from '../../lib/confetti';

export const AdminMatches: React.FC = () => {
  const { success, error } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCaseId, setSearchCaseId] = useState('');

  const fetchMatches = async (targetCaseId?: string) => {
    setIsLoading(true);
    try {
      if (apiClient.isDemoMode()) {
        setMatches(DEMO_MATCHES);
        return;
      }

      const caseIdToQuery = targetCaseId ?? searchCaseId.trim();

      if (caseIdToQuery) {
        const itemMatches = await matchingService.getCandidateMatches(caseIdToQuery);
        setMatches(itemMatches || []);
        return;
      }

      // Query recent cases and discover their candidate matches
      const casesRes = await adminService.getItems({ limit: 10 });
      const candidateCases = (casesRes.items || []).filter(
        (i) => i.status === 'LOST_REPORTED' || i.status === 'FOUND',
      );

      const aggregated: Match[] = [];
      for (const item of candidateCases.slice(0, 5)) {
        try {
          const itemMatches = await matchingService.getCandidateMatches(item.caseId);
          if (itemMatches && itemMatches.length > 0) {
            aggregated.push(...itemMatches);
          }
        } catch {
          // ignore individual item match lookups
        }
      }
      setMatches(aggregated);
    } catch (err: any) {
      error(err.message || 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(searchCaseId.trim());
  };

  const handleConfirm = async (id: string) => {
    try {
      await matchingService.confirmMatch(id);
      celebrateConfetti();
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: MatchStatus.CONFIRMED } : m)),
      );
      success('Match confirmed. Reporters notified.');
    } catch (err: any) {
      error(err.message || 'Failed to confirm match');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await matchingService.dismissMatch(id);
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: MatchStatus.DISMISSED } : m)),
      );
      success('Match dismissed');
    } catch (err: any) {
      error(err.message || 'Failed to dismiss match');
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06] flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-neutral-400" />
              Automated Match Radar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
            Candidate Match Reviews
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Review multi-attribute correlation matches between lost and found items computed by the matching engine.
          </p>
        </div>

        {/* Quick Case ID Lookup */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Case ID (e.g. CIRS-2026-0001)"
              value={searchCaseId}
              onChange={(e) => setSearchCaseId(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-[#12151D] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 font-mono w-60"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="py-2 px-3 text-xs"
          >
            Scan
          </Button>
          <button
            type="button"
            onClick={() => {
              setSearchCaseId('');
              fetchMatches('');
            }}
            title="Refresh All"
            className="p-2 border border-white/[0.08] bg-[#12151D] rounded-xl hover:bg-white/[0.06] text-neutral-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs font-mono text-neutral-500">
          Evaluating candidate matches from matching engine...
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No candidate matches found"
          description="The matching engine surfaces candidate correlations here when high similarity between lost and found reports is detected."
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-medium bg-white/[0.06] text-white border border-white/[0.1]">
                    {(m.score * 100).toFixed(0)}% Match Score
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${
                      m.status === MatchStatus.CONFIRMED
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : m.status === MatchStatus.DISMISSED
                        ? 'bg-white/[0.04] text-neutral-400 border border-white/[0.06]'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Detected {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Items Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Lost Item */}
                <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium uppercase tracking-wider text-rose-300 text-[10px] font-mono">
                      Reported Lost Item
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px]">{m.lostItem?.caseId}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">{m.lostItem?.itemName}</h4>
                  <p className="text-neutral-400 line-clamp-2">{m.lostItem?.description}</p>
                  <div className="pt-2 flex justify-end items-center">
                    <Link
                      to={`/items/${m.lostItem?.caseId}`}
                      className="text-neutral-300 hover:text-white flex items-center font-medium text-[11px]"
                    >
                      View Dossier <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Found Item */}
                <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium uppercase tracking-wider text-emerald-300 text-[10px] font-mono">
                      Reported Found Item
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px]">{m.foundItem?.caseId}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">{m.foundItem?.itemName}</h4>
                  <p className="text-neutral-400 line-clamp-2">{m.foundItem?.description}</p>
                  <div className="pt-2 flex justify-end items-center">
                    <Link
                      to={`/items/${m.foundItem?.caseId}`}
                      className="text-neutral-300 hover:text-white flex items-center font-medium text-[11px]"
                    >
                      View Dossier <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending Matches */}
              {m.status === MatchStatus.SUGGESTED && (
                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(m.id)}
                    className="inline-flex items-center text-xs"
                  >
                    <XCircle className="w-4 h-4 mr-1.5 text-neutral-400" />
                    Dismiss Match
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleConfirm(m.id)}
                    className="inline-flex items-center text-xs"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Confirm Match
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};
