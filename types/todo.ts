export interface ITodo {
  _id: string;
  title: string;
  description?: string;
  status: "New" | "In Progress" | "Done" | "Closed";
  priority: "high" | "normal" | "low";
  completion: number; // 0-100
  assignees?: string[];
  type:
  | "undefined"
  | "comment"
  | "issue"
  | "request"
  | "fault"
  | "inquiry"
  | "solution"
  | "remark"
  | "clash";
  tags?: string[];
  dueDate?: string; // ISO date string
  projectId: string;
  createdBy: {
    _id: string;
    fullName?: string;
    email?: string;
  };
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  status?: "New" | "In Progress" | "Done" | "Closed";
  priority?: "high" | "normal" | "low";
  completion?: number;
  assignees?: string[];
  type?: "undefined" | "comment" | "issue" | "request" | "fault" | "inquiry" | "solution" | "remark" | "clash";
  tags?: string[];
  dueDate?: string;
  projectId: string;
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  status?: "New" | "In Progress" | "Done" | "Closed";
  priority?: "high" | "normal" | "low";
  completion?: number;
  assignees?: string[];
  type?: "undefined" | "comment" | "issue" | "request" | "fault" | "inquiry" | "solution" | "remark" | "clash";
  tags?: string[];
  dueDate?: string;
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
}
