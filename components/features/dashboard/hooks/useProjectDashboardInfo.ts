"use client";

import { useEffect, useState } from "react";
import { client } from "@/app/utils/apiClient";

export type ProjectDashboardInfo = {
  name: string;
  description: string;
  startDate: string | null;
  lastModifiedOn: string | null;
};

export type UseProjectDashboardInfoResult = {
  project: ProjectDashboardInfo | null;
  loading: boolean;
  error: string | null;
};

export function useProjectDashboardInfo(
  projectId: string | undefined,
): UseProjectDashboardInfoResult {
  const [project, setProject] = useState<ProjectDashboardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setProject(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: res } = await client.get(
          `/projects/getProject/${projectId}`,
        );
        if (cancelled) return;
        if (res?.success && res.result) {
          const r = res.result;
          setProject({
            name: typeof r.name === "string" ? r.name : "",
            description:
              typeof r.description === "string" ? r.description : "",
            startDate: r.startDate ?? null,
            lastModifiedOn: r.lastModifiedOn ?? null,
          });
        } else {
          setError(
            typeof res?.error === "string" ? res.error : "Failed to load project",
          );
          setProject(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch project:", e);
          setError(e instanceof Error ? e.message : "Failed to load project");
          setProject(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { project, loading, error };
}
