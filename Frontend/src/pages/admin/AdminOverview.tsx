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
  Activity,
  ArrowUpRight,
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
  '#FFFFFF', // White
  '#94A3B8', // Slate
  '#38BDF8', // Sky
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F87171', // Rose
  '#A78BFA', // Purple
  '#64748B', // Neutral
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
        <LoadingSpinner size="lg" label="Retrieving campus operations telemetry..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-[#12151D] border border-white/[0.07] rounded-2xl text-center max-w-md mx-auto text-white">
        <Shield className="w-10 h-10 text-neutral-500 mb-3" />
        <h3 className="text-base font-semibold">Analytics Unavailable</h3>
        <p className="text-xs text-neutral-400 mt-1">
          Could not retrieve operational analytics. Verify your administrator authorization.
        </p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const metrics = data?.metrics;

  const categoryChartData = Object.entries(data?.categoryBreakdown || {}).map(([cat, count]) => ({
    name: CATEGORY_LABELS[cat as ItemCategory] || cat,
    count: count as number,
  }));

  const statusChartData = Object.entries(data?.statusBreakdown || {}).map(([status, count]) => ({
    name: STATUS_LABELS[status as ItemStatus] || status,
    value: count as number,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      {/* Header with Date Filter */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                ADMINISTRATIVE COMMAND
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-neutral-400">
                CENTRAL HUB
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Operations &amp; Intelligence
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              Live telemetry from campus lost &amp; found repositories, claims queues, and custody lockers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs bg-[#12151D] p-2 rounded-xl border border-white/[0.07] self-start sm:self-auto">
            <span className="text-[11px] font-mono text-neutral-400 flex items-center pl-1">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
              RANGE:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-white/10 rounded-lg bg-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-white/40"
              title="Start date"
            />
            <span className="text-neutral-500 font-mono text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-white/10 rounded-lg bg-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-white/40"
              title="End date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-semibold text-neutral-300 hover:text-white px-2 py-1 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StaggerItem>
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Total Registered Cases
              </span>
              <Activity className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mt-3">
              {metrics?.totalReported || 0}
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center text-[11px] text-neutral-400 font-mono">
              <span className="text-rose-400">{metrics?.totalLost || 0} Lost</span>
              <span className="mx-1.5 text-neutral-600">•</span>
              <span className="text-emerald-400">{metrics?.totalFound || 0} In Custody</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Clearance Rate
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-emerald-400 tracking-tight mt-3">
              {metrics?.recoveryRate || 0}%
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center text-[11px] text-emerald-400 font-mono">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>{metrics?.totalReturned || 0} returned to owners</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Pending Claims
              </span>
              <ClipboardCheck className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mt-3">
              {metrics?.pendingClaims || 0}
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-neutral-400 font-mono">
              <span>Awaiting staff review</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Active Holds
              </span>
              <Shield className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mt-3">
              {metrics?.activeHolds || 0}
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-neutral-400 font-mono">
              <span>Ready for collection token</span>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Visual Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown Chart */}
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center">
              <Tag className="w-4 h-4 mr-2 text-neutral-400" />
              Item Category Volume
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Inventory Distribution</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
                  allowDecimals={false}
                  stroke="#334155"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#12151D',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#ffffff',
                  }}
                />
                <Bar dataKey="count" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center">
              <Layers className="w-4 h-4 mr-2 text-neutral-400" />
              Lifecycle Pipeline Distribution
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Pipeline Proportions</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono">No status data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="#0A0C10"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12151D',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#ffffff',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-[11px] text-neutral-400 font-mono">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Campus Hotspots */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
            Campus Incident Hotspots
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Geographic concentration of reported losses and recoveries across campus blocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Found Hotspots */}
          <div className="p-5 rounded-xl bg-neutral-900 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 uppercase text-[11px] font-mono">
                Top Recovery Locations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                Found
              </span>
            </div>
            {data?.hotspots.found.length === 0 ? (
              <p className="text-neutral-500 py-3 font-mono">No recovery hotspot data logged yet.</p>
            ) : (
              <div className="space-y-2">
                {data?.hotspots.found.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg border border-white/[0.04] text-neutral-300"
                  >
                    <span className="font-medium truncate mr-2">{h.location}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold font-mono">
                      {h.count} items
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lost Hotspots */}
          <div className="p-5 rounded-xl bg-neutral-900 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-400 uppercase text-[11px] font-mono">
                Top Loss Locations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300">
                Lost
              </span>
            </div>
            {data?.hotspots.lost.length === 0 ? (
              <p className="text-neutral-500 py-3 font-mono">No loss hotspot data logged yet.</p>
            ) : (
              <div className="space-y-2">
                {data?.hotspots.lost.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg border border-white/[0.04] text-neutral-300"
                  >
                    <span className="font-medium truncate mr-2">{h.location}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold font-mono">
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
