"use client";

import React, { useState } from "react";
import { IFile, IFolder } from "@/types/explorer";

// Import Views
import DetailsView from "./components/views/DetailsView";
import HistoryView from "./components/views/HistoryView";
import EditView from "./components/views/EditView";
import MoveDestinationView from "../MoveDestinationView";
import TagsView from "./views/TagsView";
import { useQueryClient } from "@tanstack/react-query";

type ViewMode = "details" | "history" | "edit" | "move" | "tags";

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
}: Props) {
  const [view, setView] = useState<ViewMode>("details");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!open) setView("details");
  }, [open, item?._id]);

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
            />
          )}

          {view === "history" && (
            <HistoryView item={item} onBack={() => setView("details")} />
          )}

          {view === "edit" && (
            <EditView
              item={item}
              onBack={() => setView("details")}
              onClose={onClose}
              onSave={async (newName) => {
                await onRename(newName);
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
