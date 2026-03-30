import { IFolder } from "@/types/explorer";
import { MAX_FOLDER_NESTING_DEPTH } from "@/lib/folderValidation";

/**
 * Depth of the folder that would be the parent of a newly created subfolder.
 * At project root (no current folder): 0. Inside folder C with ancestors [A,B]: depth(C) = 3.
 */
export function getParentDepthForCreate(
  ancestors: IFolder[],
  currentFolder: IFolder | null
): number {
  if (!currentFolder) return 0;
  return ancestors.length + 1;
}

/**
 * Depth of a new folder if created in the current explorer location.
 * Root: 1. Child of depth-3 folder: 4.
 */
export function getNewFolderDepthForCreate(
  ancestors: IFolder[],
  currentFolder: IFolder | null
): number {
  return getParentDepthForCreate(ancestors, currentFolder) + 1;
}

/**
 * True if creating a subfolder here would exceed max nesting (aligned with BE).
 */
export function wouldExceedMaxNesting(
  ancestors: IFolder[],
  currentFolder: IFolder | null
): boolean {
  return (
    getNewFolderDepthForCreate(ancestors, currentFolder) >
    MAX_FOLDER_NESTING_DEPTH
  );
}
