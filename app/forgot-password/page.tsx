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
import { CheckCircle, Mail } from "lucide-react";
import { useApi } from "../hooks/useApi";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const { post } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      const res = await post("/accounts/forgot-password", { email });

      if (res.success) {
        setEmailSent(true);
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-8 text-[#406D87]  w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email đã được gửi</CardTitle>
              <CardDescription className="text-base">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <br />
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium">Tiếp theo:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Kiểm tra email của bạn</li>
                  <li>Nhấp vào liên kết trong email</li>
                  <li>Tạo mật khẩu mới</li>
                </ol>
              </div>
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
                <Mail className="h-6 w-6 text-primary text-[#406D87] " />
              </div>
            </div>
            <CardTitle className="text-2xl">Quên mật khẩu?</CardTitle>
            <CardDescription className="text-base">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn
              để đặt lại mật khẩu
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p>{error}</p>}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Địa chỉ email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#406D87] hover:bg-[#345a70]"
                disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-[#406D87] hover:bg-[#345a70] animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Đang gửi...
                  </div>
                ) : (
                  "Gửi hướng dẫn"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Bạn nhớ mật khẩu rồi?{" "}
                <a
                  href="/login"
                  className="font-semibold text-primary hover:underline">
                  Quay lại đăng nhập
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
