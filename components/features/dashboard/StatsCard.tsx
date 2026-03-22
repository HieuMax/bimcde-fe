"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export type StatsCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subStats?: { label: string; value: number }[];
  className?: string;
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  subStats,
  className = "",
}: StatsCardProps) {
  return (
    <div
      className={`bg-white p-5 rounded-lg border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow group ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-md bg-[#F0F4F6] text-[#1D3F52] group-hover:bg-[#1D3F52] group-hover:text-white transition-colors">
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Metric
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-[#0F2332]">{value}</div>
          <div className="text-sm text-[#0F2332]/50 mt-1">{label}</div>
        </div>
        {subStats && subStats.length > 0 && (
          <div className="border py-2 px-2 border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#0F2332]/60">
            {subStats.map((s) => (
              <span key={s.label}>
                {s.label}:{" "}
                <span className="font-medium text-[#1D3F52]">{s.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
