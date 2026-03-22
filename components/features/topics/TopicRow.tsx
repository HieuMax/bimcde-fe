"use client";

import React from "react";
import { MoreVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topic, TopicPriority, TopicStatus } from "./topic-types";
import { formatTopicDateTime } from "./topic-types";

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "gray" | "green" | "yellow" | "red" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "yellow"
        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
        : tone === "red"
          ? "bg-red-50 text-red-700 border-red-200"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${cls}`}>
      {label}
    </span>
  );
}

export interface TopicRowProps {
  topic: Topic;
  selected: boolean;
  onSelect: () => void;
}

export const TopicRow: React.FC<TopicRowProps> = React.memo(
  ({ topic, selected, onSelect }) => {
    const statusTone: Record<TopicStatus, "gray" | "green" | "yellow" | "red" | "blue"> = {
      New: "green",
      "In Progress": "yellow",
      Done: "gray",
      Waiting: "yellow",
      Closed: "gray",
    };

    return (
      <div
        className={`group flex items-stretch border-b border-gray-200 cursor-pointer ${
          selected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
        }`}
        onClick={onSelect}
      >
        <div className="w-28 shrink-0 border-r border-gray-100 bg-white flex items-center justify-center">
          <div className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center">
            {topic.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={topic.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-gray-500">{topic.code}</div>
              <div className="text-sm font-medium text-gray-900 truncate">{topic.title}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                Created by: {topic.authorName}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Pill
                  label={topic.priority}
                  tone={(topic.priority === "Low" ? "green" : "gray") as
                    | "green"
                    | "gray"
                    | "yellow"
                    | "red"
                    | "blue"}
                />
                <Pill label={topic.status} tone={statusTone[topic.status]} />
                {topic.tags.map((t) => (
                  <Pill
                    key={t}
                    label={t}
                    tone={(t === "Issue" ? "red" : "gray") as
                      | "red"
                      | "gray"
                      | "green"
                      | "yellow"
                      | "blue"}
                  />
                ))}
              </div>
            </div>

            <div className="shrink-0 text-xs text-gray-500 pt-1">
              {formatTopicDateTime(topic.modifiedAt)}
            </div>
          </div>
        </div>

        <div className="w-10 shrink-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            title="More"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
    );
  },
);

TopicRow.displayName = "TopicRow";

