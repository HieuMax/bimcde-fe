import { ITag } from "./tag";

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
  uploadedBy: string;
  createdAt: string;
}

export interface IFile {
  _id: string;
  name: string;
  folderId: string | null;
  currentVersion: number;
  versions: IFileVersion[];

  // Flatten fields for display
  size: number;
  mimeType: string;
  location: string;
  updatedAt: string;
  isLocked: boolean;
  lockedBy?: string;
  modifiedBy: string;
  thumbnail: string;
  tags?: ITag[];
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
