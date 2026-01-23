import React from "react";
import { ReleaseStatus } from "@/types/release";
import { Check, Pencil } from "lucide-react";

interface ReleaseStatusBadgeProps {
  status: ReleaseStatus;
}

export const ReleaseStatusBadge: React.FC<ReleaseStatusBadgeProps> = ({
  status,
}) => {
  if (status === "SENT") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded bg-[#72A544] text-white text-xs font-medium">
        <Check className="w-3 h-3 mr-1" />
        Sent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium">
      <Pencil className="w-3 h-3 mr-1" />
      Draft
    </span>
  );
};
