import { ITodo, CreateTodoDto, UpdateTodoDto } from "@/types/todo";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();
const BASE_URL = "/todos";

export const todoService = {
  getAll: async (projectId: string, filters?: {
    status?: string;
    assignee?: string;
    priority?: string;
  }) => {
    const params: any = { projectId };
    if (filters?.status) params.status = filters.status;
    if (filters?.assignee) params.assignee = filters.assignee;
    if (filters?.priority) params.priority = filters.priority;

    const data = await api.get(BASE_URL, { params });
    return data as ITodo[];
  },

  getById: async (id: string) => {
    const data = await api.get(`${BASE_URL}/${id}`);
    return data as ITodo;
  },

  create: async (data: CreateTodoDto) => {
    console.log(data)
    const res = await api.post(BASE_URL, data);
    return res as ITodo;
  },

  update: async (id: string, data: UpdateTodoDto) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res as ITodo;
  },

  delete: async (id: string) => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  updateStatus: async (id: string, status: "New" | "In Progress" | "Done" | "Closed") => {
    const res = await api.patch(`${BASE_URL}/${id}/status`, { status });
    return res as ITodo;
  },
};
