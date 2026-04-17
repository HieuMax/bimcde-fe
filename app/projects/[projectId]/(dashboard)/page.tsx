"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Building,
  Clock,
  ArrowRight,
  FolderOpen,
  Camera,
  Calendar,
} from "lucide-react";
import {
  DashboardStatsGrid,
  useDashboardStats,
  useProjectDashboardInfo,
  RecentActivitySection,
  FileTypesChart,
  ProjectStorageBar,
} from "@/components/features/dashboard";

const teamMembersPreview = [
  { id: 1, name: "Nam Nguyen", avatar: "NN" },
  { id: 2, name: "Tuan Le", avatar: "TL" },
  { id: 3, name: "Sarah J", avatar: "SJ" },
  { id: 4, name: "Mike D", avatar: "MD" },
];

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  const { stats, loading, error } = useDashboardStats(projectId);
  const {
    project,
    loading: projectLoading,
    error: projectError,
  } = useProjectDashboardInfo(projectId);

  const startDate = parseDate(project?.startDate ?? null);
  const lastModified = parseDate(project?.lastModifiedOn ?? null);

  return (
    <div className="min-h-full bg-[#F0F4F6] text-[#0F2332] p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#1D3F52]/70 mb-1">
            <Building size={16} />
            <span>Project Overview</span>
          </div>
          {projectError && (
            <p className="text-sm text-amber-700 mb-2">{projectError}</p>
          )}
          <h1 className="text-3xl font-bold text-[#0F2332]">
            {projectLoading ? (
              <span className="inline-block h-9 w-56 max-w-full bg-gray-200/80 rounded-md animate-pulse" />
            ) : (
              (project?.name?.trim() || "Project")
            )}
          </h1>
          <p className="text-[#0F2332]/60 mt-1 max-w-2xl text-sm md:text-base">
            {projectLoading ? (
              <span className="inline-block h-4 w-full max-w-xl bg-gray-200/80 rounded animate-pulse mt-1" />
            ) : project?.description?.trim() ? (
              project.description
            ) : (
              "No description yet. Add one in project settings."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="px-3 py-1 rounded-full bg-[#1D3F52]/10 text-[#1D3F52] text-xs font-bold uppercase tracking-wider border border-[#1D3F52]/20">
            In Progress
          </div>
          {/* Action Button */}
          <Link
            href={
              projectId ? `/projects/${projectId}/settings/details` : "#"
            }
            className="bg-[#1D3F52] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1D3F52]/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <SettingsButtonIcon /> Manage Project
          </Link>
        </div>
      </div>

      {/* 2. PROJECT DETAILS + FILE TYPES (Top row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Details Card - Left */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-[#0F2332] mb-4">
            Project Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#1D3F52] mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Start Date
                </div>
                <div className="text-sm font-medium text-[#0F2332]">
                  {projectLoading ? (
                    <span className="inline-block h-4 w-28 bg-gray-200/80 rounded animate-pulse" />
                  ) : startDate ? (
                    format(startDate, "MMM dd, yyyy")
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-[#1D3F52] mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Last Updated
                </div>
                <div className="text-sm font-medium text-[#0F2332]">
                  {projectLoading ? (
                    <span className="inline-block h-4 w-36 bg-gray-200/80 rounded animate-pulse" />
                  ) : lastModified ? (
                    formatDistanceToNow(lastModified, { addSuffix: true })
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-400 uppercase font-bold mb-3">
                Team Members
              </div>
              <div className="flex -space-x-2 overflow-hidden py-1">
                {teamMembersPreview.map((member) => (
                  <div
                    key={member.id}
                    className="h-8 w-8 rounded-full ring-2 ring-white bg-[#E0E8EC] text-[#1D3F52] flex items-center justify-center text-xs font-bold shadow-sm"
                    title={member.name}
                  >
                    {member.avatar}
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full ring-2 ring-white bg-[#F0F4F6] text-[#0F2332]/50 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#E0E8EC]">
                  +5
                </div>
              </div>
            </div>
            <ProjectStorageBar projectId={projectId} />
          </div>
        </section>

        {/* File Types Pie Chart - Right */}
        <FileTypesChart projectId={projectId} />
      </div>

      {/* 3. STATS GRID */}
      <section>
        {error && (
          <p className="text-sm text-red-600 mb-4">
            {error}
          </p>
        )}
        <DashboardStatsGrid stats={stats} loading={loading} />
      </section>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Access Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F2332]">Quick Access</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Explorer Card */}
              <Link
                href={projectId ? `/projects/${projectId}/data` : "#"}
                className="group relative overflow-hidden bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-[#1D3F52]/30 transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FolderOpen
                    size={80}
                    className="text-[#1D3F52] rotate-12 translate-x-4 -translate-y-4"
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-[#1D3F52]/10 flex items-center justify-center text-[#1D3F52] mb-4">
                    <FolderOpen size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2332] mb-1">
                    Data Explorer
                  </h3>
                  <p className="text-sm text-[#0F2332]/60 mb-4">
                    Browse folders, files and manage document structure.
                  </p>
                  <span className="text-sm font-semibold text-[#1D3F52] flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open Explorer <ArrowRight size={16} />
                  </span>
                </div>
              </Link>

              {/* Views Card */}
              <Link
                href={
                  projectId ? `/projects/${projectId}/data/views` : "#"
                }
                className="group relative overflow-hidden bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-[#1D3F52]/30 transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Camera
                    size={80}
                    className="text-[#1D3F52] rotate-12 translate-x-4 -translate-y-4"
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-[#1D3F52]/10 flex items-center justify-center text-[#1D3F52] mb-4">
                    <Camera size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2332] mb-1">
                    Saved Views
                  </h3>
                  <p className="text-sm text-[#0F2332]/60 mb-4">
                    Access your saved camera positions and view states.
                  </p>
                  <span className="text-sm font-semibold text-[#1D3F52] flex items-center gap-1 group-hover:gap-2 transition-all">
                    Go to Views <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* Recent Activity */}
          <RecentActivitySection projectId={projectId} />
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-8 h-full flex flex-col justify-end">
          {/* Help / Support Mini Card */}
          <div className="bg-gradient-to-br from-[#1D3F52] to-[#2D566C] rounded-xl p-6 text-white shadow-md">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-sm text-white/80 mb-4">
              Check our documentation or contact support if you need assistance.
            </p>
            <a
              href="https://github.com/HieuMax/bimcde-fe"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-md py-2 text-sm font-medium transition-colors"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper icon component
function SettingsButtonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
