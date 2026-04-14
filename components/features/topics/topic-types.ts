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
  attachments?: TopicAttachment[];
  stats: {
    comments: number;
    viewpoints: number;
    attachments: number;
  };
}

export const mockTopics: Topic[] = [
  {
    id: "t-5",
    code: "THEBU-5",
    title: "new",
    description: "new",
    assignee: "",
    type: "Issue",
    authorName: "Hao Nguyen",
    createdAt: "2026-03-12T08:45:00.000Z",
    modifiedAt: "2026-03-15T08:45:00.000Z",
    status: "New",
    priority: "Low",
    tags: ["Issue"],
    dueDate: undefined,
    assignedToMe: false,
    thumbnailUrl: "",
    stats: { comments: 0, viewpoints: 3, attachments: 1 },
  },
  {
    id: "t-4",
    code: "THEBU-4",
    title: "test Topic1",
    description: "",
    assignee: "",
    type: "Issue",
    authorName: "Tran Hoang Phuc",
    createdAt: "2026-02-21T11:25:00.000Z",
    modifiedAt: "2026-02-24T11:25:00.000Z",
    status: "New",
    priority: "Normal",
    tags: ["Issue"],
    dueDate: undefined,
    assignedToMe: false,
    thumbnailUrl: "",
    stats: { comments: 0, viewpoints: 0, attachments: 0 },
  },
  {
    id: "t-3",
    code: "THEBU-3",
    title: "example",
    description: "",
    assignee: "",
    type: "Comment",
    authorName: "Hao Nguyen",
    createdAt: "2026-02-21T11:23:00.000Z",
    modifiedAt: "2026-02-21T11:23:00.000Z",
    status: "In Progress",
    priority: "Normal",
    tags: [],
    dueDate: undefined,
    assignedToMe: false,
    thumbnailUrl: "",
    stats: { comments: 0, viewpoints: 0, attachments: 0 },
  },
  {
    id: "t-2",
    code: "THEBU-2",
    title: "aaaa",
    description: "",
    assignee: "",
    type: "Undefined",
    authorName: "Tran Hoang Phuc",
    createdAt: "2025-12-25T11:42:00.000Z",
    modifiedAt: "2026-01-02T11:42:00.000Z",
    status: "Done",
    priority: "Normal",
    tags: [],
    dueDate: undefined,
    assignedToMe: false,
    thumbnailUrl: "",
    stats: { comments: 0, viewpoints: 0, attachments: 0 },
  },
];

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
