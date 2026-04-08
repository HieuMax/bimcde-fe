import type {
  CdeCapabilities,
  CdeWorkflowMode,
  IFile,
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
    caps.isGroupLeader &&
    !!file &&
    isWipVersionEligibleForPromoteToShared(file);
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

/** ISO: admin may move (not copy) files/folders from Shared or Published into 4. Archived via the move picker. */
export function canMoveToArchivedIso(
  workflowMode: CdeWorkflowMode,
  parentCdeRootStage: string | null | undefined,
  caps: CdeCapabilities | undefined,
): boolean {
  if (workflowMode !== "ISO_19650") return false;
  if (!caps?.isProjectAdmin) return false;
  return (
    parentCdeRootStage === "SHARED" || parentCdeRootStage === "PUBLISHED"
  );
}
