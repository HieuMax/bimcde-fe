export const TOPIC_TITLE_MAX_LENGTH = 200;
export const TOPIC_DESCRIPTION_MAX_LENGTH = 5000;
export const TOPIC_ASSIGNEE_MAX_LENGTH = 200;
export const TOPIC_TAGS_MAX_COUNT = 20;
export const TOPIC_TAG_MAX_LENGTH = 48;
export const TOPIC_ATTACHMENTS_MAX_COUNT = 50;

export const DEFAULT_TOPIC_TYPES = [
  "Undefined",
  "Comment",
  "Issue",
  "Request",
  "Fault",
  "Inquiry",
  "Solution",
  "Remark",
  "Clash",
] as const;

export const DEFAULT_TOPIC_STATUSES = [
  "New",
  "In Progress",
  "Waiting",
  "Done",
  "Closed",
] as const;

export const DEFAULT_TOPIC_PRIORITIES = [
  "Low",
  "Normal",
  "High",
  "Critical",
] as const;

export type TopicFormErrors = {
  title?: string;
  description?: string;
  assignee?: string;
  type?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  tags?: string;
  references?: string;
};

function stripRiskyMarkup(s: string, maxLen: number): string {
  let out = s;
  out = out.replace(/<\s*\/?\s*script[^>]*>/gi, "");
  out = out.replace(/<\s*\/?\s*iframe[^>]*>/gi, "");
  out = out.replace(/<\s*script\b/gi, "");
  out = out.replace(/[<>]/g, "");
  out = out.replace(/javascript\s*:/gi, "");
  out = out.replace(/data\s*:\s*text\/html/gi, "");
  out = out.replace(/on\w+\s*=/gi, "");
  out = out.replace(/\s+/g, " ").trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).trim();
  return out;
}

/** Title: trim, strip risky HTML/script patterns, cap length */
export function sanitizeTopicTitle(raw: string): string {
  let s = raw.trim();
  s = s.replace(/<\s*\/?\s*script[^>]*>/gi, "");
  s = s.replace(/<\s*script\b/gi, "");
  s = s.replace(/[<>]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > TOPIC_TITLE_MAX_LENGTH) {
    s = s.slice(0, TOPIC_TITLE_MAX_LENGTH).trim();
  }
  return s;
}

/** Description: free text — stronger XSS-oriented cleanup */
export function sanitizeTopicDescription(raw: string): string {
  return stripRiskyMarkup(raw, TOPIC_DESCRIPTION_MAX_LENGTH);
}

/** Assignee display / id string from selector */
export function sanitizeTopicAssignee(raw: string): string {
  let s = raw.trim();
  s = s.replace(/<\s*\/?\s*script[^>]*>/gi, "");
  s = s.replace(/<\s*script\b/gi, "");
  s = s.replace(/[<>]/g, "");
  if (s.length > TOPIC_ASSIGNEE_MAX_LENGTH) {
    s = s.slice(0, TOPIC_ASSIGNEE_MAX_LENGTH).trim();
  }
  return s;
}

function sanitizeSingleTag(raw: string): string {
  return stripRiskyMarkup(raw, TOPIC_TAG_MAX_LENGTH);
}

export function sanitizeTopicTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const s = sanitizeSingleTag(String(t));
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= TOPIC_TAGS_MAX_COUNT) break;
  }
  return out;
}

function inList(value: string, allowed: string[], label: string): string | undefined {
  if (!allowed.length) return undefined;
  if (!allowed.includes(value)) {
    return `Invalid ${label}.`;
  }
  return undefined;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function validateTopicForm(params: {
  titleRaw: string;
  descriptionRaw: string;
  assigneeRaw: string;
  type: string;
  priority: string;
  status: string;
  dueDate: Date | undefined;
  tags: string[];
  allowedTypes: string[];
  allowedStatuses: string[];
  allowedPriorities: string[];
  pendingAttachmentsCount?: number;
}): {
  errors: TopicFormErrors;
  title: string;
  description: string;
  assignee: string;
  type: string;
  priority: string;
  status: string;
  /** Set only when a valid due date is selected (use `?? null` on update to clear). */
  dueDateIso?: string;
  tags: string[];
} {
  const errors: TopicFormErrors = {};

  const title = sanitizeTopicTitle(params.titleRaw);
  if (!title) {
    errors.title = "Title is required.";
  }

  const description = sanitizeTopicDescription(params.descriptionRaw);

  const trimmedDesc = params.descriptionRaw.trim();
  if (trimmedDesc.length > TOPIC_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${TOPIC_DESCRIPTION_MAX_LENGTH} characters.`;
  }

  const assignee = sanitizeTopicAssignee(params.assigneeRaw);
  if (params.assigneeRaw.trim().length > TOPIC_ASSIGNEE_MAX_LENGTH) {
    errors.assignee = `Assignee must be at most ${TOPIC_ASSIGNEE_MAX_LENGTH} characters.`;
  }

  const typeErr = inList(params.type, params.allowedTypes, "type");
  if (typeErr) errors.type = typeErr;

  const statusErr = inList(params.status, params.allowedStatuses, "status");
  if (statusErr) errors.status = statusErr;

  const priorityErr = inList(params.priority, params.allowedPriorities, "priority");
  if (priorityErr) errors.priority = priorityErr;

  let dueDateIso: string | undefined;
  if (params.dueDate !== undefined && params.dueDate !== null) {
    if (!isValidDate(params.dueDate)) {
      errors.dueDate = "Due date is invalid.";
    } else {
      dueDateIso = params.dueDate.toISOString();
    }
  }

  const tags = sanitizeTopicTags(params.tags);
  if (params.tags.length > TOPIC_TAGS_MAX_COUNT) {
    errors.tags = `At most ${TOPIC_TAGS_MAX_COUNT} tags allowed.`;
  }
  for (const t of params.tags) {
    if (String(t).trim().length > TOPIC_TAG_MAX_LENGTH) {
      errors.tags = `Each tag must be at most ${TOPIC_TAG_MAX_LENGTH} characters.`;
      break;
    }
  }

  const pending = params.pendingAttachmentsCount ?? 0;
  if (pending > TOPIC_ATTACHMENTS_MAX_COUNT) {
    errors.references = `At most ${TOPIC_ATTACHMENTS_MAX_COUNT} references before save.`;
  }

  return {
    errors,
    title,
    description,
    assignee,
    type: params.type,
    priority: params.priority,
    status: params.status,
    dueDateIso,
    tags,
  };
}
