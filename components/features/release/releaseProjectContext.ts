import type { CdeWorkflowMode } from "@/types/explorer";
import type { IRelease } from "@/types/release";

export type ProjectReleaseContext = {
  workflowMode: CdeWorkflowMode;
  currentMemberRole: "admin" | "user";
  isGroupLeaderInProject: boolean;
};

export function parseProjectReleaseContext(
  raw: Record<string, unknown> | null | undefined,
): ProjectReleaseContext | null {
  if (!raw) return null;
  const mode = (raw.workflowMode as CdeWorkflowMode) || "NORMAL";
  const roleRaw = (raw.currentMemberRole as string | undefined)?.toLowerCase();
  const currentMemberRole = roleRaw === "admin" ? "admin" : "user";
  return {
    workflowMode: mode,
    currentMemberRole,
    isGroupLeaderInProject: !!raw.isGroupLeaderInProject,
  };
}

export function canCreateReleaseForProject(ctx: ProjectReleaseContext | null) {
  if (!ctx) return false;
  if (ctx.workflowMode === "ISO_19650") {
    return ctx.currentMemberRole === "admin" || ctx.isGroupLeaderInProject;
  }
  return true;
}

export function getReleaseCreatorId(release: IRelease): string {
  const c = release.createdBy as { _id?: string } | string | undefined;
  if (c && typeof c === "object" && "_id" in c && c._id) return String(c._id);
  if (typeof c === "string") return c;
  return "";
}

export function canMutateReleaseDraft(
  release: IRelease,
  ctx: ProjectReleaseContext | null,
  currentUserId: string | undefined,
): boolean {
  if (!release || !ctx || !currentUserId) return false;
  if (release.status !== "DRAFT") return false;
  if (ctx.currentMemberRole === "admin") return true;
  return getReleaseCreatorId(release) === currentUserId;
}
