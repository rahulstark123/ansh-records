"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardTab from "@/components/DashboardTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import ClientsTab from "@/components/ClientsTab";
import TargetsTab from "@/components/TargetsTab";
import { Bell, Search, ChevronDown, Sun, Moon } from "lucide-react";
import { prefetchAllTabs, prefetchTab } from "@/lib/api-cache";

const TAB_ORDER = ["dashboard", "analytics", "clients", "targets"] as const;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(() => new Set(["dashboard"]));
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || 
                   localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    const prefetch = () => prefetchAllTabs();
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: string) => {
    prefetchTab(tab);
    setActiveTab(tab);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard Overview";
      case "analytics":
        return "Analytics Intelligence";
      case "clients":
        return "Clients Directory Map";
      case "targets":
        return "Outreach Targets Tracker";
      default:
        return "Overview";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-350 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-64 max-md:hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-755 rounded-lg text-xs outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-950 transition text-slate-900 dark:text-white placeholder:text-slate-500"
              />
            </div>

            <button 
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button className="relative p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-slate-950" />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 flex items-center justify-center border border-primary/40 text-xs font-bold text-slate-900 dark:text-slate-100">
                AA
              </div>
              <div className="text-left max-sm:hidden">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Ansh Admin
                </span>
                <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Superadmin
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 max-sm:hidden" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {TAB_ORDER.map((tab) => (
            mountedTabs.has(tab) ? (
              <div key={tab} className={activeTab === tab ? "block h-full" : "hidden"}>
                {tab === "dashboard" && <DashboardTab />}
                {tab === "analytics" && <AnalyticsTab />}
                {tab === "clients" && <ClientsTab />}
                {tab === "targets" && <TargetsTab />}
              </div>
            ) : null
          ))}
        </main>
      </div>
    </div>
  );
}
