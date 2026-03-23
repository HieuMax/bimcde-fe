
export type TopicPriority = "Low" | "Normal" | "High" | "Critical";
export type TopicStatus = "New" | "In Progress" | "Waiting" | "Done" | "Closed";
export type TopicType = "Undefined" | "Comment" | "Issue" | "Request" | "Fault" | "Inquiry" | "Solution" | "Remark" | "Clash" | "Opo";

export interface TopicItem {
  _id: string;
  topicKey: string; // Ví dụ: "THEBU-5", "THEBU-4"
  title: string;
  description?: string;
  projectId: string;
  
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

  items?: any[];
  viewState?: any;
  references?: any[]
}

export interface TopicFilters {
  status?: string;
  assignee?: string;
  createdBy?: string;
  search?: string;
}