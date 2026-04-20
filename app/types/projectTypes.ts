import { User } from "./userType";
import type { CdeWorkflowMode } from "@/types/explorer";

export class Project {
  _id?: string | number;
  name?: string;
  /** NORMAL = ACL linh hoạt; ISO_19650 = CDE WIP/Shared/Published/Archived */
  workflowMode?: CdeWorkflowMode;
  description?: string;
  startDate?: string;
  endDate?: string;
  thumbnail?: string;
  createdAt?: string;
  createdBy?: User;
  modifiedBy?: User;
  lastModifiedOn?: string;
  lastAccessed?: string;
  size?: string;
  folderCount?: number;
  filesCount?: number;
  userCount?: number;
  /** Present on `GET /projects/getProject/:id` for the current user */
  currentMemberRole?: "admin" | "user";
  isGroupLeaderInProject?: boolean;
}
