import type {
  CdeCapabilities,
  CdeWorkflowMode,
  IFile,
  IFolder,
} from "@/types/explorer";

/** True when this file version was submitted for review by the owner (leader may promote WIP→Shared). */
export function isCurrentVersionSubmittedForReview(file: IFile): boolean {
  return (
    file.workflowStatus === "SUBMITTED_FOR_REVIEW" &&
    file.submittedForReviewVersion != null &&
    file.submittedForReviewVersion === file.currentVersion
  );
}

/** Leader can promote WIP→Shared: submitted for review, and this version not yet promoted to Shared. */
export function isWipVersionEligibleForPromoteToShared(file: IFile): boolean {
  if (!isCurrentVersionSubmittedForReview(file)) return false;
  const pv = file.wipPromotedToSharedVersion;
  if (pv == null) return true;
  return pv !== file.currentVersion;
}

function wipRevisionAlreadyPromotedToShared(file: IFile): boolean {
  const pv = file.wipPromotedToSharedVersion;
  return pv != null && pv === file.currentVersion;
}

/**
 * ISO WIP→Shared: admins (admin-uploaded) or group leaders (leader-uploaded) may promote without submit;
 * member-uploaded still requires submit + group leader.
 */
export function canPromoteWipToSharedIso(
  file: IFile,
  caps: CdeCapabilities,
): boolean {
  if (wipRevisionAlreadyPromotedToShared(file)) return false;

  const mode = file.wipDirectPromoteMode ?? "member_submit";
  if (mode === "admin_direct") {
    return !!caps.isProjectAdmin;
  }
  if (mode === "leader_direct") {
    return (
      !!caps.isGroupLeader &&
      !!file.effectiveGroupId &&
      (caps.leaderGroupIds?.includes(file.effectiveGroupId) ?? false)
    );
  }
  return !!caps.isGroupLeader && isCurrentVersionSubmittedForReview(file);
}

/**
 * Shared→Published: hide “Promote to Published” when this revision was already promoted;
 * show again after `sharedPromotedToPublishedVersion !== currentVersion` (new upload or WIP→Shared revision).
 */
export function isSharedVersionEligibleForPromoteToPublished(file: IFile): boolean {
  const pv = file.sharedPromotedToPublishedVersion;
  if (pv == null) return true;
  return Number(pv) !== Number(file.currentVersion);
}

/** POST /files/:id/promote — copy to Shared or Published only */
export type PromoteTargetStage = "SHARED" | "PUBLISHED";

export interface PromoteOption {
  targetStage: PromoteTargetStage;
  label: string;
  description: string;
}

/**
 * ISO 19650 promote actions for a file based on its parent CDE root and user caps.
 * Backend enforces the same rules; this is for UI only.
 */
export function getPromoteOptionsForFile(
  workflowMode: CdeWorkflowMode,
  parentCdeRootStage: string | null | undefined,
  caps: CdeCapabilities,
  file?: IFile | null,
): PromoteOption[] {
  if (workflowMode !== "ISO_19650") return [];

  const canWipToShared =
    !!file && canPromoteWipToSharedIso(file, caps);
  const canSharedToPublished =
    caps.isProjectAdmin &&
    !!file &&
    isSharedVersionEligibleForPromoteToPublished(file);

  const out: PromoteOption[] = [];

  if (parentCdeRootStage === "WIP" && canWipToShared) {
    out.push({
      targetStage: "SHARED",
      label: "Promote to Shared",
      description:
        "Creates a copy in your group’s Shared folder. The original stays in WIP.",
    });
  }

  if (parentCdeRootStage === "SHARED" && canSharedToPublished) {
    out.push({
      targetStage: "PUBLISHED",
      label: "Promote to Published",
      description:
        "Creates a copy under Published. The original remains in Shared.",
    });
  }

  return out;
}

/**
 * ISO: admin may move (not copy) files/folders from Shared or Published into 4. Archived.
 * CDE root folders and group home folders must not show this action — only items *inside* a group tree.
 */
export function canMoveToArchivedIso(
  workflowMode: CdeWorkflowMode,
  parentCdeRootStage: string | null | undefined,
  caps: CdeCapabilities | undefined,
  opts?: { folder?: IFolder | null },
): boolean {
  if (workflowMode !== "ISO_19650") return false;
  if (!caps?.isProjectAdmin) return false;
  if (
    parentCdeRootStage !== "SHARED" &&
    parentCdeRootStage !== "PUBLISHED"
  ) {
    return false;
  }
  const f = opts?.folder;
  if (f) {
    if (f.isCdeRoot === true) return false;
    if (f.isGroupHomeFolder === true) return false;
  }
  return true;
}
