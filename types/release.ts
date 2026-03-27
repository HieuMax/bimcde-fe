export type ReleaseStatus = "DRAFT" | "SENT";

export interface IReleaseItem {
  fileId: string;
  version: number;
  name: string;
  size: number;
  mimeType?: string;
  modifiedBy: string; // Tên người sửa
  modifiedById?: string; // ID người sửa [NEW]
  updatedAt: string; // Ngày sửa
  location: string;
  tags?: { name: string; color: string }[];
}

export interface IRelease {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  status: ReleaseStatus;
  items: IReleaseItem[];
  recipients: { _id: string; fullName: string; email: string }[]; // Populate từ BE
  createdBy: { _id: string; fullName: string };
  dueDate?: string; // [NEW]
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseDTO {
  projectId: string;
  name: string;
  description?: string;
  dueDate?: Date; // [NEW]
  items: { fileId: string; version?: number }[];
  recipients: string[];
}

export interface UpdateReleaseDTO {
  name?: string;
  description?: string;
  status?: ReleaseStatus;
  dueDate?: Date;
}
