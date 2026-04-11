"use client";

import {
  Key,
  Download,
  FolderInput,
  Trash2,
  MoreVertical,
  Share2,
  History,
  Clock,
  Archive,
  CheckSquare,
  Eye,
  Tags,
  Lock,
  Unlock,
  ArrowUpCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IFile, IFolder, CdeWorkflowMode, CdeCapabilities } from "@/types/explorer";
import {
  getFolderIsoPanelAccess,
  getFileIsoPanelAccess,
} from "@/lib/explorer/folderPanelAccess";
import { AddToReleaseDialog } from "../../dialogs/AddToReleaseDialog";
import { useState, useMemo } from "react";
import {
  getPromoteOptionsForFile,
  isCurrentVersionSubmittedForReview,
  canMoveToArchivedIso,
  type PromoteTargetStage,
} from "@/lib/explorer/cdePromote";

interface Props {
  item: IFile | IFolder;
  projectId: string;
  onDownload: () => void;
  onOpenMove: () => void;
  onDelete: () => void;
  onOpenShare: () => void;
  onNavigate: () => void;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  onAddTags: () => void;
  onOpenPermissions: () => void;
  onOpenHistory?: () => void;
  onOpenActivity?: () => void;
  workflowMode?: CdeWorkflowMode;
  cdeCapabilities?: CdeCapabilities;
  onPromote?: (targetStage: PromoteTargetStage) => void;
  /** Shared→Published: open folder picker (not used for WIP→Shared). */
  onOpenPromoteDestination?: () => void;
  /** ISO admin: move file/folder from Shared or Published into 4. Archived. */
  onOpenArchiveMove?: () => void;
  isPromoting?: boolean;
  onSubmitForReview?: () => void;
  isSubmittingReview?: boolean;
  currentUserId?: string;
}

