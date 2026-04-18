"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; // [QUAN TRỌNG] Import dynamic
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { FolderIcon } from "lucide-react";

import ExplorerToolbar from "./ExplorerToolbar";
import ViewList from "./views/ViewList";
import ViewGrid from "./views/ViewGrid";
import { Skeleton } from "@/components/ui/skeleton";

// --- HOOKS ---
import { useExplorerData } from "./hooks/useExplorerData";
import { useExplorerSelection } from "./hooks/useExplorerSelection";
import { useExplorerActions } from "./hooks/useExplorerActions";
import { ViewMode, IFile, IFolder } from "@/types/explorer";
import { useAuth } from "@/app/context/authContext";
import { wouldExceedMaxNesting } from "./utils/getFolderDepthFromAncestors";
import { toast } from "sonner";

// --- [OPTIMIZATION] DYNAMIC IMPORTS (Lazy Loading) ---
// Chỉ tải code khi cần hiển thị. Giúp trang load ban đầu nhanh hơn hẳn.

const PropertiesPanel = dynamic(() => import("./properties/PropertiesPanel"), {
  loading: () => <PanelSkeleton />, // Hiển thị khung xương trong lúc tải code
  ssr: false, // Panel chỉ tương tác ở client, không cần render từ server
});

const BulkPropertiesPanel = dynamic(() => import("./BulkPropertiesPanel"), {
  loading: () => <PanelSkeleton />,
  ssr: false,
});

const CreateFolderDialog = dynamic(
  () => import("./dialogs/CreateFolderDialog"),
  {
    ssr: false,
  },
);

const MoreActionsDialog = dynamic(() => import("./dialogs/MoreActionDialog"), {
  ssr: false,
});

interface Props {
  projectId: string;
  folderId: string | null;
}

