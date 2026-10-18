import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, CheckCircle, XCircle, ArrowRight, ExternalLink, Search, RefreshCw } from 'lucide-react';
import { matchingService } from '../../services/matchingService';
import { adminService } from '../../services/adminService';
import { Match } from '../../types/matching';
import { MatchStatus } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import { DEMO_MATCHES } from '../../services/demoFixtures';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Match Reviews</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review automated multi-attribute matches between lost and found items computed by the matching engine.
          </p>
        </div>

        {/* Quick Case ID Lookup */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Look up Case ID (e.g. CIRS-2026-0001)"
              value={searchCaseId}
              onChange={(e) => setSearchCaseId(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Find
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchCaseId('');
              fetchMatches('');
            }}
            title="Refresh All"
            className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Evaluating candidate matches from CIRS engine...</div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No candidate matches found"
          description="The matching engine will surface high-confidence match candidates here when corresponding lost and found items are detected."
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-subtle space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-800">
                    {(m.score * 100).toFixed(0)}% Similarity Score
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      m.status === MatchStatus.CONFIRMED
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.status === MatchStatus.DISMISSED
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Detected on {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Items Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Lost Item */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-rose-700 text-[10px]">
                    Reported Lost Item
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{m.lostItem?.itemName}</h4>
                  <p className="text-slate-600 line-clamp-2">{m.lostItem?.description}</p>
                  <div className="pt-2 flex justify-between items-center text-slate-500 text-[11px]">
                    <span className="font-mono">{m.lostItem?.caseId}</span>
                    <Link
                      to={`/items/${m.lostItem?.caseId}`}
                      className="text-primary-600 hover:underline flex items-center font-medium"
                    >
                      View Report <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Found Item */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-700 text-[10px]">
                    Reported Found Item
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{m.foundItem?.itemName}</h4>
                  <p className="text-slate-600 line-clamp-2">{m.foundItem?.description}</p>
                  <div className="pt-2 flex justify-between items-center text-slate-500 text-[11px]">
                    <span className="font-mono">{m.foundItem?.caseId}</span>
                    <Link
                      to={`/items/${m.foundItem?.caseId}`}
                      className="text-primary-600 hover:underline flex items-center font-medium"
                    >
                      View Report <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending Matches */}
              {m.status === MatchStatus.SUGGESTED && (
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleDismiss(m.id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1.5 text-slate-400" />
                    Dismiss Match
                  </button>
                  <button
                    onClick={() => handleConfirm(m.id)}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Confirm Match
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
