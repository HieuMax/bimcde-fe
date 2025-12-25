import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IFile, IFolder } from "@/types/explorer";
import { useState } from "react";
import ThumbnailSection from "../ThumbnailSection";
import ToolbarSection from "../ToolbarSection";
import InfoSection from "../InfoSection";
import CommentList from "../comments/CommentList";
import CommentInput from "../comments/CommentInput";
import { useComments } from "../../../hooks/useComments";
import ShareFileDialog from "../../../dialogs/ShareFileDialog";
import { useRouter } from 'next/navigation';

interface Props {
  item: IFile | IFolder;
  onClose: () => void;
  onEdit: () => void;
  onOpenHistory: () => void;
  onDownload: () => void;
  onOpenMove: () => void;
  onDelete: () => void;
  onOpenMore: () => void;
  onAddTags: () => void;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
}

export default function DetailsView({
  item,
  onClose,
  onEdit,
  onOpenHistory,
  onDownload,
  onOpenMove,
  onDelete,
  onAddTags,
  onToggleLock,
}: Props) {
  const isFile = "mimeType" in item;
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Dùng hook logic tách biệt
  const {
    comments,
    totalComments,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment,
    isAdding,
    updateComment,
    deleteComment,
    currentUserId,
  } = useComments(item._id, isFile ? "file" : "folder");

  const router = useRouter();
  const handleViewFile = () => {
    if (isFile) {
      // Ví dụ đường dẫn: /explorer/file/12345
      // router.push(`/explorer/file/${item._id}`);
      const fileExt = (item as IFile).name.toString().split('.').pop()?.toLowerCase();

      // SUPPORT FOR 3D EXT
      const supportFiles = ['ifc'];

      if (fileExt && supportFiles.includes(fileExt)) {
        router.push(`/viewer?urls=${encodeURIComponent(JSON.stringify([item.location]))}`);
      }
      // Hoặc mở tab mới (như logic cũ)
      // window.open((item as IFile).location, "_blank");
    }
  };
  return (
    <div className="flex flex-col h-full relative">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[70px] shrink-0">
        <h2 className="text-base font-medium text-foreground leading-tight truncate pr-2">
          {item.name}
        </h2>
        <div className="flex items-center gap-1 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-6">
          <ThumbnailSection item={item} />
          <Separator />
          <ToolbarSection
            item={item} // [MỚI] Truyền item để check type
            onDownload={onDownload}
            onOpenMove={onOpenMove}
            onDelete={onDelete}
            onOpenShare={() => setIsShareOpen(true)}
            onNavigate={handleViewFile} // [MỚI]
            onToggleLock={onToggleLock} // Placeholder cho Checkin/out logic
            onAddTags={onAddTags}
          />
          <Separator />
          <InfoSection item={item} onOpenHistory={onOpenHistory} />
          <Separator className="mx-4 w-auto" />

          {/* Permission Section (Giản lược để code gọn, bạn có thể tách ra PermissionSection.tsx) */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                Permissions
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Default project member access
              </p>
              <p className="text-sm text-foreground">Full access</p>
            </div>
          </div>
          <Separator />

          <CommentList
            comments={comments}
            totalComments={totalComments}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            currentUserId={currentUserId}
            onUpdate={updateComment}
            onDelete={deleteComment}
          />
        </div>
      </ScrollArea>

      {/* FOOTER INPUT */}
      <CommentInput
        value={commentInput}
        onChange={setCommentInput}
        onSend={addComment}
        isSending={isAdding}
      />

      {isFile && (
        <ShareFileDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          file={item}
        />
      )}
    </div>
  );
}
