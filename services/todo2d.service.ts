import { useApi as apiClient } from "@/app/hooks/useApi";
import { TodoItem } from "@/types/explorer";

const api = apiClient();
const BASE_URL = "/todos2d";

export const todo2DService = {
  /**
   * 1. Lấy danh sách todo theo file
   */
  getTodosByFile: async (fileId: string) => {
    const data = await api.get(`${BASE_URL}/file/${fileId}`);
    return data as TodoItem[];
  },

  /**
   * 2. Tạo todo mới
   */
  createTodo: async (payload: Partial<TodoItem>) => {
    const res = await api.post(BASE_URL, payload);
    return res as TodoItem;
  },

  /**
   * 3. Xoá todo
   */
  deleteTodo: async (todoId: string) => {
    await api.delete(`${BASE_URL}/${todoId}`);
  },

  /**
   * 4. Cập nhật todo (Edit)
   */
  updateTodo: async (
    todoId: string,
    payload: Partial<TodoItem>
  ) => {
    const res = await api.put(`${BASE_URL}/${todoId}`, payload);
    return res as TodoItem;
  },

  /** Danh sách Todo2D theo project (dashboard) */
  getTodosByProject: async (projectId: string) => {
    const data = await api.get(`${BASE_URL}/project/${projectId}`);
    return data as TodoItem[];
  },

  /** Một Todo2D theo id (mở từ query ?openTodoId=) */
  getById: async (todoId: string) => {
    const data = await api.get(`${BASE_URL}/${todoId}`);
    return data as TodoItem;
  },
};
