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
import { isAxiosError } from "axios";
import { toast } from "sonner";
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
import ShareFileDialog from "../dialogs/ShareFileDialog";

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
  const [isoRevokeDialogOpen, setIsoRevokeDialogOpen] = useState(false);
  const [isoRestoreConflictOpen, setIsoRestoreConflictOpen] = useState(false);
  const [isoRestoreBusy, setIsoRestoreBusy] = useState(false);
  const [historyShareOpen, setHistoryShareOpen] = useState(false);
  const [historySharePin, setHistorySharePin] = useState<number | undefined>(
    undefined,
  );
  /** Full file record (incl. per-version `location`) — explorer rows are often denormalized. */
  const [fileDetail, setFileDetail] = useState<IFile | null>(null);
  const queryClient = useQueryClient();

  const isFileItem = !!(item && "mimeType" in item);
  const fileCurrentVersion = isFileItem
    ? (item as IFile).currentVersion
    : undefined;

  React.useEffect(() => {
    if (!item || !isFileItem) {
      setFileDetail(null);
      return;
    }
    const f = item as IFile;
    let cancelled = false;
    explorerService
      .getFileDetail(f._id)
      .then((d) => {
        const doc = d as IFile;
        if (!cancelled && doc._id === f._id) setFileDetail(doc);
      })
      .catch(() => {
        if (!cancelled) setFileDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [item, item?._id, isFileItem, fileCurrentVersion]);

  const mergedItem = React.useMemo((): IFile | IFolder | null => {
    if (!item) return null;
    if ("mimeType" in item && fileDetail && fileDetail._id === item._id) {
      return { ...(item as IFile), ...fileDetail };
    }
    return item;
  }, [item, fileDetail]);

  const invalidateExplorer = () => {
    queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
    queryClient.invalidateQueries({ queryKey: ["folder-tree", projectId] });
  };

  const handleIsoRevokeConfirm = async () => {
    if (!item) return;
    try {
      await explorerService.isoRevoke(
        projectId,
        item._id,
        "mimeType" in item,
      );
      invalidateExplorer();
      toast.success("Revoked to Archived / Revoked");
      setIsoRevokeDialogOpen(false);
      onClose();
    } catch (e) {
      const m = isAxiosError(e) ? (e.response?.data as { message?: string })?.message : null;
      toast.error(typeof m === "string" ? m : "Revoke failed");
    }
  };

  const handleIsoRestore = async () => {
    if (!item) return;
    setIsoRestoreBusy(true);
    try {
      await explorerService.isoRestore(
        projectId,
        item._id,
        "mimeType" in item,
        false,
      );
      invalidateExplorer();
      toast.success("Restored successfully");
      onClose();
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        const msg = String((e.response?.data as { message?: string })?.message ?? "");
        if (msg.includes("RESTORE_NAME_CONFLICT")) {
          setIsoRestoreConflictOpen(true);
        } else {
          toast.error(msg || "Restore failed");
        }
      } else {
        const m = isAxiosError(e)
          ? (e.response?.data as { message?: string })?.message
          : null;
        toast.error(typeof m === "string" ? m : "Restore failed");
      }
    } finally {
      setIsoRestoreBusy(false);
    }
  };

  const handleIsoRestoreOverwrite = async () => {
    if (!item) return;
    setIsoRestoreBusy(true);
    try {
      await explorerService.isoRestore(
        projectId,
        item._id,
        "mimeType" in item,
        true,
      );
      invalidateExplorer();
      toast.success("Restored successfully");
      setIsoRestoreConflictOpen(false);
      onClose();
    } catch (e) {
      const m = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message
        : null;
      toast.error(typeof m === "string" ? m : "Restore failed");
    } finally {
      setIsoRestoreBusy(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setView("details");
      setPublishModalOpen(false);
      setArchiveConfirmOpen(false);
      setHistoryShareOpen(false);
      setHistorySharePin(undefined);
    }
  }, [open]);

  React.useEffect(() => {
    setView("details");
    setPublishModalOpen(false);
    setArchiveConfirmOpen(false);
    setIsoRevokeDialogOpen(false);
    setIsoRestoreConflictOpen(false);
  }, [item?._id]);

  React.useEffect(() => {
    if (openActivityTick > 0) {
      setView("activity");
    }
  }, [openActivityTick]);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      {mergedItem ? (
        <>
          {view === "details" && (
            <DetailsView
              item={mergedItem}
              onClose={onClose}
              onEdit={() => setView("edit")}
              onOpenHistory={() => setView("history")}
              onDownload={onDownload}
              onOpenMove={() => setView("move")}
              onDelete={() => onDelete(mergedItem._id)}
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
              onIsoRevoke={() => setIsoRevokeDialogOpen(true)}
              onIsoRestore={handleIsoRestore}
            />
          )}

          {view === "activity" && mergedItem && (
            <ActivitiesView
              item={mergedItem}
              projectId={projectId}
              onBack={() => setView("details")}
              onClose={onClose}
            />
          )}

          {view === "history" && (
            <HistoryView
              item={mergedItem}
              projectId={projectId}
              onBack={() => setView("details")}
              onShareVersion={
                mergedItem && "mimeType" in mergedItem
                  ? (v) => {
                      setHistorySharePin(v);
                      setHistoryShareOpen(true);
                    }
                  : undefined
              }
            />
          )}

          {mergedItem && "mimeType" in mergedItem && (
            <ShareFileDialog
              open={historyShareOpen}
              onOpenChange={(o) => {
                setHistoryShareOpen(o);
                if (!o) setHistorySharePin(undefined);
              }}
              file={mergedItem}
              initialPinnedVersion={historySharePin}
            />
          )}

          {view === "edit" && (
            <EditView
              item={mergedItem}
              projectId={projectId}
              onBack={() => setView("details")}
              onClose={onClose}
              onSaveRename={async (newName) => {
                await onRename(newName);
              }}
              onSaveTags={async (tagIds) => {
                const isFile = "mimeType" in mergedItem;
                if (isFile) {
                  await explorerService.assignTags([mergedItem._id], tagIds);
                } else {
                  await explorerService.assignFolderTags([mergedItem._id], tagIds);
                }
                queryClient.invalidateQueries({ queryKey: ["explorer"] });
                queryClient.invalidateQueries({
                  queryKey: ["folder-tree", projectId],
                });
              }}
            />
          )}

          {mergedItem && "mimeType" in mergedItem && (
            <PublishToPublishedModal
              open={publishModalOpen}
              onOpenChange={setPublishModalOpen}
              fileId={mergedItem._id}
              onConfirm={() => setView("promote")}
            />
          )}

          {view === "promote" && "mimeType" in mergedItem && (
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
            open={isoRevokeDialogOpen}
            onOpenChange={setIsoRevokeDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke item</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the item into{" "}
                  <strong>4. Archived / Revoked</strong>. It can be restored later
                  from there (admin only).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleIsoRevokeConfirm()}>
                  Revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={isoRestoreConflictOpen}
            onOpenChange={setIsoRestoreConflictOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore — name conflict</AlertDialogTitle>
                <AlertDialogDescription>
                  At the destination there is already a file or folder with the same
                  name (it may be a newer version). Do you want to restore anyway?
                  The existing item at the destination will be replaced (removed).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isoRestoreBusy}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isoRestoreBusy}
                  onClick={() => void handleIsoRestoreOverwrite()}
                >
                  {isoRestoreBusy ? "Restoring…" : "Confirm restore"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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

          {view === "archiveMove" && mergedItem && (
            <ArchiveMoveDestinationView
              projectId={projectId}
              sourceItemIds={[mergedItem._id]}
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
              sourceItemIds={[mergedItem._id]}
              projectId={projectId}
              workflowMode={workflowMode}
              restrictMoveToEffectiveGroupId={
                "effectiveGroupId" in mergedItem
                  ? mergedItem.effectiveGroupId ?? null
                  : null
              }
              parentCdeRootStage={
                "parentCdeRootStage" in mergedItem
                  ? mergedItem.parentCdeRootStage ?? null
                  : null
              }
            />
          )}

          {view === "tags" && (
            <TagsView
              fileIds={"mimeType" in mergedItem ? [mergedItem._id] : []}
              folderIds={!("mimeType" in mergedItem) ? [mergedItem._id] : []}
              initialTags={(mergedItem as IFile | IFolder).tags}
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
