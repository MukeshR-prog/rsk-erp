"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, TextField, Label, Input, FieldError, Button } from "@heroui/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, LoginFormValues } from "@/features/shared/auth/validations";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back! Redirecting...");
        router.push("/workspace");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-955">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-100 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading Login Form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))] pointer-events-none" />
      <Card className="w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
        <CardHeader className="flex flex-col gap-2 items-center pb-0 pt-6">
          <div className="p-3 bg-slate-900 text-white rounded-2xl dark:bg-slate-50 dark:text-slate-900 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            RSK Enterprises ERP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to access your business dashboard
          </p>
        </CardHeader>
        <CardContent className="py-6 px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <TextField isInvalid={!!errors.email} className="flex flex-col gap-1.5 w-full">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Email Address</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
                <Input
                  type="email"
                  placeholder="enter owner email"
                  className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all"
                  {...register("email")}
                />
              </div>
              {errors.email && <FieldError className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.email.message}</FieldError>}
            </TextField>

            <TextField isInvalid={!!errors.password} className="flex flex-col gap-1.5 w-full">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Password</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
                <Input
                  type={isVisible ? "text" : "password"}
                  placeholder="enter password"
                  className="pl-10 pr-11 py-2.5 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute right-3.5 focus:outline-none"
                  aria-label="toggle password visibility"
                >
                  {isVisible ? (
                    <EyeOff className={["text-slate-400", "w-5", "h-5", "shrink-0"].join(" ")} />
                  ) : (
                    <Eye className={["text-slate-400", "w-5", "h-5", "shrink-0"].join(" ")} />
                  )}
                </button>
              </div>
              {errors.password && <FieldError className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.password.message}</FieldError>}
            </TextField>

            <Button
              type="submit"
              variant="primary"
              className="mt-2 font-semibold text-medium h-11"
              isPending={loading}
              size="lg"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
