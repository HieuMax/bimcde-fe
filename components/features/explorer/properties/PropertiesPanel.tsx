"use client";

import React, { useState } from "react";
import { IFile, IFolder, CdeWorkflowMode, CdeCapabilities } from "@/types/explorer";
import type { PromoteTargetStage } from "@/lib/explorer/cdePromote";

// Import Views
import DetailsView from "./components/views/DetailsView";
import HistoryView from "./components/views/HistoryView";
import EditView from "./components/views/EditView";
import MoveDestinationView from "../MoveDestinationView";
import PromoteDestinationView from "../PromoteDestinationView";
import PublishToPublishedModal from "../PublishToPublishedModal";
import ArchiveMoveDestinationView from "../ArchiveMoveDestinationView";
import TagsView from "./views/TagsView";
import ActivitiesView from "./components/views/ActivitiesView";
import { useQueryClient } from "@tanstack/react-query";
import { explorerService } from "@/services/explorer.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode =
  | "details"
  | "history"
  | "activity"
  | "edit"
  | "move"
  | "tags"
  | "promote"
  | "archiveMove";

interface Props {
  open: boolean;
  item: IFile | IFolder | null;
  onDelete: (id: string) => void;
  onClose: () => void;
  onOpenMore: () => void;
  onDownload: () => void;
  onRename: (newName: string) => Promise<void>;
  onMoveItem: (destinationId: string) => Promise<void>;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  projectId: string;
  workflowMode?: CdeWorkflowMode;
  cdeCapabilities?: CdeCapabilities;
  onPromote?: (
    targetStage: PromoteTargetStage,
    destinationFolderId?: string | null,
  ) => Promise<void>;
  isPromoting?: boolean;
  onSubmitForReview?: () => void;
  isSubmittingReview?: boolean;
  currentUserId?: string;
  /** Increment from parent (e.g. More menu) to switch to Activity view */
  openActivityTick?: number;
}

export default function PropertiesPanel({
  open,
  item,
  onDelete,
  onClose,
  onOpenMore,
  onDownload,
  onRename,
  onMoveItem,
  onToggleLock,
  projectId,
  workflowMode = "NORMAL",
  cdeCapabilities,
  onPromote,
  isPromoting,
  onSubmitForReview,
  isSubmittingReview,
  currentUserId,
  openActivityTick = 0,
}: Props) {
  const [view, setView] = useState<ViewMode>("details");
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!open) {
      setView("details");
      setPublishModalOpen(false);
      setArchiveConfirmOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    setView("details");
    setPublishModalOpen(false);
    setArchiveConfirmOpen(false);
  }, [item?._id]);

  React.useEffect(() => {
    if (openActivityTick > 0) {
      setView("activity");
    }
  }, [openActivityTick]);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      {item ? (
        <>
          {view === "details" && (
            <DetailsView
              item={item}
              onClose={onClose}
              onEdit={() => setView("edit")}
              onOpenHistory={() => setView("history")}
              onDownload={onDownload}
              onOpenMove={() => setView("move")}
              onDelete={() => onDelete(item._id)}
              onOpenMore={onOpenMore}
              onAddTags={() => setView("tags")}
              onToggleLock={onToggleLock}
              workflowMode={workflowMode}
              cdeCapabilities={cdeCapabilities}
              onPromote={async (stage) => {
                if (stage === "SHARED") await onPromote?.(stage);
              }}
              onOpenPromoteDestination={() => setPublishModalOpen(true)}
              onOpenArchiveMove={() => setArchiveConfirmOpen(true)}
              isPromoting={isPromoting}
              onSubmitForReview={onSubmitForReview}
              isSubmittingReview={isSubmittingReview}
              currentUserId={currentUserId}
              onOpenActivity={() => setView("activity")}
            />
          )}

          {view === "activity" && item && (
            <ActivitiesView
              item={item}
              projectId={projectId}
              onBack={() => setView("details")}
              onClose={onClose}
            />
          )}

          {view === "history" && (
            <HistoryView item={item} onBack={() => setView("details")} />
          )}

          {view === "edit" && (
            <EditView
              item={item}
              projectId={projectId}
              onBack={() => setView("details")}
              onClose={onClose}
              onSaveRename={async (newName) => {
                await onRename(newName);
              }}
              onSaveTags={async (tagIds) => {
                const isFile = "mimeType" in item;
                if (isFile) {
                  await explorerService.assignTags([item._id], tagIds);
                } else {
                  await explorerService.assignFolderTags([item._id], tagIds);
                }
                queryClient.invalidateQueries({ queryKey: ["explorer"] });
                queryClient.invalidateQueries({
                  queryKey: ["folder-tree", projectId],
                });
              }}
            />
          )}

          {item && "mimeType" in item && (
            <PublishToPublishedModal
              open={publishModalOpen}
              onOpenChange={setPublishModalOpen}
              fileId={item._id}
              onConfirm={() => setView("promote")}
            />
          )}

          {view === "promote" && "mimeType" in item && (
            <PromoteDestinationView
              projectId={projectId}
              onBack={() => setView("details")}
              onClose={onClose}
              isPromoting={isPromoting}
              onConfirm={async (destinationFolderId) => {
                await onPromote?.("PUBLISHED", destinationFolderId);
                setView("details");
              }}
            />
          )}

          <AlertDialog
            open={archiveConfirmOpen}
            onOpenChange={setArchiveConfirmOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Move to Archived</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Are you sure you want to move this item
                  to Archived?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setArchiveConfirmOpen(false);
                    setView("archiveMove");
                  }}
                >
                  Move to Archived
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {view === "archiveMove" && item && (
            <ArchiveMoveDestinationView
              projectId={projectId}
              sourceItemIds={[item._id]}
              onBack={() => setView("details")}
              onClose={onClose}
              onConfirm={async (destinationFolderId) => {
                await onMoveItem(destinationFolderId);
                setView("details");
              }}
            />
          )}

          {view === "move" && (
            <MoveDestinationView
              onBack={() => setView("details")}
              onClose={onClose}
              onMove={onMoveItem}
              sourceItemIds={[item._id]}
              projectId={projectId}
              workflowMode={workflowMode}
              restrictMoveToEffectiveGroupId={
                "effectiveGroupId" in item
                  ? item.effectiveGroupId ?? null
                  : null
              }
              parentCdeRootStage={
                "parentCdeRootStage" in item
                  ? item.parentCdeRootStage ?? null
                  : null
              }
            />
          )}

          {view === "tags" && (
            <TagsView
              fileIds={"mimeType" in item ? [item._id] : []}
              folderIds={!("mimeType" in item) ? [item._id] : []}
              initialTags={(item as IFile | IFolder).tags}
              onBack={() => setView("details")}
              onClose={onClose}
              onSuccess={() => {
                // Invalidate explorer content to refresh data
                queryClient.invalidateQueries({ queryKey: ["explorer"] });
              }}
              projectId={projectId}
            />
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Select an item to view properties
        </div>
      )}
    </div>
  );
}
