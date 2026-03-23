/* ===================== FILE ===================== */

export type FileType = "PDF" | "IMAGE";

export interface FileVersion {
  version: number;
  location: string;
  mimeType?: string;
  uploadedBy?: string;
}

export interface FileItem {
  _id: string;
  name: string;
  projectId: string;

  fileUrl: string;
  fileType: FileType;

  previewSrc?: string;
  uploadedBy?: string;

  createdAt?: string;
  versions?: FileVersion[];
  currentVersion?: number;
}

export interface FileDetail {
  id: string;
  name: string;

  currentVersion: number;
  size?: number;
  mimeType?: string;

  location?: string;
  fileUrl?: string;

  createdAt?: string;
  createdBy?: string;

  updatedAt?: string;
  modifiedBy?: string;

  isLocked?: boolean;
  lockedBy?: string;
}

/* ===================== PAGE ===================== */

export interface PageItem {
  _id: string;
  index: number;
  pageNumber?: number;
  fileId: string;
  imageSrc?: string;
  source?: "pdf" | "file" | "view";
}

/* ===================== VIEW 2D ===================== */

export interface View2DItem {
  _id: string;
  name?: string;

  projectId: string;
  fileId: string | FileItem;

  previewSrc?: string;

  pageIndex?: number;
  scale?: number;
  rotation?: number;

  createdBy?: string;
  createdAt?: string;
  assignedTo?: string;
}

/* ===================== API RESPONSE ===================== */

export interface FileDetailResponse {
  _id: string;
  name: string;
  projectId: string;

  versions: FileVersion[];
  currentVersion: number;

  createdAt?: string;
}

/* ===================== TODO ===================== */

export interface TodoItem {
  _id: string;
  title: string;
  description?: string;
  status?: "open" | "in_progress" | "done";
  relatedImage?: string;
  viewId?: string;
  createdAt?: string;
}
