"use client";

import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { commentService } from "@/services/comment.service";
import { useAuth } from "@/app/context/authContext";

export function useComments(targetId: string, targetType: "file" | "folder" | "release" | "view" | "topic" | "todo") {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  if (!user) {
    throw new Error("useExplorerActions requires authenticated user");
  }
  const [commentInput, setCommentInput] = useState("");

  // 1. Fetch Comments
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["comments", targetId],
      queryFn: ({ pageParam = 0 }) =>
        commentService.getComments(targetId, pageParam, 6),
      initialPageParam: 0,
      enabled: !!targetId,
      getNextPageParam: (lastPage, allPages) => {
        const nextOffset = allPages.flatMap((p) => p.comments).length;
        return lastPage.hasMore ? nextOffset : undefined;
      },
    });

  const comments = data?.pages.flatMap((page) => page.comments) || [];
  const totalComments = data?.pages[0]?.total || 0;

  // 2. Add Comment
  const addMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.createComment({
        content,
        targetId,
        targetType,
        userId: user._id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetId] });
      setCommentInput("");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  // 3. Update Comment
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentService.updateComment(id, content, user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetId] });
      toast.success("Comment updated");
    },
  });

  // 4. Delete Comment
  const deleteMutation = useMutation({
    mutationFn: (id: string) => commentService.deleteComment(id, user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetId] });
      toast.success("Comment deleted");
    },
  });

  return {
    comments,
    totalComments,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment: () => {
      if (!commentInput.trim()) return;
      addMutation.mutate(commentInput);
    },
    isAdding: addMutation.isPending,
    updateComment: updateMutation.mutate,
    deleteComment: deleteMutation.mutate,
    currentUserId: user._id,
  };
}