export default function ExplorerClient({ projectId, folderId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  // --- STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [openActivityTick, setOpenActivityTick] = useState(0);

  // --- DATA HOOK ---
  const {
    folders,
    files,
    currentFolder,
    ancestors,
    isLoading,
    isPlaceholderData,
    refetch,
    sortConfig,
    handleSort,
    workflowMode,
    cdeCapabilities,
  } = useExplorerData(projectId, folderId);

  // --- SELECTION HOOK ---
  const {
    selectedItems,
    freshSelectedItems,
    singleFreshItem,
    handleRowClickSelect,
    handleCheckboxSelect,
    handleSetSelectedItems,
    handleDeselectItem,
    handleClearSelection,
  } = useExplorerSelection(files, folders, folderId);

  // --- ACTIONS HOOK ---
  const actions = useExplorerActions(projectId, folderId, handleClearSelection);

  const createFolderBlockedByDepth = wouldExceedMaxNesting(
    ancestors as IFolder[],
    currentFolder as IFolder | null,
  );

  const isoCdeRootHint =
    "ISO 19650: you cannot add items at project root or directly inside 1. WIP / 2. Shared. Open a team folder first.";

  /** Block project root + only WIP/Shared CDE roots (not Published/Archived) */
  const isoBlocksCdeRootLevel =
    workflowMode === "ISO_19650" &&
    (!currentFolder ||
      (currentFolder.isCdeRoot === true &&
        (currentFolder.cdeStage === "WIP" ||
          currentFolder.cdeStage === "SHARED")));

  const createFolderDisabledTitle = createFolderBlockedByDepth
    ? "Maximum folder nesting depth (7 levels) has been reached."
    : isoBlocksCdeRootLevel
      ? isoCdeRootHint
      : undefined;

  useEffect(() => {
    setOpenActivityTick(0);
  }, [singleFreshItem?._id]);

  // --- DRAG & DROP ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;
    const draggedItemId = active.id as string;
    const targetFolderId = over.id as string;

    if (draggedItemId === targetFolderId) return;
    const targetData = over.data.current as { item: IFolder };
    if (!targetData || !("totalSize" in targetData.item)) return;

    const isDraggingSelected = selectedItems.some(
      (i) => i._id === draggedItemId,
    );
    let itemsToMove: (IFile | IFolder)[] = [];

    if (isDraggingSelected) {
      itemsToMove = freshSelectedItems;
    } else {
      const draggedItem =
        files.find((f) => f._id === draggedItemId) ||
        folders.find((f) => f._id === draggedItemId);
      if (draggedItem) itemsToMove = [draggedItem];
    }

    await actions.moveItems(itemsToMove, targetFolderId);
  };

  const getDragOverlayContent = () => {
    if (!activeDragId) return null;
    const isDraggingSelected = selectedItems.some(
      (i) => i._id === activeDragId,
    );
    const dragCount = isDraggingSelected ? selectedItems.length : 1;

    return (
      <div className="flex flex-col items-center justify-center w-24 h-24 rounded-xl bg-blue-600 text-white shadow-2xl cursor-grabbing opacity-90 relative animate-in fade-in zoom-in duration-200">
        <FolderIcon className="size-10 fill-white/20 mb-1" />
        <span className="text-xs font-bold font-mono">
          {dragCount} item{dragCount > 1 ? "s" : ""}
        </span>
        {dragCount > 1 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-6 w-6 rounded-full border-2 border-white shadow-sm">
            {dragCount}
          </span>
        )}
      </div>
    );
  };

  const handleNavigate = (item: IFolder | IFile) => {
    if ("mimeType" in item) {
      router.push(`/projects/${projectId}/viewer/${item._id}`);
    } else {
      if ((item as IFolder).cdeAccessible === false) {
        toast.error("You do not have access to this folder.");
        return;
      }
      router.push(`/projects/${projectId}/data?folderId=${item._id}`);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClearSelection();
    }
  };
  const isPanelOpen = selectedItems.length > 0;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full relative overflow-hidden">
        {/* LEFT MAIN CONTENT */}
        <div
          className={`flex flex-col h-full flex-1 transition-all duration-300 ${
            isPanelOpen ? "mr-0 sm:mr-80" : "mr-0"
          }`}
        >
          <ExplorerToolbar
            currentFolder={currentFolder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onRefresh={() => refetch()}
            isLoading={isLoading && !isPlaceholderData}
            onCreateFolderClick={() => setIsCreateOpen(true)}
            createFolderDisabled={
              createFolderBlockedByDepth || isoBlocksCdeRootLevel
            }
            createFolderDisabledTitle={createFolderDisabledTitle}
            uploadDisabled={isoBlocksCdeRootLevel}
            uploadDisabledTitle={isoCdeRootHint}
            onUpload={async (files, onProgress) => {
              await actions.uploadFiles(files, { onProgress });
            }}
            ancestors={ancestors}
            projectId={projectId}
            workflowMode={workflowMode}
          />

          <div
            className="flex-1 overflow-y-auto bg-white px-4 pb-4"
            onClick={handleBackgroundClick}
          >
            {isLoading && !isPlaceholderData ? (
              <SkeletonList />
            ) : (
              <div
                className={
                  isPlaceholderData ? "opacity-60 transition-opacity" : ""
                }
              >
                {viewMode === "list" ? (
                  <ViewList
                    folders={folders}
                    files={files}
                    selectedIds={selectedItems.map((i) => i._id)}
                    onRowClick={handleRowClickSelect}
                    onMultiSelect={handleSetSelectedItems}
                    onCheckboxClick={handleCheckboxSelect}
                    onNavigate={handleNavigate}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                ) : (
                  <ViewGrid
                    folders={folders}
                    files={files}
                    selectedIds={selectedItems.map((i) => i._id)}
                    onRowClick={handleRowClickSelect}
                    onMultiSelect={handleSetSelectedItems}
                    onCheckboxClick={handleCheckboxSelect}
                    onNavigate={handleNavigate}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                )}

                {!folders.length && !files.length && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p>This folder is empty</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DYNAMIC DIALOGS */}
          {/* Chỉ render component khi isCreateOpen = true (người dùng bấm nút) */}
          {isCreateOpen && (
            <CreateFolderDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              onSubmit={async (name) => {
                await actions.createFolder(name);
              }}
              currentFolderName={currentFolder?.name ?? "Explorer"}
              nestingBlocked={createFolderBlockedByDepth}
            />
          )}

          {isMoreOpen && freshSelectedItems.length === 1 && (
            <MoreActionsDialog
              open={isMoreOpen}
              onOpenChange={setIsMoreOpen}
              item={singleFreshItem}
              onToggleLock={(action) =>
                actions.toggleLockItems([singleFreshItem!], action)
              }
              currentUserId={user!._id}
              onOpenActivity={() => setOpenActivityTick((t) => t + 1)}
            />
          )}
        </div>

        {/* RIGHT PANEL (PROPERTIES) - DYNAMIC LOADED */}
        <aside
          className={`
            bg-white shadow-lg border-l z-20 flex flex-col
            fixed inset-0 w-full h-full
            transition-opacity duration-200
            ${
              isPanelOpen
                ? "opacity-100 visible pointer-events-auto"
                : "opacity-0 invisible pointer-events-none"
            }
            sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-[320px] 
            sm:opacity-100 sm:visible sm:pointer-events-auto
            sm:transition-transform sm:duration-300
            ${isPanelOpen ? "sm:translate-x-0" : "sm:translate-x-full"}
          `}
        >
          {/* Lưu ý: Ta vẫn render component nhưng code của nó chỉ tải về khi 
             freshSelectedItems > 0. 
          */}
          {freshSelectedItems.length === 1 ? (
            <PropertiesPanel
              key={singleFreshItem?._id || "empty"}
              open={true}
              item={singleFreshItem}
              onClose={handleClearSelection}
              onDelete={() => actions.deleteItems([singleFreshItem!])}
              onDownload={() => actions.downloadItems([singleFreshItem!])}
              onOpenMore={() => setIsMoreOpen(true)}
              onRename={async (newName) => {
                await actions.renameItem(singleFreshItem!, newName);
              }}
              onMoveItem={(destId) =>
                actions.moveItems([singleFreshItem!], destId)
              }
              onToggleLock={(action) =>
                actions.toggleLockItems(freshSelectedItems, action)
              }
              projectId={projectId}
              workflowMode={workflowMode}
              cdeCapabilities={cdeCapabilities}
              onPromote={async (targetStage, destinationFolderId) => {
                if (!singleFreshItem || !("mimeType" in singleFreshItem)) return;
                await actions.promoteFile(
                  singleFreshItem._id,
                  targetStage,
                  destinationFolderId,
                );
                handleClearSelection();
              }}
              isPromoting={actions.isPromoting}
              onSubmitForReview={async () => {
                if (!singleFreshItem || !("mimeType" in singleFreshItem)) return;
                await actions.submitFileForReview(singleFreshItem._id);
                handleClearSelection();
              }}
              isSubmittingReview={actions.isSubmittingReview}
              currentUserId={user?._id}
              openActivityTick={openActivityTick}
            />
          ) : freshSelectedItems.length > 1 ? (
            <BulkPropertiesPanel
              selectedItems={freshSelectedItems}
              onClose={handleClearSelection}
              onDeselectItem={handleDeselectItem}
              onDownload={() => actions.downloadItems(freshSelectedItems)}
              onDelete={() => actions.deleteItems(freshSelectedItems)}
              onToggleLock={(action) =>
                actions.toggleLockItems(freshSelectedItems, action)
              }
              onMoveItems={(destId) =>
                actions.moveItems(freshSelectedItems, destId)
              }
              projectId={projectId}
              workflowMode={workflowMode}
              cdeCapabilities={cdeCapabilities}
            />
          ) : null}
        </aside>
      </div>

      <DragOverlay
        adjustScale={false}
        modifiers={[snapCenterToCursor]}
        dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeDragId ? getDragOverlayContent() : null}
      </DragOverlay>
    </DndContext>
  );
}

// Skeleton nhẹ cho Panel trong lúc chờ tải code
function PanelSkeleton() {
  return (
    <div className="h-full w-full p-4 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-[150px] w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3 mt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full bg-slate-100" />
      ))}
    </div>
  );
}
