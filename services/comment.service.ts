import { IComment, ICommentResponse } from "@/types/comment";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const commentService = {
  getComments: async (
    targetId: string,
    offset: number = 0,
    limit: number = 6
  ) => {
    const data = await api.get(`/comments/${targetId}`, {
      params: { offset, limit },
    });
    return data as ICommentResponse;
  },

  createComment: async (payload: {
    content: string;
    targetId: string;
    targetType: "file" | "folder" | "release" | "topic";
    userId: string;
  }) => {
    const data = await api.post<typeof payload>("/comments", payload);
    return data as IComment;
  },

  updateComment: async (id: string, content: string, userId: string) => {
    const payload = {
      content,
      userId: userId,
    };
    const data = await api.put<typeof payload>(`/comments/${id}`, payload);
    return data as IComment;
  },

  deleteComment: async (id: string, userId: string) => {
    await api.delete(`/comments/${id}`, { data: { userId: userId } });
  },
};
