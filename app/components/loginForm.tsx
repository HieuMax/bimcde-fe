"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function LoginForm() {
  const router = useRouter();
  const { login, loading, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: any) => {
    const success = await login(data.email, data.password);

    if (success) {
      const nextUrl =
        new URLSearchParams(window.location.search).get("next") || "/";

      router.push(nextUrl);
    } else {
      alert("Đăng nhập không thành công. Vui lòng thử lại.");
    }
  };

  const error =
    authError ||
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Chào mừng trở lại
        </h1>
        <p className="text-gray-500 mt-2">
          Đăng nhập vào tài khoản BIM CDE của bạn
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* Error Box */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 shadow-sm animate-in fade-in">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Email</Label>

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              {...form.register("email")}
              className="pl-10 h-12 rounded-lg border-gray-300 focus-visible:ring-[#1D3F52]"
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Mật khẩu</Label>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10 h-12 rounded-lg border-gray-300 focus-visible:ring-[#1D3F52]"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors">
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <Button
          disabled={loading}
          type="submit"
          className="w-full h-12 rounded-lg flex justify-center items-center gap-2 bg-[#1D3F52] hover:bg-[#234a63] transition-colors">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        <p className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-[#1D3F52] hover:underline">
            Quên mật khẩu
          </Link>
        </p>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm">
          <span className="text-gray-600">Chưa có tài khoản? </span>
          <Link
            href="/register"
            className="font-medium text-[#1D3F52] hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
