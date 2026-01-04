"use client";

import React from "react";
import Link from "next/link";
import {
  Building,
  Clock,
  Users,
  ArrowRight,
  FolderOpen,
  Camera,
  Box,
  Calendar,
} from "lucide-react";

const projectData = {
  name: "The Building",
  description: "Description.",
  status: "In Progress",
  lastUpdated: "2 giờ trước",
  stats: [
    { label: "Total Folders", value: "128", icon: FolderOpen },
    { label: "Active Views", value: "45", icon: Camera },
    { label: "Releases", value: "12", icon: Box },
    { label: "Team Members", value: "24", icon: Users },
  ],
  members: [
    { id: 1, name: "Nam Nguyen", avatar: "NN" },
    { id: 2, name: "Tuan Le", avatar: "TL" },
    { id: 3, name: "Sarah J", avatar: "SJ" },
    { id: 4, name: "Mike D", avatar: "MD" },
  ],
  activities: [
    {
      user: "Nam Nguyen",
      action: "updated",
      target: "Floor_01_Arch.dwg",
      time: "15 minutes ago",
    },
    {
      user: "Tuan Le",
      action: "created new",
      target: "v1.2.0 - Foundation",
      time: "1 hours ago",
    },
    {
      user: "Sarah J",
      action: "created new",
      target: "Section A-A",
      time: "3 hours ago",
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-full bg-[#F0F4F6] text-[#0F2332] p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#1D3F52]/70 mb-1">
            <Building size={16} />
            <span>Project Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0F2332]">
            {projectData.name}
          </h1>
          <p className="text-[#0F2332]/60 mt-1 max-w-2xl text-sm md:text-base">
            {projectData.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="px-3 py-1 rounded-full bg-[#1D3F52]/10 text-[#1D3F52] text-xs font-bold uppercase tracking-wider border border-[#1D3F52]/20">
            {projectData.status}
          </div>
          {/* Action Button */}
          <button className="bg-[#1D3F52] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1D3F52]/90 transition-colors shadow-sm flex items-center gap-2">
            <SettingsButtonIcon /> Manage Project
          </button>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectData.stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-lg border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-md bg-[#F0F4F6] text-[#1D3F52] group-hover:bg-[#1D3F52] group-hover:text-white transition-colors">
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Metric
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F2332]">
              {stat.value}
            </div>
            <div className="text-sm text-[#0F2332]/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

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
                href="#"
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
                href="#"
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
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F2332]">
                Recent Activity
              </h2>
              <button className="text-xs font-medium text-[#1D3F52] hover:underline">
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {projectData.activities.map((activity, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1D3F52] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F2332]">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium text-[#1D3F52]">
                        {activity.target}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        {/* <div className="space-y-8"> */}
        <div className="space-y-8 h-full flex flex-col justify-end">
          {/* Project Details Card */}
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
                    Oct 24, 2025
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
                    {projectData.lastUpdated}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 uppercase font-bold mb-3">
                  Team Members
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {projectData.members.map((member) => (
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
            </div>
          </section>

          {/* Help / Support Mini Card */}
          <div className="bg-gradient-to-br from-[#1D3F52] to-[#2D566C] rounded-xl p-6 text-white shadow-md">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-sm text-white/80 mb-4">
              Check our documentation or contact support if you need assistance.
            </p>
            <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-md py-2 text-sm font-medium transition-colors">
              View Documentation
            </button>
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
