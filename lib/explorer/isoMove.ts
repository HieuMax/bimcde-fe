import type { CdeWorkflowMode, IFile, IFolder } from "@/types/explorer";

/**
 * ISO 19650: items being moved together must share one effective group (from explorer API).
 * Returns "mixed" when selection spans different groups.
 */
export function getIsoMoveRestrictEffectiveGroupId(
  workflowMode: CdeWorkflowMode,
  items: (IFile | IFolder)[],
): string | null | "mixed" {
  if (workflowMode !== "ISO_19650" || items.length === 0) return null;
  const ids = items.map((i) =>
    "effectiveGroupId" in i && i.effectiveGroupId != null && i.effectiveGroupId !== ""
      ? i.effectiveGroupId
      : null,
  );
  const nonNull = ids.filter((x): x is string => x != null);
  if (nonNull.length === 0) return null;
  const first = nonNull[0];
  if (nonNull.every((x) => x === first)) return first;
  return "mixed";
}
