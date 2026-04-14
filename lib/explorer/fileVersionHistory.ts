import type { IFile, IFileVersion, IFolder, IFolderVersion } from "@/types/explorer";

type LooseVersion = Partial<IFileVersion> & { version: number };

/** One row for explorer / viewer history (flat list + optional ISO stage badges). */
export type FileHistoryRow = LooseVersion & { stageLabels: string[] };

/** All stored revisions, sorted newest-first by numeric `version` (independent of currentVersion). */
export function getAllFileVersionsSortedNewestFirst(file: IFile): LooseVersion[] {
  const fromVersions = file.versions;
  const fromHistory = file.versionHistory;
  const raw: LooseVersion[] =
    fromVersions && fromVersions.length > 0
      ? (fromVersions as LooseVersion[])
      : fromHistory && fromHistory.length > 0
        ? fromHistory.map((h) => ({
            version: h.version,
            fileName: h.fileName,
            size: h.size,
            mimeType: h.mimeType,
            location: h.location,
            createdAt: h.createdAt,
            uploadedBy: h.uploadedBy
              ? {
                  _id: "",
                  fullName: h.uploadedBy.fullName ?? "Unknown",
                  email: h.uploadedBy.email,
                }
              : "Unknown",
          }))
        : [];
  return [...raw].sort((a, b) => Number(b.version) - Number(a.version));
}

export function getAllFolderVersionsSortedNewestFirst(
  folder: IFolder,
): IFolderVersion[] {
  const raw = folder.versions ?? [];
  return [...raw].sort((a, b) => Number(b.version) - Number(a.version));
}

/** Prefer ISO unified chain from API; otherwise single-document versions (no labels). */
export function buildFileHistoryRows(file: IFile): FileHistoryRow[] {
  const unified = file.unifiedVersionHistory;
  if (unified && unified.length > 0) {
    return unified.map((row) => ({
      version: row.version,
      fileName: row.fileName ?? "",
      size: row.size ?? 0,
      mimeType: row.mimeType ?? "",
      location: row.location ?? "",
      createdAt: row.createdAt ?? "",
      uploadedBy: row.uploadedBy
        ? {
            _id: "",
            fullName: row.uploadedBy.fullName ?? "Unknown",
            email: row.uploadedBy.email,
          }
        : "Unknown",
      stageLabels: [...row.stageLabels],
    }));
  }
  return getAllFileVersionsSortedNewestFirst(file).map((v) => ({
    ...v,
    stageLabels: [] as string[],
  }));
}
