"use client";

import React from "react";
import { ListTodo, Camera, MessageSquare, Box } from "lucide-react";
import { StatsCard } from "./StatsCard";
import type { DashboardStats } from "./hooks/useDashboardStats";

type DashboardStatsGridProps = {
  stats: DashboardStats;
  loading?: boolean;
};

export function DashboardStatsGrid({ stats, loading }: DashboardStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg border border-gray-200/60 shadow-sm animate-pulse"
          >
            <div className="h-9 w-9 rounded-md bg-gray-200 mb-4" />
            <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Todos",
      value: stats.todos,
      icon: ListTodo,
    },
    {
      label: "Views",
      value: stats.views.total,
      icon: Camera,
      subStats: [
        { label: "View 2D", value: stats.views.view2d },
        { label: "View 3D", value: stats.views.view3d },
      ],
    },
    {
      label: "Topics",
      value: stats.topics,
      icon: MessageSquare,
    },
    {
      label: "Releases",
      value: stats.releases,
      icon: Box,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <StatsCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          subStats={card.subStats}
        />
      ))}
    </div>
  );
}
