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
    | "TODO"
    | "RESTORE";
  actionType: string;
  target: {
    itemId: string;
    itemModel:
      | "File"
      | "Folder"
      | "View"
      | "Release"
      | "Topic"
      | "Todo"
      | "Account";
    itemName: string;
  };
  description?: string;
  metaData?: ActivityMetaData;
  createdAt: string;
  isRestorable?: boolean;
  restoreStatus?: "NONE" | "RESTORED" | "RESTORABLE";
  /** Set by GET /activities/item for File targets — explorer folder deep link */
  fileFolderId?: string | null;
}

export interface ActivityItemFilterParams {
  projectId: string;
  fileId?: string;
  folderId?: string;
  page?: number;
  limit?: number;
  lightweight?: boolean;
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
  /** Skip restoreStatus checks for faster response (e.g. recent activity widget) */
  lightweight?: boolean;
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
