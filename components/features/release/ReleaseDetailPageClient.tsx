"use client";

import React, { useEffect, useState } from "react";
import { releaseService } from "@/services/release.service";
import { IRelease } from "@/types/release";
import { ReleaseDetail } from "./ReleaseDetail";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ReleaseDetailPageClientProps {
  releaseId: string;
  projectId: string;
}

export const ReleaseDetailPageClient: React.FC<ReleaseDetailPageClientProps> = ({
  releaseId,
  projectId,
}) => {
  const [release, setRelease] = useState<IRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRelease = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await releaseService.getReleaseById(releaseId);
      setRelease(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load release details");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (releaseId) {
      fetchRelease(true);
    }
  }, [releaseId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#005F9E]" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <p className="text-gray-500">Release not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <ReleaseDetail
        release={release}
        onBack={() => router.push(`/projects/${projectId}/data/releases`)}
        onRefresh={() => fetchRelease(false)}
      />
    </div>
  );
};
