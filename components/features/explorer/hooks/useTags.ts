import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagService } from "@/services/tag.service";
import { toast } from "sonner";
import { AxiosError } from "axios";

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

export const useTags = (projectId: string) => {
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags", projectId],
    queryFn: () => tagService.getAll(projectId),
    enabled: !!projectId,
  });

  const createTagMutation = useMutation({
    mutationFn: tagService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] });
      toast.success("Tag created successfully");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to create tag";
      toast.error(msg);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; color?: string };
    }) => tagService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] });
      queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
      toast.success("Tag updated successfully");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update tag";
      toast.error(msg);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: tagService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] });
      queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
      toast.success("Tag deleted successfully");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete tag";
      toast.error(msg);
    },
  });

  return {
    tags: tagsQuery.data || [],

    isLoading: tagsQuery.isLoading,
    createTag: createTagMutation.mutateAsync,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
  };
};
