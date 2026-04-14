import type { IView } from "@/types/view";
import {
  RELEASE_NAME_MAX_LENGTH,
  RELEASE_NOTE_MAX_LENGTH,
  sanitizeReleaseName,
  sanitizeReleaseNote,
} from "@/lib/release/createReleaseValidation";

export function getViewTagIds(view: IView): string[] {
  const raw = view.tags ?? [];
  return raw
    .map((t) => (typeof t === "string" ? t : t._id))
    .filter(Boolean);
}

export const VIEW_NAME_MAX_LENGTH = RELEASE_NAME_MAX_LENGTH;
export const VIEW_DESCRIPTION_MAX_LENGTH = RELEASE_NOTE_MAX_LENGTH;
export const VIEW_TAGS_MAX_COUNT = 20;

export type ViewEditErrors = {
  name?: string;
  description?: string;
  tags?: string;
};

export function validateViewEditInput(params: {
  nameRaw: string;
  descriptionRaw: string;
  tagIds: string[];
}): {
  errors: ViewEditErrors;
  name: string;
  description: string;
  tagIds: string[];
} {
  const errors: ViewEditErrors = {};

  const name = sanitizeReleaseName(params.nameRaw);
  if (!name) {
    errors.name = "Name is required.";
  }

  const trimmedDesc = params.descriptionRaw.trim();
  if (trimmedDesc.length > RELEASE_NOTE_MAX_LENGTH) {
    errors.description = `Description must be at most ${RELEASE_NOTE_MAX_LENGTH} characters.`;
  }
  const description = sanitizeReleaseNote(params.descriptionRaw);

  const tagIds = [...new Set(params.tagIds.filter(Boolean))];
  if (tagIds.length > VIEW_TAGS_MAX_COUNT) {
    errors.tags = `At most ${VIEW_TAGS_MAX_COUNT} tags.`;
  }

  return { errors, name, description, tagIds };
}
