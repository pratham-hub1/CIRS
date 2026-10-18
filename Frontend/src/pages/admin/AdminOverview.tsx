import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  FolderOpen,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AdminAnalyticsData } from '../../types/admin';
import { ItemCategory, ItemStatus, CATEGORY_LABELS, STATUS_LABELS } from '../../types/enums';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  if (isLoading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Computing operational analytics..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-xl text-center">
        <Shield className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Analytics Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Could not retrieve operational analytics from the CIRS server. Please verify your network connection and credentials.
        </p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Shield className="w-6 h-6 mr-2 text-brand-600" />
            Security & Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time recovery metrics and campus storage statistics calculated directly from source data.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            title="Start date"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            title="End date"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-brand-600 hover:underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Cases
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.totalReported || 0}</span>
            <span className="text-xs text-slate-400">
              ({metrics?.totalLost || 0} Lost / {metrics?.totalFound || 0} Found)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recovery Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-600">
              {metrics?.recoveryRate || 0}%
            </span>
            <span className="text-xs text-slate-400">({metrics?.totalReturned || 0} Returned)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Claims
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-extrabold text-purple-600">{metrics?.pendingClaims || 0}</span>
            <span className="text-xs text-slate-400">Awaiting verification</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Item Holds
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-extrabold text-brand-600">{metrics?.activeHolds || 0}</span>
            <span className="text-xs text-slate-400">Approved for collection</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <Tag className="w-4 h-4 mr-2 text-brand-600" />
            Cases by Item Category
          </h3>

          <div className="space-y-2.5">
            {Object.entries(data?.categoryBreakdown || {}).map(([cat, count]) => {
              const total = metrics?.totalReported || 1;
              const pct = ((count as number) / total) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{CATEGORY_LABELS[cat as ItemCategory] || cat}</span>
                    <span className="text-slate-400 font-mono">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <Layers className="w-4 h-4 mr-2 text-brand-600" />
            Lifecycle Status Distribution
          </h3>

          <div className="space-y-2.5">
            {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => {
              const total = metrics?.totalReported || 1;
              const pct = ((count as number) / total) * 100;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{STATUS_LABELS[status as ItemStatus] || status}</span>
                    <span className="text-slate-400 font-mono">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Campus Hotspots */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-brand-600" />
          Campus Incident Hotspots
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Found Hotspots */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
              Top Found Locations
            </span>
            {data?.hotspots.found.length === 0 ? (
              <p className="text-slate-400">No hotspot data available yet.</p>
            ) : (
              <div className="space-y-2">
                {data?.hotspots.found.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="font-medium truncate mr-2">{h.location}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                      {h.count} items
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lost Hotspots */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
              Top Lost Locations
            </span>
            {data?.hotspots.lost.length === 0 ? (
              <p className="text-slate-400">No hotspot data available yet.</p>
            ) : (
              <div className="space-y-2">
                {data?.hotspots.lost.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="font-medium truncate mr-2">{h.location}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                      {h.count} items
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
