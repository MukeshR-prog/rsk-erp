"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TextField, Label, Input, FieldError, Button } from "@heroui/react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sun, Moon, Building2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, LoginFormValues } from "@/features/shared/auth/validations";
import { resolveUserAuthEmailAction } from "@/features/shared/auth/actions";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleVisibility = () => setIsVisible(!isVisible);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);

      // Check database dynamically to resolve email or phone number
      const res = await resolveUserAuthEmailAction(data.email);
      const authEmail = res.success && res.email ? res.email : data.email.trim();

      const { data: authResult, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: data.password,
      });

      if (error) {
        if (error.message?.includes("Failed to fetch") || error.message?.includes("fetch")) {
          toast.error("Network error: Unable to connect to Auth server. Please check your network connection.");
        } else {
          toast.error(error.message || "Invalid email, mobile number, or password");
        }
      } else if (authResult?.user) {
        toast.success("Welcome back! Redirecting...");
        router.push("/workspace");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">Loading ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden px-4 py-12 select-none transition-colors duration-300">
      {/* Background Radial Aura */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls: Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Glassmorphic Form Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Company Header Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>RSK ENTERPRISES ERP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-all duration-300">
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
              Sign In to ERP
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Enter your registered email or phone number
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <TextField isInvalid={!!errors.email} className="flex flex-col gap-1.5 w-full">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email or Mobile Number
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400 dark:text-slate-500 w-4.5 h-4.5" />
                <Input
                  type="text"
                  placeholder="e.g. 8608127349 or user@gmail.com"
                  className="pl-10 pr-4 py-3 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm font-semibold transition-all shadow-inner"
                  {...register("email")}
                />
              </div>
              {errors.email && <FieldError className="text-xs text-red-500 dark:text-red-400 mt-1 font-bold">{errors.email.message}</FieldError>}
            </TextField>

            <TextField isInvalid={!!errors.password} className="flex flex-col gap-1.5 w-full">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400 dark:text-slate-500 w-4.5 h-4.5" />
                <Input
                  type={isVisible ? "text" : "password"}
                  placeholder="Enter password"
                  className="pl-10 pr-11 py-3 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm font-semibold transition-all shadow-inner"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label="toggle password visibility"
                >
                  {isVisible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <FieldError className="text-xs text-red-500 dark:text-red-400 mt-1 font-bold">{errors.password.message}</FieldError>}
            </TextField>

            <Button
              type="submit"
              variant="primary"
              isPending={loading}
              className="mt-3 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/20 border-none transition-all duration-200 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Protected by Database Authenticated Session</span>
        </div>
      </div>
    </div>
  );
}

