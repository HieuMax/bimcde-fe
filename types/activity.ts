export interface IActivity {
  _id: string;
  projectId: string;
  actor: {
    userId: string;
    fullName: string;
    email?: string;
  };
  actionGroup:
    | "FILE"
    | "FOLDER"
    | "MEMBER"
    | "VIEW"
    | "RELEASE"
    | "TOPIC"
    | "RESTORE";
  actionType: string;
  target: {
    itemId: string;
    itemModel: "File" | "Folder" | "View" | "Release" | "Topic" | "Account";
    itemName: string;
  };
  description?: string;
  metaData?: ActivityMetaData;
  createdAt: string;
  isRestorable?: boolean;
  restoreStatus?: "NONE" | "RESTORED" | "RESTORABLE";
}

export interface ActivityFilterParams {
  projectId: string;
  userId?: string;
  groupIds?: string;
  actionGroup?: string;
  actionTypes?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

export interface ActivityResponse {
  data: IActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityMetaData {
  oldName?: string;
  newName?: string;
  relatedFileName?: string;
}
