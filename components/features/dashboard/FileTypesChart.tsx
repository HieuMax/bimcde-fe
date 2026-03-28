"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";
import { useFileTypesStats } from "./hooks/useFileTypesStats";

const CHART_COLORS = [
  "#1D3F52",
  "#2D566C",
  "#3D6B85",
  "#4D809E",
  "#5D95B7",
  "#6DAAD0",
  "#7DBFE3",
  "#9DD4ED",
];

interface FileTypesChartProps {
  projectId: string | undefined;
}

export function FileTypesChart({ projectId }: FileTypesChartProps) {
  const { data, loading, error } = useFileTypesStats(projectId);

  if (loading && data.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center min-h-[280px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D3F52]/50" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center min-h-[280px]">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  const chartData = data.map((item) => ({
    name: item.extension.toUpperCase(),
    value: item.count,
    fullLabel: `${item.extension.toUpperCase()} (${item.count})`,
  }));

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-[#0F2332]">File Types</h2>
      </div>
      <div className="p-6 min-h-[280px]">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-[#0F2332]/60 text-sm">
            <p>No files in this project yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="fullLabel"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Files"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#1D3F52", fontWeight: 600 }}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                formatter={(_, entry: { payload?: { fullLabel?: string } }) => (
                  <span className="text-sm text-[#0F2332]">
                    {entry?.payload?.fullLabel ?? _}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
