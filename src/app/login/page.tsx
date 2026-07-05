"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2, KeyRound, Hash, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import AppLogo from "@/components/AppLogo";

function SecureInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  maxLength,
  show,
  onToggleShow
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  maxLength?: number;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xs font-semibold transition text-slate-900 dark:text-white"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition cursor-pointer disabled:opacity-50"
          aria-label={show ? "Hide value" : "Show value"}
        >
          {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@anshapps.com");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !passcode || !pin) {
      setError("Please fill in all security fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate local passcode and PIN first
    if (passcode !== "Khushi@Simran") {
      setError("Incorrect access passcode. Please try again.");
      return;
    }

    if (pin !== "30042026") {
      setError("Incorrect system PIN. Please try again.");
      return;
    }

    setIsLoading(true);

    // Authenticate with Supabase Auth using email + password
    const { error: authError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (authError) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    // All checks passed — show success and redirect
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };


  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-background">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]" />

      <div className="w-full max-w-md z-10">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <AppLogo height={96} width={200} priority className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
            ANSH Record
          </h1>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
            Client Directory & Geographical Intelligence Suite
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-slate-350 dark:border-slate-700 shadow-xl"
        >
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="login-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Secure Verification
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    Provide credentials to pass the firewall gateway.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-xs font-bold text-danger flex items-start gap-2.5"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Input Fields */}
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@anshapps.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xs font-semibold transition text-slate-900 dark:text-white"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <SecureInput
                    label="Security Password *"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••••••"
                    icon={Lock}
                    disabled={isLoading}
                    show={showPassword}
                    onToggleShow={() => setShowPassword((prev) => !prev)}
                  />

                  <SecureInput
                    label="Access Passcode *"
                    value={passcode}
                    onChange={setPasscode}
                    placeholder="••••••••••••"
                    icon={KeyRound}
                    disabled={isLoading}
                    show={showPasscode}
                    onToggleShow={() => setShowPasscode((prev) => !prev)}
                  />

                  <SecureInput
                    label="System PIN (8 Digits) *"
                    value={pin}
                    onChange={setPin}
                    placeholder="••••••••"
                    icon={Hash}
                    maxLength={8}
                    disabled={isLoading}
                    show={showPin}
                    onToggleShow={() => setShowPin((prev) => !prev)}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 mt-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Unlock Gateway Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mb-4 border border-success/30">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  Handshake Verified
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
                  Accessing ANSH Record secure directory node...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} ANSH Apps. All rights reserved.
        </p>
      </div>
    </div>
  );
}