export default function ToolbarSection({
  item,
  projectId,
  onDownload,
  onOpenMove,
  onDelete,
  onOpenShare,
  onNavigate,
  onToggleLock,
  onAddTags,
  onOpenPermissions,
  onOpenHistory,
  onOpenActivity,
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
  const [isAddToReleaseOpen, setIsAddToReleaseOpen] = useState(false);
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

  const promoteOptions = useMemo(() => {
    if (!isFile || !cdeCapabilities || (!onPromote && !onOpenPromoteDestination)) return [];
    return getPromoteOptionsForFile(
      workflowMode,
      (item as IFile).parentCdeRootStage,
      cdeCapabilities,
      item as IFile,
    );
  }, [isFile, item, workflowMode, cdeCapabilities, onPromote, onOpenPromoteDestination]);

  const parentStageForArchive = isFile
    ? fileItem?.parentCdeRootStage
    : folderItem?.parentCdeRootStage;
  const showMoveToArchived =
    !isFileBasicPanel &&
    !isFolderBasicPanel &&
    canMoveToArchivedIso(
      workflowMode,
      parentStageForArchive,
      cdeCapabilities,
      isFile ? undefined : { folder: folderItem ?? null },
    ) &&
    !!onOpenArchiveMove;

  const memberSubmittedThisVersion =
    isFile &&
    fileItem &&
    isCurrentVersionSubmittedForReview(fileItem);

  const showSubmitForReview =
    isFile &&
    workflowMode === "ISO_19650" &&
    (item as IFile).parentCdeRootStage === "WIP" &&
    !!cdeCapabilities &&
    !cdeCapabilities.isProjectAdmin &&
    !cdeCapabilities.isGroupLeader &&
    !!onSubmitForReview &&
    !memberSubmittedThisVersion;

  const renderAddToReleaseDialog = () => (
    <AddToReleaseDialog
      open={isAddToReleaseOpen}
      onOpenChange={setIsAddToReleaseOpen}
      projectId={projectId}
      itemsToAdd={[item]}
    />
  );
  // --- LOGIC 1: ITEM FOLDER ---
  if (!isFile) {
    if (isFolderBasicPanel) {
      return (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <TooltipAction
              icon={<Download size={18} />}
              label="Download"
              onClick={onDownload}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-gray-100 h-9 w-9 data-[state=open]:bg-gray-100"
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onOpenActivity?.()}
                >
                  <History className="mr-2 h-4 w-4 text-slate-500" />
                  <span>See activity</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onOpenHistory?.()}
                >
                  <Clock className="mr-2 h-4 w-4 text-slate-500" />
                  <span>See history</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between px-4 py-2">
        {/* 1. Permissions */}
        <TooltipAction
          icon={<Key size={18} />}
          label="Permissions"
          onClick={onOpenPermissions}
        />

        {/* 2. Download */}
        <TooltipAction
          icon={<Download size={18} />}
          label="Download"
          onClick={onDownload}
        />

        {!isIsoAdminRestrictedFolder && (
          <TooltipAction
            icon={<FolderInput size={18} />}
            label="Move to..."
            onClick={onOpenMove}
          />
        )}

        {showMoveToArchived && (
          <TooltipAction
            icon={<Archive size={18} />}
            label="Move to Archived"
            onClick={() => onOpenArchiveMove?.()}
          />
        )}

        {!isIsoAdminRestrictedFolder && (
          <TooltipAction
            icon={<Trash2 size={18} />}
            label="Delete"
            onClick={onDelete}
          />
        )}

        {/* 5. More Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-gray-100 h-9 w-9 data-[state=open]:bg-gray-100"
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onOpenActivity?.()}
            >
              <History className="mr-2 h-4 w-4 text-slate-500" />
              <span>See activity</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onOpenHistory?.()}
            >
              <Clock className="mr-2 h-4 w-4 text-slate-500" />
              <span>See history</span>
            </DropdownMenuItem>

            {!isIsoAdminRestrictedFolder && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onToggleLock("LOCK")}
                  className="cursor-pointer"
                >
                  <Lock className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Checkin files</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleLock("UNLOCK")}
                  className="cursor-pointer"
                >
                  <Unlock className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Checkout files</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer" onClick={onAddTags}>
              <Tags className="mr-2 h-4 w-4 text-slate-500" />
              <span>Add tags</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // --- LOGIC 2: ITEM FILE ---
  return (
    <div className="px-4 py-2 space-y-2">
      <div className="flex items-center gap-1">
        <Button
          onClick={onNavigate}
          className="bg-slate-800 hover:bg-slate-700 text-white h-9 px-4 text-sm font-medium mr-auto"
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>

        {!isFileBasicPanel && (
          <>
            <TooltipAction
              icon={<Key size={18} />}
              label="Permissions"
              onClick={onOpenPermissions}
            />
            <TooltipAction
              icon={<Share2 size={18} />}
              label="Share"
              onClick={onOpenShare}
            />
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-gray-100 h-9 w-9 data-[state=open]:bg-gray-100"
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-60 max-h-[400px] overflow-y-auto"
          >
            <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4 text-slate-500" />
              <span>Download</span>
            </DropdownMenuItem>

            {!isFileBasicPanel && (
              <>
                <DropdownMenuItem onClick={onOpenMove} className="cursor-pointer">
                  <FolderInput className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Move to...</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onOpenActivity?.()}
            >
              <History className="mr-2 h-4 w-4 text-slate-500" />
              <span>See activity</span>
            </DropdownMenuItem>

            {!isFileBasicPanel && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsAddToReleaseOpen(true)}
                >
                  <Archive className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Add to Release</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CheckSquare className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Add to ToDo</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onToggleLock("LOCK")}
                  className="cursor-pointer"
                >
                  <Lock className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Checkin file(s)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleLock("UNLOCK")}
                  className="cursor-pointer"
                >
                  <Unlock className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Checkout file(s)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={onAddTags}>
                  <Tags className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Add tags</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!isFileBasicPanel && promoteOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 px-3 justify-start text-xs font-medium border-amber-200 bg-amber-50/80 text-amber-950 hover:bg-amber-100"
              disabled={isPromoting}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Promote
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
              Creates a copy in the destination; the original file is not moved.
            </div>
            {promoteOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.targetStage}
                className="cursor-pointer flex-col items-start gap-1 py-3"
                onClick={() => {
                  if (opt.targetStage === "SHARED") {
                    onPromote?.("SHARED");
                  } else if (opt.targetStage === "PUBLISHED") {
                    onOpenPromoteDestination?.();
                  }
                }}
                disabled={isPromoting}
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-muted-foreground font-normal leading-snug">
                  {opt.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isFileBasicPanel && showMoveToArchived && isFile && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 px-3 justify-start text-xs font-medium border-slate-200 bg-slate-50/80 text-slate-900 hover:bg-slate-100"
          onClick={() => onOpenArchiveMove?.()}
        >
          <Archive className="mr-2 h-4 w-4" />
          Move to Archived
        </Button>
      )}

      {!isFileBasicPanel && showSubmitForReview && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 px-3 justify-start text-xs font-medium border-blue-200 bg-blue-50/80 text-blue-950 hover:bg-blue-100"
          disabled={isSubmittingReview}
          onClick={onSubmitForReview}
          title="Submit this version for leader review"
        >
          <Send className="mr-2 h-4 w-4" />
          Submit for Review
        </Button>
      )}
      {renderAddToReleaseDialog()}
    </div>
  );
}

// Helper Component
function TooltipAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-gray-100 h-9 w-9"
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
