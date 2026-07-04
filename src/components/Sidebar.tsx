"use client";

import React, { useState } from "react";
import { LayoutDashboard, BarChart3, Users, LogOut, Shield, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { prefetchTab } from "@/lib/api-cache";
import { getSupabase } from "@/lib/supabase";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await getSupabase().auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "clients", label: "Clients Directory", icon: Users },
    { id: "targets", label: "Outreach Targets", icon: Target },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-base leading-none block">
            ANSH Record
          </span>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block mt-0.5">
            Admin Suite
          </span>
        </div>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => prefetchTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition relative group cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors z-10 ${
                  isActive
                    ? "text-primary"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                }`}
              />
              <span
                className={`z-10 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Controls */}
      <div className="p-6 border-t border-slate-300 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800">
            AA
          </div>
          <div>
            <div className="text-xs font-bold text-slate-950 dark:text-slate-200 leading-tight">
              Ansh Admin
            </div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Staff Account
            </div>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingOut && setShowLogoutModal(false)}
              className="fixed inset-0 z-50 bg-slate-950"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 z-[55] shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto border border-danger/25">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Sign Out
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Are you sure you want to logout? You will need to sign in again to access the admin dashboard.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 bg-danger hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-danger/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoggingOut ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Yes, Logout</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </aside>
  );
}
