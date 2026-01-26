import { httpClient } from "@/lib/http-client";
import { TodoItem } from "@/types/explorer"; 

// 👇 Trỏ về Local để dev
const TODO_API_URL = "http://localhost:4000/api";

export const todoService = {
  // 1. Lấy danh sách
  getTodosByFile: async (fileId: string) => {
    const response = await httpClient.get<{ data: TodoItem[] }>(
      `${TODO_API_URL}/todos/file/${fileId}`
    );
    // Xử lý linh hoạt response
    if (Array.isArray(response)) return response;
    if ((response as any).data) return (response as any).data;
    return [];
  },

  // 2. Tạo mới
  createTodo: async (payload: any) => {
    const response = await httpClient.post(
      `${TODO_API_URL}/todos`, 
      payload
    );
    return response.data;
  },

  // 3. Xóa (Đã có)
  deleteTodo: async (todoId: string) => {
    const response = await httpClient.delete(
      `${TODO_API_URL}/todos/${todoId}`
    );
    return response.data;
  },

  // 4. 👇 BỔ SUNG: Cập nhật (Dùng cho nút Edit)
  updateTodo: async (todoId: string, payload: Partial<TodoItem>) => {
    const response = await httpClient.put(
      `${TODO_API_URL}/todos/${todoId}`,
      payload
    );
    return response.data;
  }
};