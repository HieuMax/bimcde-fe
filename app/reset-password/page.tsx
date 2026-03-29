"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { post } = useApi();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const passwordStrength = {
    hasLength: password.length >= 6,
    // hasUpperCase: /[A-Z]/.test(password),
    // hasLowerCase: /[a-z]/.test(password),
    // hasNumber: /[0-9]/.test(password),
    // hasSpecial: /[!@#$%^&*]/.test(password),
  };

  //   const isStrongPassword =
  //     Object.values(passwordStrength).filter(Boolean).length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    // if (!isStrongPassword) {
    //   setError(
    //     "Mật khẩu không đủ mạnh. Vui lòng sử dụng ít nhất 3 tiêu chí khác nhau",
    //   );
    //   return;
    // }

    setIsLoading(true);

    try {
      // Simulate API call
      const res = await post("/accounts/reset-password", { token, password });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                Mật khẩu đã được thay đổi
              </CardTitle>
              <CardDescription className="text-base">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng
                nhập với mật khẩu mới.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Link className="underline" href="/login">
                Chuyển hướng đến trang đăng nhập
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Lock className="h-6 w-6 text-[#406D87]  text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Tạo mật khẩu mới</CardTitle>
            <CardDescription className="text-base">
              Hãy tạo mật khẩu mạnh để bảo vệ tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p>{error}</p>}

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}>
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicators */}
              {password && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    Độ mạnh của mật khẩu:
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          passwordStrength.hasLength ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasLength
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }>
                        Ít nhất 6 ký tự
                      </span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          passwordStrength.hasUpperCase
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasUpperCase
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }>
                        Chứa chữ hoa (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          passwordStrength.hasLowerCase
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasLowerCase
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }>
                        Chứa chữ thường (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          passwordStrength.hasNumber ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasNumber
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }>
                        Chứa số (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          passwordStrength.hasSpecial
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasSpecial
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }>
                        Chứa ký tự đặc biệt (!@#$%^&*)
                      </span>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}>
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Match Indicator */}
              {confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    password === confirmPassword
                      ? "text-primary"
                      : "text-destructive"
                  }`}>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      password === confirmPassword
                        ? "bg-primary"
                        : "bg-destructive"
                    }`}
                  />
                  {password === confirmPassword
                    ? "Mật khẩu khớp"
                    : "Mật khẩu không khớp"}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-[#406D87] hover:bg-[#345a70]"
                disabled={isLoading || password !== confirmPassword}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Đang cập nhật...
                  </div>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
