"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  X, 
  Save, 
  Award,
  Sparkles,
  HelpCircle
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
  ReferenceLine
} from "recharts";
import { useApiData } from "@/lib/useApiData";
import { API, invalidateCache } from "@/lib/api-cache";
import { TargetsSkeleton } from "@/components/skeletons/TabSkeletons";
import { Skeleton, SkeletonTableRows } from "@/components/ui/Skeleton";

interface TargetLog {
  id: string;
  date: string;
  focusedArea: string;
  reachedCount: number;
  dailyTarget: number;
  notes?: string | null;
}

export default function TargetsTab() {
  const { data, isLoading, mutate, refresh } = useApiData<TargetLog[]>(
    API.targets,
    API.targets
  );
  const targets = data ?? [];
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Pagination states
  const [targetCurrentPage, setTargetCurrentPage] = useState(1);
  const [targetsPerPage, setTargetsPerPage] = useState(10);

  // Reset pagination page on changes
  useEffect(() => {
    setTargetCurrentPage(1);
  }, [targets.length]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the target log for ${name}?`)) return;

    try {
      const res = await fetch(`/api/targets?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete log");
      }

      mutate((prev) => (prev ?? []).filter((t) => t.id !== id));
      invalidateCache(API.targets);
      setSuccessToast("Target log deleted successfully.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting.");
    }
  };

  // Recharts mounted hydration safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Telemetry analytics memo calculations
  const telemetry = useMemo(() => {
    if (targets.length === 0) {
      return {
        totalReached: 0,
        averageReached: 0,
        successRate: 0,
        successDays: 0,
        streak: 0,
        trend: 0
      };
    }

    const totalReached = targets.reduce((sum, t) => sum + t.reachedCount, 0);
    const averageReached = Math.round(totalReached / targets.length);
    
    // Days hitting target of 100
    const successDays = targets.filter((t) => t.reachedCount >= t.dailyTarget).length;
    const successRate = Math.round((successDays / targets.length) * 100);

    // Calculate current consecutive days streak hitting target (sorted by date ascending)
    const sorted = [...targets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].reachedCount >= sorted[i].dailyTarget) {
        streak++;
      } else {
        break;
      }
    }

    // Trend comparing last 2 entries
    let trend = 0;
    if (targets.length >= 2) {
      const last = targets[targets.length - 1].reachedCount;
      const prev = targets[targets.length - 2].reachedCount;
      if (prev > 0) {
        trend = Math.round(((last - prev) / prev) * 100);
      }
    }

    return {
      totalReached,
      averageReached,
      successRate,
      successDays,
      streak,
      trend
    };
  }, [targets]);

  // Chart data formatter
  const chartData = useMemo(() => {
    return targets.map((t) => ({
      dateLabel: new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }),
      reached: t.reachedCount,
      target: t.dailyTarget,
      area: t.focusedArea
    }));
  }, [targets]);

  if (isLoading && !data) {
    return <TargetsSkeleton />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header telemetry metrics bar */}
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" />
            Daily Outreach Quota Manager
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Your daily target is to reach at least 100 clients across focused geographical sectors. Outreach tallies update automatically as clients are added.
          </p>
        </div>
      </div>

      {/* Analytics Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider block">
            Target Achievement Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry.successRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400">success days</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950/40 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(telemetry.successRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider block">
            Total Reached Clients
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry.totalReached.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">
              Cumulative
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Total cumulative prospect nodes engaged across logged dates.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider block">
            Average Daily Reached
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry.averageReached}
            </span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
              telemetry.averageReached >= 100
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {telemetry.averageReached >= 100 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{telemetry.averageReached >= 100 ? "On Target" : "Below Quota"}</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Target quota is 100 clients daily.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider block">
            Consecutive Day Streak
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry.streak}
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Streak</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Consecutive logged days meeting or exceeding 100 outreach leads.
          </p>
        </div>
      </div>

      {/* Main Section: Interactive Trend Chart */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Target className="w-4.5 h-4.5 text-primary" />
            Outreach Trends vs. Quota Line
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical daily reached counts. The red dashed line denotes the 100-client target quota.
          </p>
        </div>

        <div className="h-[280px]">
          {mounted && targets.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetReachColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e120" vertical={false} />
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isSuccess = data.reached >= data.target;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl space-y-1 text-xs">
                          <p className="font-extrabold text-slate-900 dark:text-white">{data.dateLabel}</p>
                          <p className="font-semibold text-slate-500 dark:text-slate-400">Area: <strong className="text-slate-800 dark:text-slate-200">{data.area}</strong></p>
                          <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-850 mt-1">
                            <span className="font-semibold text-primary">Reached: <strong className="font-extrabold">{data.reached}</strong></span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isSuccess ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {isSuccess ? "Success" : "Below Target"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reached" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#targetReachColor)" 
                />
                <ReferenceLine 
                  y={100} 
                  stroke="var(--color-danger)" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: "Target Quota (100)", position: "top", fill: "var(--color-danger)", fontSize: 9, fontWeight: "bold" }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold italic">
              No target logs yet. Add clients or log outreach to see trends.
            </div>
          )}
        </div>
      </div>

      {/* Target Logs Tabular Registry */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Historical Outreach Target Registry
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Log database of focused geographical sectors and daily leads reached.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">Rows:</span>
            <select
              value={targetsPerPage}
              onChange={(e) => { setTargetsPerPage(Number(e.target.value)); setTargetCurrentPage(1); }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-primary transition"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={9999}>All</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-white/20 dark:bg-slate-950/10">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="px-6 py-3.5">Log Date</th>
                <th className="px-6 py-3.5">Focused Geographic Sector</th>
                <th className="px-6 py-3.5">Leads Reached</th>
                <th className="px-6 py-3.5">Goal Progress</th>
                <th className="px-6 py-3.5">Notes</th>
                <th className="px-6 py-3.5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80">
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : targets.length > 0 ? (
                [...targets].reverse().slice((targetCurrentPage - 1) * targetsPerPage, targetCurrentPage * targetsPerPage).map((target) => {
                  const isSuccess = target.reachedCount >= target.dailyTarget;
                  const percent = Math.round((target.reachedCount / target.dailyTarget) * 100);

                  return (
                    <tr key={target.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(target.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{target.focusedArea}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                        {target.reachedCount} / {target.dailyTarget}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{percent}% ({isSuccess ? "Goal Met" : "Shortfall"})</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={target.notes || ""}>
                        {target.notes || <span className="italic text-slate-300 dark:text-slate-600">No notes written</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(target.id, target.focusedArea)}
                          className="p-1.5 rounded bg-danger-soft hover:bg-red-200/50 text-danger transition cursor-pointer"
                          title="Delete Target Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold italic">
                    No target outreach achievements logged. Register clients to populate outreach goals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {targets.length > 0 && targetsPerPage < 9999 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-800 dark:text-slate-200">{(targetCurrentPage - 1) * targetsPerPage + 1}</strong> – <strong className="text-slate-800 dark:text-slate-200">{Math.min(targetCurrentPage * targetsPerPage, targets.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{targets.length}</strong> outreach target logs
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTargetCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={targetCurrentPage === 1}
                  className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 disabled:opacity-40 transition cursor-pointer"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.ceil(targets.length / targetsPerPage) }).slice(
                  Math.max(0, targetCurrentPage - 3),
                  Math.min(Math.ceil(targets.length / targetsPerPage), targetCurrentPage + 2)
                ).map((_, idx) => {
                  const pageNum = Math.max(0, targetCurrentPage - 3) + idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setTargetCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                        targetCurrentPage === pageNum
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white hover:bg-slate-50 dark:bg-slate-955 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-855 text-slate-600 dark:text-slate-350"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setTargetCurrentPage(prev => Math.min(Math.ceil(targets.length / targetsPerPage), prev + 1))}
                  disabled={targetCurrentPage === Math.ceil(targets.length / targetsPerPage)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-955 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 disabled:opacity-40 transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
