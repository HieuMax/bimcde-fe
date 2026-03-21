
export interface IPoint {
  x: number;
  y: number;
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
  viewport: {
    rotate: number;
    pageIndex: number;
  };
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
  
  hiddenElements?: string[];
  selectedElements?: string[];
  coloredElements?: { color: string; elementIds: string[] }[];
  sectionPlanes?: any[];
}

export interface UserPopulated {
  _id: string;
  fullName: string;
  email: string;
}

export interface FilePopulated {
  _id: string;
  name: string;
}

export interface SharedWith {
  isPublic: boolean;
  users: string[]; 
}

export interface ViewItem {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  type: "2D" | "3D";
  relatedFileId?: FilePopulated | string; 
  createdBy: UserPopulated;
  sharedWith: SharedWith;

  viewState: ViewState;

  createdAt: string;
  updatedAt: string;
}
export interface CreateViewDTO {
  projectId: string;
  name: string;
  description?: string;
  type: "2D" | "3D";
  relatedFileId: string;
  thumbnailUrl?: string;
  
  viewState: ViewState;
  
  sharedWith: {
    isPublic: boolean;
    users: string[];
  };
}

export interface UpdateViewDTO {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  viewState?: ViewState;
  sharedWith?: {
    isPublic: boolean;
    users: string[];
  };
}
export interface FileItem {
  _id: string;
  name: string;
  projectId: string;
  fileUrl: string;
  fileType: "PDF" | "IMAGE";
  previewSrc: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface PageItem {
  _id: string;
  index: number;
  pageNumber: number;
  fileId: string;
  source: "pdf" | "file";
  imageSrc?: string;
}

export interface TodoItem {
  _id: string;
  title: string;
  status: "open" | "closed";
}