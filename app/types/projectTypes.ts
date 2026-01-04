import { User } from "./userType";

export class Project {
  _id?: string | number;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  thumbnail?: string;
  createdAt?: string;
  createdBy?: User;
  modifiedBy?: User;
  lastModifiedOn?: string;
  lastVisitedOn?: string;
  size?: string;
  folderCount?: number;
  filesCount?: number;
  userCount?: number;
}
