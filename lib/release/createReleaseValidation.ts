import { format } from "date-fns";

export const RELEASE_NAME_MAX_LENGTH = 150;
export const RELEASE_NOTE_MAX_LENGTH = 500;

export function sanitizeReleaseName(raw: string): string {
  let s = raw.trim();
  s = s.replace(/<\s*\/?\s*script[^>]*>/gi, "");
  s = s.replace(/<\s*script\b/gi, "");
  s = s.replace(/[<>]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > RELEASE_NAME_MAX_LENGTH) {
    s = s.slice(0, RELEASE_NAME_MAX_LENGTH).trim();
  }
  return s;
}

export function sanitizeReleaseNote(raw: string): string {
  let s = raw;
  s = s.replace(/<\s*\/?\s*script[^>]*>/gi, "");
  s = s.replace(/<\s*\/?\s*iframe[^>]*>/gi, "");
  s = s.replace(/<\s*script\b/gi, "");
  s = s.replace(/[<>]/g, "");
  s = s.replace(/javascript\s*:/gi, "");
  s = s.replace(/data\s*:\s*text\/html/gi, "");
  s = s.replace(/on\w+\s*=/gi, "");
  s = s.trim();
  if (s.length > RELEASE_NOTE_MAX_LENGTH) {
    s = s.slice(0, RELEASE_NOTE_MAX_LENGTH).trim();
  }
  return s;
}

/** `yyyy-MM-dd` — end of that UTC calendar day must be after now */
export function isDueDateInFuture(isoYmd: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoYmd.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const endUtc = new Date(Date.UTC(y, mo, da, 23, 59, 59, 999));
  return endUtc.getTime() > Date.now();
}

export function dueDateToPayloadString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export type CreateReleaseFieldErrors = {
  name?: string;
  dueDate?: string;
  note?: string;
};

export function validateCreateReleaseInput(params: {
  nameRaw: string;
  dueDate: Date | undefined;
  noteRaw: string;
  noteEnabled: boolean;
}): { errors: CreateReleaseFieldErrors; name: string; dueIso: string; note: string } {
  const errors: CreateReleaseFieldErrors = {};

  const name = sanitizeReleaseName(params.nameRaw);
  if (!name) {
    errors.name = "Release name is required.";
  }

  let dueIso = "";
  if (!params.dueDate) {
    errors.dueDate = "Due date is required.";
  } else {
    dueIso = dueDateToPayloadString(params.dueDate);
    if (!isDueDateInFuture(dueIso)) {
      errors.dueDate = "Due date must be in the future.";
    }
  }

  let note = "";
  if (params.noteEnabled) {
    const trimmedNote = params.noteRaw.trim();
    if (trimmedNote.length > RELEASE_NOTE_MAX_LENGTH) {
      errors.note = `Note must be at most ${RELEASE_NOTE_MAX_LENGTH} characters.`;
    }
    note = sanitizeReleaseNote(params.noteRaw);
  }

  return { errors, name, dueIso, note };
}
