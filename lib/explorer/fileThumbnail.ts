import type { IFile, IFileVersion } from "@/types/explorer";

const RASTER_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i;

export function isLikelyRasterImageUrl(url: string): boolean {
  const u = (url || "").trim();
  if (!u) return false;
  if (u.startsWith("data:image")) return true;
  const path = u.split("?")[0].toLowerCase();
  return RASTER_EXT.test(path);
}

/** First stored revision (lowest `version` number) — “file gốc” for shell UI. */
export function getOriginalVersionRow(
  file: IFile,
): IFileVersion | undefined {
  const vs = file.versions;
  if (!vs?.length) return undefined;
  return [...vs].reduce((a, b) =>
    Number(a.version) <= Number(b.version) ? a : b,
  );
}

/** Stable key for list/properties thumbnail tied to original revision, not current. */
export function shellFileThumbnailKey(file: IFile): string {
  const row = getOriginalVersionRow(file);
  if (!row) return `${file._id}-orig-none`;
  return `${file._id}-orig-v${row.version}`;
}

/**
 * Thumbnail for **explorer shell** (properties header, etc.): always the **original**
 * upload (earliest `versions[]` row), not `currentVersion`. Newer revisions stay in history / viewer.
 */
export function resolveExplorerFileThumbnailSrc(file: IFile): string {
  const orig = getOriginalVersionRow(file);
  const origLoc = (orig?.location || "").trim();
  const mime = (orig?.mimeType || file.mimeType || "").toLowerCase();

  if (origLoc) {
    if (mime.startsWith("image/")) return origLoc;
    if (isLikelyRasterImageUrl(origLoc)) return origLoc;
  }

  const ordered: string[] = [];
  const push = (s?: string | null) => {
    const t = (s || "").trim();
    if (t) ordered.push(t);
  };

  // `thumbnail` on the file doc is usually the first upload; avoid `fileUrl`/`previewSrc` first — they often track “latest”.
  push(file.thumbnail);
  push(origLoc);
  push(file.previewSrc);
  push(file.fileUrl);

  if (mime.startsWith("image/")) {
    for (const u of ordered) {
      if (u) return u;
    }
  }

  for (const u of ordered) {
    if (isLikelyRasterImageUrl(u)) return u;
  }

  for (const u of ordered) {
    if (u) return u;
  }

  return "/placeholder-image.png";
}

export type VersionThumbRow = {
  location?: string;
  previewSrc?: string;
  thumbnail?: string;
  mimeType?: string;
  fileName?: string;
};

/** Best-effort preview URL for one revision row (version history lists). */
export function resolveVersionRowThumbnailSrc(ver: VersionThumbRow): string | null {
  const mime = (ver.mimeType || "").toLowerCase();
  const loc = (ver.location || "").trim();
  if (mime.startsWith("image/") && loc) return loc;
  if (loc && isLikelyRasterImageUrl(loc)) return loc;

  const ordered = [ver.previewSrc, ver.thumbnail, loc]
    .map((x) => (x || "").trim())
    .filter(Boolean);

  if (mime.startsWith("image/")) {
    for (const u of ordered) {
      if (u) return u;
    }
  }

  for (const u of ordered) {
    if (isLikelyRasterImageUrl(u)) return u;
  }

  return null;
}
