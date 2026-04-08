import type {
  CdeCapabilities,
  CdeWorkflowMode,
  IFile,
  IFolder,
} from "@/types/explorer";

const SHARED_PUBLISHED_ARCHIVED = new Set([
  "SHARED",
  "PUBLISHED",
  "ARCHIVED",
]);

function isSharedPublishedArchivedStage(
  stage: string | null | undefined,
): boolean {
  return stage != null && SHARED_PUBLISHED_ARCHIVED.has(stage);
}

function getFileCreatorId(file: IFile): string | null {
  const firstVersionUploader = file.versions?.[0]?.uploadedBy;
  if (
    firstVersionUploader &&
    typeof firstVersionUploader === "object" &&
    "_id" in firstVersionUploader
  ) {
    return String(firstVersionUploader._id);
  }
  if (typeof firstVersionUploader === "string") {
    return firstVersionUploader;
  }
  if (typeof file.createdBy === "string") {
    return file.createdBy;
  }
  return null;
}

/**
 * ISO 19650 folder properties panel: "full" vs read-mostly "basic" (download, activity, history, comments).
 * Root CDE folders & group home → basic for non-admin; WIP → leader of group subtree or folder creator full;
 * Shared / Published / Archived → only project admin full; group leaders & members basic.
 */
export function getFolderIsoPanelAccess(
  workflowMode: CdeWorkflowMode,
  caps: CdeCapabilities | undefined,
  folder: IFolder,
  currentUserId?: string,
): "full" | "basic" {
  if (workflowMode !== "ISO_19650") return "full";
  if (!caps) return "full";
  if (caps.isProjectAdmin) return "full";

  if (folder.isGroupHomeFolder) return "basic";

  const leaderIds = caps.leaderGroupIds ?? [];
  const isLeader = caps.isGroupLeader && leaderIds.length > 0;

  const isRootLevel = folder.parentId === null;
  if (isRootLevel) return "basic";

  if (folder.parentCdeRootStage === "WIP") {
    const effectiveGroupId = folder.effectiveGroupId ?? null;
    if (isLeader && effectiveGroupId && leaderIds.includes(effectiveGroupId)) {
      return "full";
    }
    const createdById = folder.createdById;
    if (currentUserId && createdById && currentUserId === createdById) {
      return "full";
    }
    return "basic";
  }

  if (isSharedPublishedArchivedStage(folder.parentCdeRootStage)) {
    return "basic";
  }

  return "full";
}

/**
 * ISO 19650 file properties panel: Shared / Published / Archived → only admin full.
 * WIP → same as before: admin, group leader, or file creator full; others basic.
 */
export function getFileIsoPanelAccess(
  workflowMode: CdeWorkflowMode,
  caps: CdeCapabilities | undefined,
  file: IFile,
  currentUserId?: string,
): "full" | "basic" {
  if (workflowMode !== "ISO_19650") return "full";
  if (!caps) return "full";
  if (caps.isProjectAdmin) return "full";

  if (isSharedPublishedArchivedStage(file.parentCdeRootStage)) {
    return "basic";
  }

  if (file.parentCdeRootStage === "WIP") {
    const leaderIds = caps.leaderGroupIds ?? [];
    const isLeader = caps.isGroupLeader && leaderIds.length > 0;
    if (isLeader) return "full";
    const creatorId = getFileCreatorId(file);
    if (currentUserId && creatorId && currentUserId === creatorId) {
      return "full";
    }
    return "basic";
  }

  return "full";
}
