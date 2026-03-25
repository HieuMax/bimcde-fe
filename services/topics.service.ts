import { useApi as apiClient } from "@/app/hooks/useApi";
import { Topic } from "@/components/features/topics/topic-types";

const api = apiClient();

type TopicItemResponse = {
  success?: boolean;
  message?: string;
  result?: unknown[];
};

export const topicsService = {
  createTopicItem: async (
    projectId: string,
    payload: {
      title: string;
      description?: string;
      assignee?: string;
      type?: string;
      status?: string;
      priority?: string;
      tags?: string[];
      dueDate?: string;
      authorName?: string;
    },
  ): Promise<Topic> => {
    const res = await api.post(`/topics/items/create/${projectId}`, payload);
    const doc = (res as any)?.result ?? res;
    const docObj = (doc ?? {}) as Record<string, unknown>;
    const stats = (docObj.stats ?? {}) as Record<string, unknown>;
    const attachmentsRaw = Array.isArray(docObj.attachments)
      ? (docObj.attachments as unknown[])
      : [];
    const mappedAttachments = attachmentsRaw.map((a) => {
      const aObj = (a ?? {}) as Record<string, unknown>;
      return {
        name: String(aObj?.name ?? ""),
        url: String(aObj?.url ?? ""),
        mimeType: aObj?.mimeType ? String(aObj.mimeType) : undefined,
        size: typeof aObj?.size === "number" ? (aObj.size as number) : undefined,
        fileId: aObj?.fileId ? String(aObj.fileId) : undefined,
      };
    });
    return {
      id: String(docObj?._id ?? docObj?.id ?? ""),
      code: String(docObj?.code ?? ""),
      title: String(docObj?.title ?? ""),
      description: String(docObj?.description ?? ""),
      assignee: String(docObj?.assignee ?? ""),
      type: String(docObj?.type ?? "Undefined"),
      authorName: String(docObj?.authorName ?? "Unknown"),
      createdAt: String(docObj?.createdAt ?? new Date().toISOString()),
      modifiedAt:
        (docObj?.updatedAt as unknown) ??
        (docObj?.modifiedAt as unknown) ??
        new Date().toISOString(),
      status: String(docObj?.status ?? "New"),
      priority: String(docObj?.priority ?? "Normal"),
      tags: Array.isArray(docObj?.tags) ? (docObj.tags as string[]) : [],
      dueDate: docObj?.dueDate
        ? new Date(String(docObj.dueDate)).toISOString()
        : undefined,
      assignedToMe: false,
      thumbnailUrl: String(docObj?.thumbnailUrl ?? ""),
      attachments: mappedAttachments,
      stats: {
        comments: Number(stats?.comments ?? 0),
        viewpoints: Number(stats?.viewpoints ?? 0),
        attachments: mappedAttachments.length,
      },
    } as Topic;
  },
  updateTopicItem: async (
    topicItemId: string,
    payload: {
      title?: string;
      description?: string;
      assignee?: string;
      type?: string;
      status?: string;
      priority?: string;
      tags?: string[];
      dueDate?: string | null;
    },
  ): Promise<Topic> => {
    const res = await api.put(`/topics/items/${topicItemId}`, payload);
    const doc = (res as any)?.result ?? res;
    const docObj = (doc ?? {}) as Record<string, unknown>;
    const stats = (docObj.stats ?? {}) as Record<string, unknown>;
    const attachmentsRaw = Array.isArray(docObj.attachments)
      ? (docObj.attachments as unknown[])
      : [];
    const mappedAttachments = attachmentsRaw.map((a) => {
      const aObj = (a ?? {}) as Record<string, unknown>;
      return {
        name: String(aObj?.name ?? ""),
        url: String(aObj?.url ?? ""),
        mimeType: aObj?.mimeType ? String(aObj.mimeType) : undefined,
        size: typeof aObj?.size === "number" ? (aObj.size as number) : undefined,
        fileId: aObj?.fileId ? String(aObj.fileId) : undefined,
      };
    });
    return {
      id: String(docObj?._id ?? docObj?.id ?? ""),
      code: String(docObj?.code ?? ""),
      title: String(docObj?.title ?? ""),
      description: String(docObj?.description ?? ""),
      assignee: String(docObj?.assignee ?? ""),
      type: String(docObj?.type ?? "Undefined"),
      authorName: String(docObj?.authorName ?? "Unknown"),
      createdAt: String(docObj?.createdAt ?? new Date().toISOString()),
      modifiedAt:
        (docObj?.updatedAt as unknown) ??
        (docObj?.modifiedAt as unknown) ??
        new Date().toISOString(),
      status: String(docObj?.status ?? "New"),
      priority: String(docObj?.priority ?? "Normal"),
      tags: Array.isArray(docObj?.tags) ? (docObj.tags as string[]) : [],
      dueDate: docObj?.dueDate
        ? new Date(String(docObj.dueDate)).toISOString()
        : undefined,
      assignedToMe: false,
      thumbnailUrl: String(docObj?.thumbnailUrl ?? ""),
      attachments: mappedAttachments,
      stats: {
        comments: Number(stats?.comments ?? 0),
        viewpoints: Number(stats?.viewpoints ?? 0),
        attachments: mappedAttachments.length,
      },
    } as Topic;
  },
  getTopicItems: async (projectId: string): Promise<Topic[]> => {
    const data = (await api.get(`/topics/items/getAll/${projectId}`)) as
      | TopicItemResponse
      | unknown[];

    const items = Array.isArray(data) ? data : (data?.result ?? []);

    // Map backend shape -> FE Topic shape
    return (items as unknown[]).map((doc) => {
      const docObj = (doc ?? {}) as Record<string, unknown>;
      const stats = (docObj.stats ?? {}) as Record<string, unknown>;

      const attachmentsRaw = Array.isArray(docObj.attachments)
        ? (docObj.attachments as unknown[])
        : [];

      const mappedAttachments = attachmentsRaw.map((a) => {
        const aObj = (a ?? {}) as Record<string, unknown>;
        return {
          name: String(aObj?.name ?? ""),
          url: String(aObj?.url ?? ""),
          mimeType: aObj?.mimeType ? String(aObj.mimeType) : undefined,
          size: typeof aObj?.size === "number" ? (aObj.size as number) : undefined,
          fileId: aObj?.fileId ? String(aObj.fileId) : undefined,
        };
      });
      const attachmentsCount = mappedAttachments.length;
      return {
        id: String(docObj?._id ?? docObj?.id ?? ""),
        code: String(docObj?.code ?? ""),
        title: String(docObj?.title ?? ""),
        description: String(docObj?.description ?? ""),
        assignee: String(docObj?.assignee ?? ""),
        type: String(docObj?.type ?? "Undefined"),
        authorName: String(docObj?.authorName ?? "Unknown"),
        createdAt: String(docObj?.createdAt ?? new Date().toISOString()),
        modifiedAt:
          (docObj?.updatedAt as unknown) ??
          (docObj?.modifiedAt as unknown) ??
          new Date().toISOString(),
        status: String(docObj?.status ?? "New"),
        priority: String(docObj?.priority ?? "Normal"),
        tags: Array.isArray(docObj?.tags) ? (docObj.tags as string[]) : [],
        dueDate: docObj?.dueDate
          ? new Date(String(docObj.dueDate)).toISOString()
          : undefined,
        assignedToMe: false,
        thumbnailUrl: String(docObj?.thumbnailUrl ?? ""),
        attachments: mappedAttachments,
        stats: {
          comments: Number(stats?.comments ?? 0),
          viewpoints: Number(stats?.viewpoints ?? 0),
          attachments: attachmentsCount,
        },
      } as Topic;
    });
  },
  addTopicAttachments: async (
    topicItemId: string,
    attachments: Topic["attachments"],
  ): Promise<void> => {
    await api.post(`/topics/items/${topicItemId}/attachments`, {
      attachments,
    });
  },
  removeTopicAttachment: async (
    topicItemId: string,
    url: string,
  ): Promise<void> => {
    await api.delete(`/topics/items/${topicItemId}/attachments`, {
      data: { url },
    });
  },
  removeAllTopicAttachments: async (topicItemId: string): Promise<void> => {
    await api.delete(`/topics/items/${topicItemId}/attachments`, {
      data: {},
    });
  },
};
