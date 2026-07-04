"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe,
  AlertTriangle,
  Lightbulb,
  Zap,
  Activity,
  CheckCircle,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useApiData } from "@/lib/useApiData";
import { API } from "@/lib/api-cache";
import { AnalyticsSkeleton } from "@/components/skeletons/TabSkeletons";

const RANGE_OPTIONS = [
  { id: "today", name: "Today" },
  { id: "7d", name: "Last 7 Days" },
  { id: "this_month", name: "This Month" },
  { id: "last_month", name: "Last Month" },
  { id: "3m", name: "Last 3 Months" },
  { id: "6m", name: "Last 6 Months" },
  { id: "this_year", name: "This Year" },
  { id: "last_year", name: "Last Year" },
  { id: "all", name: "All Time" }
];

const COUNTRY_NAME: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom",
  DE: "Germany", CA: "Canada", AU: "Australia"
};
const COUNTRY_COLOR: Record<string, string> = {
  IN: "#6366f1", US: "#0ea5e9", GB: "#8b5cf6",
  DE: "#10b981", CA: "#f59e0b", AU: "#ec4899"
};

interface AnalyticsData {
  summary: {
    totalAllTime: number;
    currentTotal: number;
    prevTotal: number;
    totalTrend: number;
    activeCount: number;
    activeRatio: number;
    prevActiveRatio: number;
    activeRatioTrend: number;
    convertedCount: number;
    totalRevenue: number;
    totalSeats: number;
    topChannel: string;
    topChannelShare: number;
  };
  sourceCounts: Record<string, number>;
  countryCounts: Record<string, number>;
  contactModeCounts: Record<string, number>;
  stateCounts: Record<string, number>;
  timelineData: { name: string; "This Period": number; "Previous Period": number }[];
}

