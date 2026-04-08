"use client";

import { useState, useMemo } from "react";
import { IFile, IFolder } from "@/types/explorer";

function isBlockedFolder(item: IFile | IFolder): boolean {
  return "totalSize" in item && (item as IFolder).cdeAccessible === false;
}

export function useExplorerSelection(
  files: IFile[],
  folders: IFolder[],
  folderId: string | null
) {
  const [selectedItems, setSelectedItems] = useState<(IFile | IFolder)[]>([]);
  const [prevFolderId, setPrevFolderId] = useState<string | null>(null);

  if (folderId !== prevFolderId) {
    setPrevFolderId(folderId);
    setSelectedItems([]);
  }
  // --- FRESH ITEMS ---
  const freshSelectedItems = useMemo(() => {
    return selectedItems.map((item) => {
      const freshItem =
        files.find((f) => f._id === item._id) ||
        folders.find((f) => f._id === item._id);
      return freshItem || item;
    });
  }, [selectedItems, files, folders]);

  // Helper
  const singleFreshItem =
    freshSelectedItems.length === 1 ? freshSelectedItems[0] : null;

  // --- HANDLERS ---
  // 1. Single Select
  const handleRowClickSelect = (item: IFile | IFolder) => {
    if (isBlockedFolder(item)) return;

    const isCurrentlySelectedSingle =
      selectedItems.length === 1 && selectedItems[0]._id === item._id;

    if (isCurrentlySelectedSingle) {
      setSelectedItems([]);
    } else {
      setSelectedItems([item]);
    }
  };

  // 2. Multi Select (Checkbox)
  const handleCheckboxSelect = (item: IFile | IFolder) => {
    if (isBlockedFolder(item)) return;
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      return exists ? prev.filter((i) => i._id !== item._id) : [...prev, item];
    });
  };

  // 3. Shift + Click
  const handleSetSelectedItems = (items: (IFile | IFolder)[]) => {
    setSelectedItems(items.filter((i) => !isBlockedFolder(i)));
  };

  const handleDeselectItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i._id !== id));
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    freshSelectedItems,
    singleFreshItem,
    handleRowClickSelect,
    handleCheckboxSelect,
    handleSetSelectedItems,
    handleDeselectItem,
    handleClearSelection,
  };
}
