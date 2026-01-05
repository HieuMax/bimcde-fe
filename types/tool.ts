export type ToolType = "pencil" | "arrow" | "cursor" | "hand" | "pentagon" | "cloud" | "rectangle" | "circle";

// Point structure
export interface IPoint {
  x: number;
  y: number;
}

// Cập nhật IAnnotation để hỗ trợ cả 2 kiểu dữ liệu
export interface IAnnotation {
  id: string;
  type: ToolType;
  color: string;
  // Cho các hình cơ bản (Rect, Circle, Cloud)
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  // Cho hình đa giác (Polygon/Pentagon tool)
  points?: IPoint[];
}