export default function AnalyticsTab() {
  const [selectedRange, setSelectedRange] = useState("6m");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const analyticsUrl = API.analytics(selectedRange);
  const { data, isLoading, isValidating, refresh } = useApiData<AnalyticsData>(
    analyticsUrl,
    analyticsUrl
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build country donut data from API
  const countryChartData = data ? Object.entries(data.countryCounts).map(([code, count]) => {
    const total = data.summary.currentTotal;
    return {
      name: COUNTRY_NAME[code] || code,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: COUNTRY_COLOR[code] || "#64748b"
    };
  }).sort((a, b) => b.value - a.value) : [];

  // Deep insights computation
  const deepInsights = data ? (() => {
    const insights: { type: "success" | "warning" | "info"; title: string; text: string }[] = [];
    const s = data.summary;

    if (s.totalTrend > 15) {
      insights.push({ type: "success", title: "Growth Acceleration", text: `Acquisition grew by ${s.totalTrend.toFixed(1)}% vs. the previous period. Keep momentum going with expanded outreach campaigns.` });
    } else if (s.totalTrend < -10) {
      insights.push({ type: "warning", title: "Acquisition Drop Alert", text: `Acquisitions dropped by ${Math.abs(s.totalTrend).toFixed(1)}% compared to the previous period. Recommend starting direct WhatsApp outreach campaigns to reactivate leads.` });
    } else {
      insights.push({ type: "info", title: "Stable Volume", text: "Lead generation volumes are remaining stable. Keep monitoring standard contact modes for any drops." });
    }

    if (s.activeRatio < 70) {
      insights.push({ type: "warning", title: "Inactive Node Surge", text: `Only ${s.activeRatio.toFixed(1)}% of registered clients in this period are Active. Schedule health checks with registered firms.` });
    } else if (s.activeRatio > 85) {
      insights.push({ type: "success", title: "Premium Health Index", text: `Active client ratio stands at a healthy ${s.activeRatio.toFixed(1)}%. Customer onboarding loops are functioning optimally.` });
    }

    if (s.topChannel && s.topChannelShare > 0) {
      insights.push({ type: "info", title: `High Conversion on ${s.topChannel}`, text: `${s.topChannel} is the primary source in this period, contributing ${s.topChannelShare.toFixed(1)}% of total clients. Optimize marketing copy for this channel.` });
    }

    return insights;
  })() : [];

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
          <div className="flex items-center gap-2 font-semibold text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>This Period: {payload[0]?.value?.toLocaleString()}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2 font-semibold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Previous Period: {payload[1].value.toLocaleString()}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs flex items-center gap-2 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="text-slate-700 dark:text-slate-200">{d.name}:</span>
          <span className="text-slate-900 dark:text-white">{d.value}% share</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4 relative z-20">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Enterprise Intelligence Report
          </h3>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Performance Metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition cursor-pointer shadow-sm min-w-[160px] justify-between"
            >
              <span>{RANGE_OPTIONS.find((r) => r.id === selectedRange)?.name}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-20"
                  >
                    <div className="py-1">
                      {RANGE_OPTIONS.map((range) => (
                        <button
                          key={range.id}
                          onClick={() => { setSelectedRange(range.id); setIsDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-950 block cursor-pointer ${selectedRange === range.id ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-400"}`}
                        >
                          {range.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Period Acquisitions</span>
                <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data?.summary.currentTotal ?? 0}</h4>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${(data?.summary.totalTrend ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
                  {(data?.summary.totalTrend ?? 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{(data?.summary.totalTrend ?? 0) >= 0 ? "+" : ""}{(data?.summary.totalTrend ?? 0).toFixed(1)}% vs. last period</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Active Node Ratio</span>
                <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{(data?.summary.activeRatio ?? 0).toFixed(1)}%</h4>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${(data?.summary.activeRatioTrend ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
                  {(data?.summary.activeRatioTrend ?? 0) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{(data?.summary.activeRatioTrend ?? 0) >= 0 ? "+" : ""}{(data?.summary.activeRatioTrend ?? 0).toFixed(1)}% fluctuation</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Dominant Lead Source</span>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{data?.summary.topChannel || "N/A"}</h4>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <span>{(data?.summary.topChannelShare ?? 0).toFixed(1)}% share of registrations</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Globe className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Acquisition Timeline Curve</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Comparison registry rates across selected period boundaries (live data).</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" />This Period</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />Previous</span>
                </div>
              </div>
              <div className="h-72 w-full">
                {mounted ? (
                  (data?.timelineData && data.timelineData.length > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorThis" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} />
                        <Tooltip content={<CustomAreaTooltip />} />
                        <Area type="monotone" dataKey="This Period" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorThis)" />
                        <Area type="monotone" dataKey="Previous Period" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrev)" strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No chart data available for this range selection.
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-slate-50/50 dark:bg-slate-950/20 rounded-xl animate-pulse" />
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Country Coverage Share</h4>
                <p className="text-xs text-slate-400 mt-0.5">Client ratio distribution in active filters.</p>
              </div>

              <div className="flex justify-center items-center py-4 relative h-48">
                {mounted ? (
                  countryChartData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Pie data={countryChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                            {countryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{countryChartData.length}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Countries</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">No data in filter</span>
                  )
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-slate-100 dark:border-slate-800 animate-pulse" />
                )}
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                {countryChartData.map((entry) => (
                  <div key={entry.name} className="flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-bold">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deep Insights */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                System Deep Insights & Action Items
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated diagnostic alerts based on current period acquisition telemetry (live from Supabase).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deepInsights.map((insight, idx) => {
                const isSuccess = insight.type === "success";
                const isWarning = insight.type === "warning";
                const cardBg = isSuccess ? "bg-success-soft/20 border-success/15" : isWarning ? "bg-danger-soft/20 border-danger/15" : "bg-primary-soft/10 border-primary/10";
                const iconColor = isSuccess ? "text-success" : isWarning ? "text-danger" : "text-primary";
                return (
                  <div key={idx} className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${cardBg}`}>
                    <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                      {isSuccess && <CheckCircle className="w-4 h-4" />}
                      {isWarning && <AlertTriangle className="w-4 h-4" />}
                      {!isSuccess && !isWarning && <Lightbulb className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">{insight.title}</h5>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] font-semibold">{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
