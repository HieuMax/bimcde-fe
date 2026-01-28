export interface ICamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
  projection: "ORTHO" | "PERSPECTIVE";
  zoom?: number;
}

export interface ISectionPlane {
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
}

export interface IViewState {
  camera: ICamera;
  hiddenElements?: string[]; // Array of GUIDs
  selectedElements?: string[];
  coloredElements?: { color: string; elementIds: string[] }[];
  sectionPlanes?: ISectionPlane[];
  markupData?: any;
}

export interface IView {
  _id: string;
  projectId: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  type: "3D" | "2D";
  relatedFileId?: string; // If 2D
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  sharedWith: {
    isPublic: boolean;
    users: string[]; // User IDs
  };
  viewState: IViewState;
  createdAt: string;
  updatedAt: string;

  currentVersion: number;
  size?: number;
  mimeType?: string;

  location?: string;
  fileUrl?: string;

  // createdAt?: string;
  // createdBy?: string;

  // updatedAt?: string;
  modifiedBy?: string;

  isLocked?: boolean;
  lockedBy?: string;

}

export interface CreateViewDTO {
  projectId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  type: "3D" | "2D";
  relatedFileId?: string;
  viewState: IViewState;
  sharedWith?: {
    isPublic?: boolean;
    users?: string[];
  };
}

export interface UpdateViewDTO extends Partial<CreateViewDTO> {}
