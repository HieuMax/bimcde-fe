/**
 * Explorer upload rules — keep in sync with bimcde-be fileUpload.validation.ts
 */

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Max files in one Explorer upload action — keep in sync with BE MAX_FILES_PER_UPLOAD */
export const MAX_FILES_PER_UPLOAD = 5;

/** Project storage cap — keep in sync with BE PROJECT_STORAGE_LIMIT_BYTES */
export const PROJECT_STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

export const MAX_FILENAME_LENGTH = 150;

/** Lowercase extensions allowed in BIM CDE (viewer + documents) */
export const ALLOWED_FILE_EXTENSIONS = [
  "ifc",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "doc",
  "docx",
  "docs",
] as const;

const ALLOWED_SET = new Set<string>(ALLOWED_FILE_EXTENSIONS);

export function getFileExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i + 1).toLowerCase();
}

export function sanitizeExplorerFileName(original: string): string {
  const base = original.replace(/^.*[/\\]/, "");
  const lastDot = base.lastIndexOf(".");
  const extRaw = lastDot >= 0 ? base.slice(lastDot) : "";
  let stem = lastDot >= 0 ? base.slice(0, lastDot) : base;
  stem = stem
    .replace(/[^\p{L}\p{N}\s.\-_]/gu, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (!stem) stem = "file";
  const ext = extRaw.toLowerCase();
  let full = `${stem}${ext}`;
  if (full.length > MAX_FILENAME_LENGTH) {
    const maxStem = Math.max(1, MAX_FILENAME_LENGTH - ext.length);
    full = `${stem.slice(0, maxStem)}${ext}`;
  }
  return full;
}

export type ClientFileValidationError = {
  fileName: string;
  message: string;
};

export function validateExplorerFileClient(file: File): ClientFileValidationError | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      fileName: file.name,
      message: `File exceeds 100 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }
  if (file.size <= 0) {
    return { fileName: file.name, message: "File is empty." };
  }
  const ext = getFileExtension(file.name);
  if (!ext || !ALLOWED_SET.has(ext)) {
    return {
      fileName: file.name,
      message: `Not allowed. Use: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`,
    };
  }
  return null;
}

/** react-dropzone `accept` map */
export const EXPLORER_UPLOAD_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/octet-stream": [".ifc"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

export function prepareExplorerUploadFile(file: File): File {
  const sanitized = sanitizeExplorerFileName(file.name);
  if (sanitized === file.name) return file;
  return new File([file], sanitized, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
