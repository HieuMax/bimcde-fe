import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IFile,
  IFolder,
  CdeWorkflowMode,
  CdeCapabilities,
} from "@/types/explorer";
import type { PromoteTargetStage } from "@/lib/explorer/cdePromote";
import { useState } from "react";
import ThumbnailSection from "../ThumbnailSection";
import ToolbarSection from "../ToolbarSection";
import InfoSection from "../InfoSection";
import CommentList from "../comments/CommentList";
import CommentInput from "../comments/CommentInput";
import { useComments } from "../../../hooks/useComments";
import ShareFileDialog from "../../../dialogs/ShareFileDialog";
import { ItemPermissionsDialog } from "../../../dialogs/ItemPermissionsDialog";
import { useRouter, useParams } from "next/navigation";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/explorer/uploadConstraints";
import {
  getFolderIsoPanelAccess,
  getFileIsoPanelAccess,
} from "@/lib/explorer/folderPanelAccess";
import { isCurrentVersionSubmittedForReview } from "@/lib/explorer/cdePromote";

interface Props {
  item: IFile | IFolder;
  onClose: () => void;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenActivity?: () => void;
  onDownload: () => void;
  onOpenMove: () => void;
  onDelete: () => void;
  onOpenMore: () => void;
  onAddTags: () => void;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  workflowMode?: CdeWorkflowMode;
  cdeCapabilities?: CdeCapabilities;
  onPromote?: (targetStage: PromoteTargetStage) => void;
  onOpenPromoteDestination?: () => void;
  onOpenArchiveMove?: () => void;
  isPromoting?: boolean;
  onSubmitForReview?: () => void;
  isSubmittingReview?: boolean;
  currentUserId?: string;
}

export default function DetailsView({
  item,
  onClose,
  onEdit,
  onOpenHistory,
  onOpenActivity,
  onDownload,
  onOpenMove,
  onDelete,
  onAddTags,
  onToggleLock,
  workflowMode = "NORMAL",
  cdeCapabilities,
  onPromote,
  onOpenPromoteDestination,
  onOpenArchiveMove,
  isPromoting,
  onSubmitForReview,
  isSubmittingReview,
  currentUserId,
}: Props) {
  const isFile = "mimeType" in item;
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const params = useParams();
  const projectId = params?.projectId as string;

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
    currentUserId: commentUserId,
  } = useComments(item._id, isFile ? "file" : "folder");

  const router = useRouter();
  const fileItem = isFile ? (item as IFile) : null;

  const folderItem = !isFile ? (item as IFolder) : null;
  const folderPanelAccess =
    folderItem != null
      ? getFolderIsoPanelAccess(
          workflowMode,
          cdeCapabilities,
          folderItem,
          currentUserId,
        )
      : "full";
  const isFolderBasicPanel = !isFile && folderPanelAccess === "basic";

  const filePanelAccess =
    isFile && fileItem != null
      ? getFileIsoPanelAccess(
          workflowMode,
          cdeCapabilities,
          fileItem,
          currentUserId,
        )
      : "full";
  const isFileBasicPanel = isFile && filePanelAccess === "basic";
  const isIsoAdmin = workflowMode === "ISO_19650" && !!cdeCapabilities?.isProjectAdmin;
  const isRootFolder = !isFile && folderItem?.parentId === null;
  const isGroupHomeFolder = !isFile && folderItem?.isGroupHomeFolder === true;
  const isIsoAdminRestrictedFolder =
    !isFile && isIsoAdmin && (isRootFolder || isGroupHomeFolder);
  const hideEditAndPermissions =
    isFileBasicPanel || isFolderBasicPanel || isIsoAdminRestrictedFolder;

  const handleViewFile = () => {
    if (isFile) {
      // Example: /explorer/file/12345
      // router.push(`/explorer/file/${item._id}`);
      const fileExt = (item as IFile).name
        .toString()
        .split(".")
        .pop()
        ?.toLowerCase();
      if (!fileExt) return;

      const IFC_SET = new Set(["ifc"]);
      const DOC_SET = new Set<string>(
        ALLOWED_FILE_EXTENSIONS.filter((e) => e !== "ifc"),
      );

      // IFC → 3D Viewer
      if (IFC_SET.has(fileExt)) {
        router.push(
          `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(JSON.stringify([item.location]))}`
        );
        return;
      }
      // DOC / PDF → Project Viewer
      if (DOC_SET.has(fileExt)) {
        router.push(`/projects/${projectId}/viewer/${item._id}`);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[70px] shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-base font-medium text-foreground leading-tight truncate">
            {item.name}
          </h2>
          {"mimeType" in item &&
            isCurrentVersionSubmittedForReview(item as IFile) && (
            <Badge
              variant="secondary"
              className="mt-1 bg-amber-100 text-amber-800 border border-amber-200"
            >
              Submitted for review
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 -mr-2">
          {!hideEditAndPermissions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
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
            item={item}
            projectId={projectId}
            onDownload={onDownload}
            onOpenMove={onOpenMove}
            onDelete={onDelete}
            onOpenShare={() => setIsShareOpen(true)}
            onNavigate={handleViewFile}
            onToggleLock={onToggleLock}
            onAddTags={onAddTags}
            onOpenPermissions={() => setPermissionsOpen(true)}
            workflowMode={workflowMode}
            cdeCapabilities={cdeCapabilities}
            onPromote={onPromote}
            onOpenPromoteDestination={onOpenPromoteDestination}
            onOpenArchiveMove={onOpenArchiveMove}
            isPromoting={isPromoting}
            onSubmitForReview={onSubmitForReview}
            isSubmittingReview={isSubmittingReview}
            currentUserId={currentUserId}
            onOpenHistory={onOpenHistory}
            onOpenActivity={onOpenActivity}
          />
          <Separator />
          <InfoSection
            item={item}
            onOpenHistory={onOpenHistory}
            projectId={projectId}
          />
          <Separator className="mx-4 w-auto" />

          {/* Permission Section */}
          {!hideEditAndPermissions && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">
                  Permissions
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-2"
                  onClick={() => setPermissionsOpen(true)}
                  aria-label="Edit permissions"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {workflowMode === "NORMAL"
                    ? "Folder permissions (Drive-style: Editor / Viewer / No access) are managed in the dialog above."
                    : "ISO 19650 projects use group roles and CDE stages for access."}
                </p>
                <p className="text-sm text-foreground">
                  {workflowMode === "NORMAL"
                    ? "Use Full / Read only / No access per user or group."
                    : "See team settings and folder visibility in Data."}
                </p>
              </div>
            </div>
          )}
          {!hideEditAndPermissions && <Separator />}

          <CommentList
            comments={comments}
            totalComments={totalComments}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            currentUserId={commentUserId ?? ""}
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

      <ItemPermissionsDialog
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
        mode={isFile ? "file" : "folder"}
        projectId={projectId}
        itemId={item._id}
        itemName={item.name}
        workflowMode={workflowMode}
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
