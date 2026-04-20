"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/context/authContext";
import { useApi } from "@/app/hooks/useApi";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  fullName: z.string().min(1, "Please enter full name"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is invalid"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { post } = useApi();
  const router = useRouter();

  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // --- Profile Form ---
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  // --- Password Form ---
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // --- Sync user data to form ---
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
      });
    }
  }, [user, profileForm]);

  // --- Submit Handlers ---
  const onSubmitProfile = async (data: ProfileFormData) => {
    setMessage(null);
    try {
      const res = await post("/accounts/update-profile", data);
      if (res.success) {
        setMessage("Profile saved.");
        await refreshUser();
      } else {
        setMessage("Update failed. Please try again.");
      }
    } catch {
      setMessage("Update failed. Please try again.");
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setPasswordMessage(null);
    try {
      const res = await post("/accounts/change-password", data);
      if (res.success) {
        setPasswordMessage("Password changed.");
        passwordForm.reset();
      } else {
        setPasswordMessage("Change password failed. Please try again.");
      }
    } catch {
      setPasswordMessage("Change password failed. Please try again.");
    }
  };

  // --- Loading / No user ---
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
        <Loader2 className="animate-spin text-slate-600" size={40} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
        <p className="text-slate-600">Please check profile data.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top navbar / header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="p-2 rounded-md hover:bg-slate-100">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg select-none">
                {profileForm.getValues("fullName")?.charAt(0) || "U"}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            </div>
          </div>
          <Button
            onClick={profileForm.handleSubmit(onSubmitProfile)}
            className="h-10 px-6 text-base"
            disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            Save changes
          </Button>
        </div>

        {/* --- Profile Form --- */}
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onSubmitProfile)}
            className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left - Overview */}
              <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Overview
                </h2>
                <div className="space-y-5">
                  <OverviewItem
                    icon={
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                        <path d="M6 20c0-2.21 2.686-4 6-4s6 1.79 6 4" />
                      </svg>
                    }
                    title="Role"
                    value={user.role}
                  />
                  <OverviewItem
                    icon={
                      <svg
                        className="w-6 h-6 text-cyan-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M3 7l9 5 9-5M5 19h14a2 2 0 002-2V7l-9 5-9-5v10a2 2 0 002 2z" />
                      </svg>
                    }
                    title="Email"
                    value={user.email}
                  />
                </div>
              </section>

              {/* Right - Profile info form */}
              <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile information
                </h2>

                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter full name"
                          className="text-lg h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter phone number"
                          className="text-lg h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {message && (
                  <p className="rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3">
                    {message}
                  </p>
                )}
              </section>
            </div>
          </form>
        </Form>

        {/* --- Password Form --- */}
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Change password
                </h2>
                <p className="text-sm text-gray-600">
                  Update your password periodically to keep your account secure.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => passwordForm.reset()}
                disabled={passwordForm.formState.isSubmitting}>
                Reset
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="text-lg h-12"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="text-lg h-12"
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="text-lg h-12"
                        autoComplete="confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {passwordMessage && (
              <p className="rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3">
                {passwordMessage}
              </p>
            )}

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              Change password
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}

function OverviewItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | undefined;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="font-medium text-gray-900">{value || "-"}</p>
      </div>
    </div>
  );
}
