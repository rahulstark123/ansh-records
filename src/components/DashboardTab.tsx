"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Globe2, 
  TrendingUp, 
  MapPin, 
  UserPlus,
  BarChart3,
  Activity,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from "recharts";
import { useApiData } from "@/lib/useApiData";
import { API } from "@/lib/api-cache";
import { DashboardSkeleton } from "@/components/skeletons/TabSkeletons";

const SOURCE_COLORS: Record<string, string> = {
  "LinkedIn": "#0ea5e9",
  "Twitter / X": "#6366f1",
  "Google Search": "#10b981",
  "YouTube": "#f59e0b",
  "Direct Referral": "#8b5cf6",
  "Cold Outreach": "#ec4899",
  "Instagram": "#f97316",
  "Partner / Affiliate": "#14b8a6",
  "Referral": "#a855f7",
  "Conference / Event": "#06b6d4",
  "Product Hunt": "#ef4444",
  "Podcast": "#84cc16",
  "Direct Search": "#64748b"
};

interface DashboardData {
  stats: {
    totalClients: number;
    activeClients: number;
    convertedClients: number;
    totalCountries: number;
    totalRevenue: number;
    totalSeats: number;
    activeRatio: number;
    conversionRate: number;
  };
  targets: {
    totalReached: number;
    avgReached: number;
    todayReached: number;
  };
  topRegions: { state: string; country: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  contactModeBreakdown: { mode: string; count: number }[];
  recentActivity: { name: string; company: string; location: string; source: string; createdAt: string; isConverted: boolean }[];
}

function buildOperationsRadarData(data: DashboardData) {
  if (data.stats.totalClients <= 0) return [];

  return [
    { subject: "Active Ratio", score: data.stats.activeRatio },
    { subject: "Conversion", score: data.stats.conversionRate },
    { subject: "Global Reach", score: Math.min(data.stats.totalCountries * 20, 100) },
    { subject: "Today Outreach", score: Math.min(data.targets.todayReached, 100) },
    { subject: "Avg Daily Reach", score: Math.min(data.targets.avgReached, 100) }
  ];
}

export default function DashboardTab() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isValidating, refresh } = useApiData<DashboardData>(
    API.dashboard,
    API.dashboard
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = data ? [
    { label: "Total Clients Listed", value: data.stats.totalClients.toLocaleString(), diff: `${data.stats.activeRatio}% Active`, isUp: true, icon: Users, color: "from-blue-500 to-sky-400" },
    { label: "Global Coverage", value: `${data.stats.totalCountries} Countries`, diff: "Expanded Registry", isUp: null, icon: Globe2, color: "from-teal-500 to-emerald-400" },
    { label: "Conversion Rate", value: `${data.stats.conversionRate}%`, diff: `${data.stats.convertedClients} converted`, isUp: data.stats.conversionRate > 10, icon: TrendingUp, color: "from-indigo-500 to-violet-400" },
    { label: "Total Revenue", value: `Rs.${(data.stats.totalRevenue).toLocaleString()}`, diff: `${data.stats.totalSeats} seats sold`, isUp: null, icon: DollarSign, color: "from-amber-500 to-orange-400" },
  ] : [];

  const sourceChartData = data?.sourceBreakdown.slice(0, 8).map((s) => ({
    name: s.source.length > 12 ? s.source.slice(0, 12) + "..." : s.source,
    fullName: s.source,
    count: s.count,
    color: SOURCE_COLORS[s.source] || "#64748b"
  })) || [];

  const operationsRadarData = data ? buildOperationsRadarData(data) : [];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs flex items-center gap-2 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="text-slate-700 dark:text-slate-200">{d.fullName}:</span>
          <span className="text-slate-900 dark:text-white">{d.count} leads</span>
        </div>
      );
    }
    return null;
  };

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1 font-bold">
          <p className="text-slate-800 dark:text-slate-100">{payload[0].payload.subject}</p>
          <div className="text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Score: {payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[30%] h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]" />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Good day, Admin.
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Here is your live intelligence summary for ANSH Record. All data is pulled in real-time from your Supabase database.
            </p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              variants={item}
              className="glass-panel p-6 rounded-2xl hover-lift relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md shadow-slate-200/50 dark:shadow-none`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                {stat.isUp !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.isUp ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                    {stat.diff}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  {stat.isUp !== null ? "vs. registry total" : stat.diff}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Today Target Banner */}
      {data && (
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Today Outreach Reached</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{data.targets.todayReached} clients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">All-Time Outreach</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{data.targets.totalReached.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Lead Acquisition Channels
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of registered clients by acquisition source (live from database).
            </p>
          </div>
          <div className="h-64 w-full">
            {mounted && sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.04)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No client data yet. Add clients to see channel breakdown.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Workspace Operations Index
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live metrics derived from your client registry and outreach targets.
            </p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {mounted && operationsRadarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={operationsRadarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#64748b", fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center px-6">
                No data yet. Add clients and target logs to see performance metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Region Density & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              High-Density Geographical Regions
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Top state territories with maximum active client registry values.
            </p>
          </div>
          <div className="space-y-4">
            {data?.topRegions.map((region, idx) => {
              const maxCount = data.topRegions[0]?.count || 1;
              const pct = Math.round((region.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{region.state} ({region.country})</span>
                    <span className="text-slate-400">{region.count} clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              Recent Registrations
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Latest entries from your client registry.</p>
          </div>
          <div className="space-y-4">
            {data?.recentActivity.map((act, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-normal">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{act.name}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400">from {act.company}</span>
                  {act.isConverted && (
                    <span className="inline-block ml-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">Converted</span>
                  )}
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {act.location} · {new Date(act.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
