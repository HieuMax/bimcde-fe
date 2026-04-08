"use client";

import React from "react";
import { HardDrive, Loader2 } from "lucide-react";
import { useProjectStorage } from "./hooks/useProjectStorage";

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

interface ProjectStorageBarProps {
  projectId: string | undefined;
}

export function ProjectStorageBar({ projectId }: ProjectStorageBarProps) {
  const {
    usedBytes,
    limitBytes,
    freeBytes,
    usedPercent,
    loading,
    error,
  } = useProjectStorage(projectId);

  if (loading) {
    return (
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
        <div className="w-9 h-9 rounded-lg bg-[#1D3F52]/10 flex items-center justify-center text-[#1D3F52] flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-gray-200 rounded-md overflow-hidden" />
          <p className="text-xs text-gray-400 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          <HardDrive className="h-4 w-4" />
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const freeMb = formatMb(freeBytes);
  const limitMb = formatMb(limitBytes);
  const fillColor = usedPercent >= 90 ? "#DC2626" : "#1D3F52";

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
      <div className="w-9 h-9 rounded-lg bg-[#1D3F52]/10 flex items-center justify-center text-[#1D3F52] flex-shrink-0">
        <HardDrive className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0F2332] mb-1.5">
          Project Storage
        </p>
        <div className="h-2.5 bg-gray-200 rounded-md overflow-hidden border border-gray-200/80">
          <div
            className="h-full rounded-[5px] transition-all duration-300"
            style={{
              width: `${Math.min(100, usedPercent)}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {freeMb} MB free of {limitMb} MB
        </p>
      </div>
    </div>
  );
}
