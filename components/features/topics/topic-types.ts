export type TopicStatus = "New" | "In Progress" | "Waiting" | "Done" | "Closed";

export type TopicPriority = "Low" | "Normal" | "High" | "Critical";

export type TopicType =
  | "Undefined"
  | "Comment"
  | "Issue"
  | "Request"
  | "Fault"
  | "Inquiry"
  | "Solution"
  | "Remark"
  | "Clash";

export type TopicAttachment = {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  fileId?: string;
};

export interface Topic {
  id: string;
  code: string;
  title: string;
  description?: string;
  assignee?: string;
  type: TopicType;
  authorName: string;
  createdAt: string;
  modifiedAt: string;
  status: TopicStatus;
  priority: TopicPriority;
  tags: string[];
  dueDate?: string;
  assignedToMe?: boolean;
  thumbnailUrl?: string;
  snapshots?: {
    thumbnailUrl?: string;
    viewState?: unknown;
    items?: unknown[];
  }[];
  viewState?: unknown;
  items?: unknown[];
  attachments?: TopicAttachment[];
  stats: {
    comments: number;
    viewpoints: number;
    attachments: number;
  };
}

export function formatTopicDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
