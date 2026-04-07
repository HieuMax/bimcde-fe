import { ITag } from "./tag";
import { ViewState } from "./view2d";

export type ViewMode = "list" | "grid";

export interface IFolderVersion {
  version: number;
  name: string;
  updatedBy?: string;
  createdAt: string;
}

export interface IFolder {
  _id: string;
  name: string;
  updatedAt?: string;
  parentId: string | null;
  createdBy?: string;
  totalSize?: number;
  path: string;
  currentVersion?: number;
  versions?: IFolderVersion[];
  hasChildren?: boolean;
  tags?: ITag[];
}

export interface IFileVersion {
  version: number;
  fileName: string;

  storageKey: string;
  location: string;
  size: number;
  mimeType: string;
  uploadedBy: {
    _id: string;
    fullName: string;
    email?: string;
  } | string;

  createdAt: string;
}

export type FileType = "PDF" | "IMAGE" | "WORD"; // Từ view.ts

export interface IFile {
  _id: string;
  name: string;
  folderId: string | null;
  projectName?: string;
  currentVersion: number;
  versions?: IFileVersion[];

  size: number;
  mimeType: string;
  location: string;
  locationPath?: string[];
  updatedAt: string;
  isLocked: boolean;
  lockedBy?: string;
  modifiedBy?: string; 
  thumbnail?: string;
  tags?: ITag[];

  // Thêm từ view.ts (FileItem)
  projectId: string;
  fileUrl: string;
  fileType: FileType;
  previewSrc?: string;
  uploadedBy?: string; // Thêm để hỗ trợ display
  createdAt?: string;
  createdBy?: IFolder['createdBy'];

  description?: string; 
  lastAccessed?: string; 

  permission?: "VIEW" | "DOWNLOAD" ;
}

// Merge PageItem
export interface PageItem {
  _id: string;
  index: number; 
  pageNumber?: number;
  fileId: string;
  imageSrc?: string;
  source?: "pdf" | "file" | "view" | "word" | "image";
  thumbnail?: string;
}

export interface ViewItem {
  _id: string;
  name?: string;
  projectId: string;
  fileId: string;
  previewSrc?: string;
  pageIndex?: number;
  scale?: number;
  rotation?: number;

  viewState?: ViewState;

  createdBy?: {
    _id: string;
    fullName: string;
    email?: string;
  } | string;

  updatedBy?: {
    _id: string;
    fullName: string;
    email?: string;
  } | string;

  createdAt?: string;
  updatedAt?: string;

  assignedTo?: string;
  description?: string;
}

export interface TodoItem {
  _id: string;
  title: string;
  description?: string;
  status?: "Open" | "In Progress" | "Done" | "On Hold"; 
  priority?: "Low" | "Normal" | "High" | "Urgent";
  type?: string;
  dueDate?: string;
  completion?: number;
  assignee?: string;
  tags?: string[];
  viewId?: string;
  createdAt?: string;
  createdBy?: string;
  fileId?: string;
  projectId?: string;
}

export type ExplorerItem = IFile | IFolder;

export interface IExplorerResponse {
  currentFolder: {
    _id: string;
    name: string;
    parentId: string | null;
    path: string;
  } | null;
  ancestors: {
    _id: string;
    name: string;
  }[];
  subFolders: IFolder[];
  files: IFile[];
}

export interface FileDetailResponse {
  _id: string;
  name: string;
  projectId: string;
  versions: IFileVersion[];
  currentVersion: number;
  createdAt?: string;
}

// Merge FileDetailData
export interface FileDetailData {
  file: IFile;
  folder?: IFolder | null;
  projectName: string;
  locationPath: string;
}
