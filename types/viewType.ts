// --- 1. Các thành phần nhỏ (Sub-types) ---

/**
 * Trạng thái khung nhìn (Zoom, Xoay, Vị trí)
 * Dùng để khôi phục lại góc nhìn khi User mở View
 */
export interface ViewportState {
  zoom: number;       // Mức zoom (ví dụ: 1.0, 1.5)
  rotate: number;     // Góc xoay (0, 90, 180, 270)
  pageIndex: number;  // Trang hiện tại (đối với PDF)
  panX?: number;      // Vị trí cuộn ngang
  panY?: number;      // Vị trí cuộn dọc
}

/**
 * Thông tin người tạo (được populate từ User collection)
 */
export interface ViewCreator {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

// --- 2. Main Entity (Dữ liệu trả về từ API GET) ---

export interface ViewItem {
  _id: string;
  
  // Thông tin cơ bản
  name: string;
  description?: string;
  
  // Liên kết
  projectId: string;
  fileId: string; // ID file gốc
  
  // Quyền & Sở hữu
  createdBy: ViewCreator | string; // Object nếu đã populate, string nếu chưa
  assignedTo?: string; // Tên người được share hoặc "Private"

  // Dữ liệu hiển thị (Thumbnail)
  previewSrc?: string; // Base64 string hoặc URL ảnh

  // Dữ liệu Core (JSON String)
  // Lưu ý: Annotations lưu trong DB là string để tối ưu
  // Khi dùng cần JSON.parse(view.annotations) -> IAnnotation[]
  annotations: string; 
  
  // Trạng thái Viewport
  viewportState: ViewportState;

  // Metadata thời gian
  createdAt: string;
  updatedAt?: string;
}

// --- 3. DTOs (Data Transfer Objects - Dữ liệu gửi đi khi gọi API) ---

/**
 * Payload gửi đi khi tạo View mới (POST)
 */
export interface CreateViewPayload {
  name: string;
  description?: string;
  sharedWith?: string;

  // Context
  projectId: string;
  fileId: string;

  // Dữ liệu kỹ thuật
  annotations: string; // Phải JSON.stringify mảng annotations trước khi gửi
  viewportState: string | ViewportState; // Có thể gửi string JSON hoặc Object
  previewSrc?: string; // Ảnh snapshot màn hình
}

/**
 * Payload gửi đi khi cập nhật View (PUT/PATCH) - (Dự phòng cho tương lai)
 */
export interface UpdateViewPayload {
  name?: string;
  description?: string;
  sharedWith?: string;
  annotations?: string;
  previewSrc?: string;
}