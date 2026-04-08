/**
 * Shared folder name rules (aligned with BE folderNameValidation).
 */

const INVALID_FOLDER_NAME_CHARS = /[\\/:*?"<>|]/;

export const MAX_FOLDER_NAME_LENGTH = 150;

export const MAX_FOLDER_NESTING_DEPTH = 7;

export type FolderNameValidationResult =
  | { valid: true; trimmedName: string }
  | { valid: false; message: string };

export function validateFolderName(
  rawName: string,
): FolderNameValidationResult {
  const name = rawName.trim();

  if (name.length === 0) {
    return { valid: false, message: "Folder name is required." };
  }

  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    return {
      valid: false,
      message: `Folder name must be at most ${MAX_FOLDER_NAME_LENGTH} characters.`,
    };
  }

  if (INVALID_FOLDER_NAME_CHARS.test(name)) {
    return {
      valid: false,
      message: "Folder names must not contain special characters.",
    };
  }

  return { valid: true, trimmedName: name };
}
