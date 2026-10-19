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
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { AdminAnalyticsData } from '../../types/admin';
import { ItemCategory, ItemStatus, CATEGORY_LABELS, STATUS_LABELS } from '../../types/enums';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StaggerContainer, StaggerItem, FadeIn } from '../../components/common/AnimatedTransitions';

const PIE_COLORS = [
  '#0284c7', // brand blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#64748b', // slate
  '#06b6d4', // cyan
  '#ec4899', // pink
];

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
        <LoadingSpinner size="lg" label="Computing real-time security analytics..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-subtle max-w-md mx-auto">
        <Shield className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Analytics Feed Offline</h3>
        <p className="text-xs text-slate-500 mt-1">
          Could not retrieve operational analytics from the CIRS server. Verify your staff authorization and connection.
        </p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-subtle transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const metrics = data?.metrics;

  // Format data for Recharts Bar Chart (Category Breakdown)
  const categoryChartData = Object.entries(data?.categoryBreakdown || {}).map(([cat, count]) => ({
    name: CATEGORY_LABELS[cat as ItemCategory] || cat,
    count: count as number,
  }));

  // Format data for Recharts Pie Chart (Status Breakdown)
  const statusChartData = Object.entries(data?.statusBreakdown || {}).map(([status, count]) => ({
    name: STATUS_LABELS[status as ItemStatus] || status,
    value: count as number,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Date Filter */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 flex items-center">
                <Shield className="w-3 h-3 mr-1 text-brand-600" />
                Security Command Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Operational Analytics & Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal">
              Direct telemetry from GSFC University central lost & found repositories and security lockers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded-2xl border border-slate-200/90 shadow-subtle self-start sm:self-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium"
              title="Start date"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium"
              title="End date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-elevated transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Recorded Cases
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metrics?.totalReported || 0}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-[11px] text-slate-400 font-medium">
              <span>{metrics?.totalLost || 0} Lost</span>
              <span className="mx-1.5">•</span>
              <span>{metrics?.totalFound || 0} In Custody</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-elevated transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recovery Clearance Rate
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {metrics?.recoveryRate || 0}%
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-[11px] text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>{metrics?.totalReturned || 0} items safely returned</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-elevated transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Claims
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-purple-600 tracking-tight">
                {metrics?.pendingClaims || 0}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-[11px] text-purple-600 font-semibold">
              <span>Awaiting staff adjudication</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-elevated transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Security Holds
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-brand-600 tracking-tight">
                {metrics?.activeHolds || 0}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-[11px] text-brand-600 font-semibold">
              <span>Ready for voucher redemption</span>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Visual Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Category Breakdown Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
              <Tag className="w-4 h-4 mr-2 text-brand-600" />
              Item Category Volume
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Real-time counts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
              <Layers className="w-4 h-4 mr-2 text-brand-600" />
              Lifecycle Status Distribution
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Pipeline proportions</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-slate-400">No status data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-[11px] text-slate-600 font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Campus Hotspots */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-subtle space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-brand-600" />
            Campus Incident Hotspots
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic concentration of reported losses and recoveries across university grounds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Found Hotspots */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 uppercase tracking-wider block text-[11px]">
                Top Recovery Locations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Found
              </span>
            </div>
            {data?.hotspots.found.length === 0 ? (
              <p className="text-slate-400 py-3">No recovery hotspot data logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data?.hotspots.found.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100 text-slate-800 shadow-subtle"
                  >
                    <span className="font-semibold truncate mr-2">{h.location}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono">
                      {h.count} items
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lost Hotspots */}
          <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-950 uppercase tracking-wider block text-[11px]">
                Top Loss Locations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                Lost
              </span>
            </div>
            {data?.hotspots.lost.length === 0 ? (
              <p className="text-slate-400 py-3">No loss hotspot data logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data?.hotspots.lost.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-rose-100 text-slate-800 shadow-subtle"
                  >
                    <span className="font-semibold truncate mr-2">{h.location}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold font-mono">
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
