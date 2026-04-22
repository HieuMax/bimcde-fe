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
  description?: string;
  projectId: string;
  fileId: string | FileItem;

  previewSrc?: string;
  thumbnailUrl?: string;
  viewState?: ViewState;

  pageIndex?: number;
  scale?: number;
  rotation?: number;

  createdBy?: string | { _id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string;
  /** Người nhận share (user/group) — dùng cho tab list & panel */
  sharedWith?: {
    isPublic?: boolean;
    users?: Array<{
      userId?: string;
      fullName?: string;
      email?: string;
      label?: string;
      type?: string;
    }>;
  };
}

export type ViewMode = "list" | "grid";

export type ToolType = "cursor" | "hand" | "pentagon" | "cloud" | "rectangle" | "circle" | "pencil" | "arrow" | "text" | "measure";

export interface IAnnotation {
  id: string;
  type: ToolType;
  color?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  points?: IPoint[];
  text?: string;
  fontSize?: number;
}

export interface View2DMarkup {
  annotations: IAnnotation[];
}

export interface ViewState {
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    up: { x: number; y: number; z: number };
    projection: "ORTHO" | "PERSPECTIVE";
    zoom: number;
  };
  markupData?: View2DMarkup | string;
  /** Revision của file khi lưu view (cùng fileId, khác version URL) */
  fileVersion?: number;

  hiddenElements?: string[];
  selectedElements?: string[];
  coloredElements?: { color: string; elementIds: string[] }[];
  sectionPlanes?: any[];
}
export interface IPoint {
  x: number;
  y: number;
}
export interface CreateView2DDTO {
  name: string;
  description?: string;
  projectId: string;
  fileId: string;
  createdBy: string;
  assignedTo?: string;
  /** Gửi kèm khi tạo view — backend nhận `sharedWithUsers` trong body */
  sharedWithUsers?: Array<{
    id: string;
    label: string;
    fullName: string;
    email?: string;
    type: "USER" | "GROUP";
  }>;

  pageIndex?: number;
  scale?: number;
  rotation?: number;
  previewSrc?: string;
  viewState?: ViewState;
}
export interface UpdateView2DDTO {
  name?: string;
  description?: string;
  assignedTo?: string;
  pageIndex?: number;
  scale?: number;
  rotation?: number;
  previewSrc?: string;
  viewState?: ViewState;
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
