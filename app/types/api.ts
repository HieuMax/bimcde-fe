// INTERFACE
/* ========= PROJECT ========= */
export interface Project {
  _id: string;
  name: string;
  region: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ========= FILE ========= */
export type FileType = 'PDF' | 'IMAGE' | 'WORD';

export interface FileItem {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  fileType: FileType;
  fileUrl: string;
  previewSrc?: string;
  size?: string;
  location?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ========= VIEW ========= */
export interface ViewItem {
  _id: string;
  projectId: string;
  fileId: string | FileItem;
  name: string;
  description?: string;
  previewSrc: string;
  createdBy?: string;
  assignedTo?: string
}

/* ========= TODO ========= */
export interface TodoItem {
  _id: string;
  projectId: string;
  title: string;
  status?: string;
  relatedImage?: string;
}

/* ========= EXPLORER ========= */
export type ExplorerType = 'folder' | 'file' | 'image' | 'archive';

export interface ExplorerItem {
  _id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: ExplorerType;
  fileId?: string;
  fileType?: FileType;
  previewSrc?: string;
  size?: string;
}

export type PageItem = {
  _id: string;
  index: number;
  imageSrc?: string;   // Dùng cho ảnh/view cũ
  pageNumber?: number; 
  fileId?: string;
  source?: 'view' | 'pdf' | 'file'; // Thêm để dễ quản lý (tùy chọn)
};
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

/* ========= HELPER ========= */

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[API ERROR] ${res.status} ${url} - ${text}`);
  }

  return res.json() as Promise<T>;
}

/* ========= VIEWS ========= */

export function getViews(projectId: string) {
  return apiFetch<ViewItem[]>(
    `${API_BASE}/projects/${projectId}/views`
  );
}

export function getView(viewId: string) {
  return apiFetch<ViewItem>(
    `${API_BASE}/views/${viewId}`
  );
}

/* ========= FILES ========= */

export function getFile(fileId: string) {
  return apiFetch<FileItem>(
    `${API_BASE}/files/${fileId}`
  );
}

export function getPages(fileId: string) {
  return apiFetch<PageItem[]>(
    `${API_BASE}/files/${fileId}/pages`
  );
}

/* ========= TODOS ========= */

export function getTodos(projectId: string) {
  return apiFetch<TodoItem[]>(
    `${API_BASE}/projects/${projectId}/todos`
  );
}

/* ========= PROJECTS ========= */

export function getProjects() {
  return apiFetch<Project[]>(
    `${API_BASE}/projects`
  );
}

export function getProjectById(projectId: string) {
  return apiFetch<Project>(
    `${API_BASE}/projects/${projectId}`
  );
}

/* ========= EXPLORER ========= */

export function getExplorerItems(
  projectId: string,
  parentId?: string | null
) {
  const url = parentId
    ? `${API_BASE}/projects/${projectId}/explorer?parentId=${parentId}`
    : `${API_BASE}/projects/${projectId}/explorer`;

  return apiFetch<ExplorerItem[]>(url);
}