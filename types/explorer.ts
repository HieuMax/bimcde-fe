import { ITag } from "./tag";
import { ViewState } from "./view2d";

export type ViewMode = "list" | "grid";

export interface IFolderVersion {
  version: number;
  name: string;
  updatedBy?: string;
  createdAt: string;
}

/** Project CDE workflow (from explorer API) */
export type CdeWorkflowMode = "ISO_19650" | "NORMAL";

export interface CdeCapabilities {
  isProjectAdmin: boolean;
  isGroupLeader: boolean;
  /** ISO: groups where the user is GROUP_LEADER (for folder panel scope). */
  leaderGroupIds?: string[];
}

export interface IFolder {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  parentId: string | null;
  createdBy?: string;
  totalSize?: number;
  path: string;
  currentVersion?: number;
  versions?: IFolderVersion[];
  hasChildren?: boolean;
  tags?: ITag[];
  /** ISO: false = other team’s folder (visible but not openable) */
  cdeAccessible?: boolean;
  /** ISO: CDE root stage (WIP / SHARED / …) derived from parent chain */
  parentCdeRootStage?: string | null;
  /** ISO: first group id walking up from this folder (for leader scope) */
  effectiveGroupId?: string | null;
  /** ISO: creator account id (not display name) */
  createdById?: string;
  /** ISO: folder “home” gắn với group (tạo khi createGroup, ngay dưới 1. WIP / 2. Shared) */
  isGroupHomeFolder?: boolean;
  /** ISO: one of the four CDE stage roots (WIP / Shared / Published / Archived) */
  isCdeRoot?: boolean;
  /** ISO: when this row is a CDE root, which stage (WIP, SHARED, PUBLISHED, ARCHIVED) */
  cdeStage?: string;
  /** ISO: set when folder was revoked from Shared/Published — original parent before Archived/Revoked */
  isoRevokeOriginalParentId?: string | null;
}

export interface IFileVersion {
  version: number;
  fileName: string;

  storageKey: string;
  location: string;
  size: number;
  mimeType: string;
  uploadedBy:
    | {
        _id: string;
        fullName: string;
        email?: string;
      }
    | string;

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
  /** GET /files/:id — detailed audit trail (same rows as versions when both present) */
  versionHistory?: Array<{
    version: number;
    fileName?: string;
    size?: number;
    mimeType?: string;
    location?: string;
    createdAt?: string;
    uploadedBy?: { fullName?: string; email?: string } | null;
  }>;
  /**
   * ISO 19650 only (GET /files/:id): merged revisions across WIP + Shared + Published promote chain, with stage tags.
   */
  unifiedVersionHistory?: Array<{
    version: number;
    stageLabels: string[];
    fileName?: string;
    size?: number;
    mimeType?: string;
    location?: string;
    createdAt?: string;
    uploadedBy?: { fullName?: string; email?: string } | null;
  }> | null;

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
  createdBy?: IFolder["createdBy"];

  description?: string;
  lastAccessed?: string;

  permission?: "VIEW" | "DOWNLOAD";

  /** Denormalized CDE stage on file (optional) */
  cdeStage?: string;
  /** ISO: set when file was revoked from Shared/Published — original folderId before Archived/Revoked */
  isoRevokeOriginalFolderId?: string | null;
  workflowStatus?:
    | "WIP_DRAFT"
    | "SUBMITTED_FOR_REVIEW"
    | "COORDINATED"
    | "PUBLISHED"
    | "ARCHIVED";
  submittedForReviewVersion?: number | null;
  /** WIP file: last version already promoted to Shared (leader); promote hidden until new submit */
  wipPromotedToSharedVersion?: number | null;
  /** Shared file: last version promoted to Published; Promote to Published hidden until new revision */
  sharedPromotedToPublishedVersion?: number | null;
  /** CDE root stage derived from parent folder chain (ISO promote UI) */
  parentCdeRootStage?: string | null;
  /** ISO: effective group from parent folder chain (move within same group) */
  effectiveGroupId?: string | null;
  /**
   * ISO WIP: who uploaded the current revision — drives promote/submit UI.
   * admin_direct / leader_direct skip submit-for-review; member_submit keeps the member→leader flow.
   */
  wipDirectPromoteMode?: "admin_direct" | "leader_direct" | "member_submit";
}

/** GET /files/:id/publish-readiness (ISO Shared→Published checklist) */
export interface FilePublishReadiness {
  openTodosCount: number;
  linkedTopicsTotal: number;
  linkedTopicsResolved: number;
  currentVersionIsLatestInShared: boolean;
  sharedRevisionEligibleForPublish: boolean;
  sharedCurrentVersion: number;
  canPublish: boolean;
  eligibleContext: boolean;
  contextMessage?: string;
  isProjectAdmin: boolean;
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

  createdBy?:
    | {
        _id: string;
        fullName: string;
        email?: string;
      }
    | string;

  updatedBy?:
    | {
        _id: string;
        fullName: string;
        email?: string;
      }
    | string;

  createdAt?: string;
  updatedAt?: string;

  assignedTo?: string;
  description?: string;
}

export interface TodoItem {
  _id: string;
  code?: string;
  title: string;
  description?: string;
  status?: "New" | "Open" | "In Progress" | "Done" | "On Hold" | "Closed";
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
  workflowMode: CdeWorkflowMode;
  cdeCapabilities: CdeCapabilities;
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
