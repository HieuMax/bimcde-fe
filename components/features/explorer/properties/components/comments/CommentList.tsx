import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IComment } from "@/types/comment";
import CommentItem from "./CommentItem";

interface Props {
  comments: IComment[];
  totalComments: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  currentUserId: string;
  onUpdate: (data: { id: string; content: string }) => void;
  onDelete: (id: string) => void;
}

export default function CommentList({
  comments,
  totalComments,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  currentUserId,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <div className="p-4 pb-0">
      <h3 className="text-base font-medium text-foreground mb-4">
        Comments {totalComments > 0 && `(${totalComments})`}
      </h3>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              isOwner={comment.createdBy?._id === currentUserId}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-2 justify-start"
            >
              {isFetchingNextPage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              View {totalComments - comments.length} more comments
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
