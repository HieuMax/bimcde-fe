/**
 * Rename rules aligned with BE folderNameValidation + file rename (stem only).
 */

import {
  validateFolderName,
  type FolderNameValidationResult,
} from "@/lib/folderValidation";
import { MAX_FILENAME_LENGTH } from "@/lib/explorer/uploadConstraints";

const INVALID_NAME_CHARS = /[\\/:*?"<>|]/;

export type RenameValidationResult =
  | { valid: true; trimmed: string }
  | { valid: false; message: string };

/** Full folder name (same rules as create folder). */
export function validateFolderRename(rawName: string): RenameValidationResult {
  const r: FolderNameValidationResult = validateFolderName(rawName);
  if (!r.valid) return { valid: false, message: r.message };
  return { valid: true, trimmed: r.trimmedName };
}

/**
 * File rename: user edits stem only; extension is preserved from `originalFullName`.
 */
export function validateFileRenameStem(
  stemRaw: string,
  originalFullName: string,
): RenameValidationResult {
  const stem = stemRaw.trim();
  if (!stem) {
    return { valid: false, message: "File name is required." };
  }

  const lastDot = originalFullName.lastIndexOf(".");
  const ext = lastDot > 0 ? originalFullName.slice(lastDot) : "";
  const maxStem = Math.max(1, MAX_FILENAME_LENGTH - ext.length);

  if (stem.length > maxStem) {
    return {
      valid: false,
      message: `Name is too long (max ${maxStem} characters before ${ext || "extension"}).`,
    };
  }

  if (INVALID_NAME_CHARS.test(stem)) {
    return {
      valid: false,
      message:
        'Name must not contain: \\ / : * ? " < > |',
    };
  }

  return { valid: true, trimmed: stem };
}
