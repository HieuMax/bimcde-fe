
export type TopicPriority = "Low" | "Normal" | "High" | "Critical";
export type TopicStatus = "New" | "In Progress" | "Waiting" | "Done" | "Closed";
export type TopicType = "Undefined" | "Comment" | "Issue" | "Request" | "Fault" | "Inquiry" | "Solution" | "Remark" | "Clash" | "Opo";

export interface TopicItem {
  _id: string;
  topicKey: string;
  title: string;
  description?: string;
  projectId: string;
  fileId?: string | null;
  linkedFileVersion?: number | null;
  
  priority: TopicPriority;
  status: TopicStatus;
  type: TopicType;
  
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  
  thumbnailUrl?: string;
  
  createdBy: {
      _id: string;
      fullName: string;
      email?: string;
  };
  updatedBy?: {
      _id: string;
      fullName: string;
      email?: string;
  };
  createdAt: string; 
  updatedAt?: string;

  snapshots?: {
      _id?: string;
      thumbnailUrl?: string;
      viewState?: any;
      items?: any[];
  }[];

  // items?: any[];
    items: Array<{
    modelID: number;
    expressID: number;
    fileUrl: string;
  }>;
  viewState?: any;
  references?: any[]
}

export interface TopicFilters {
  status?: string;
  assignee?: string;
  createdBy?: string;
  search?: string;
  sortBy?: "date-created" | "name" | "date-modified";
}
