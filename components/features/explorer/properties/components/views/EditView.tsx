"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, X, Loader2, Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { IFile, IFolder } from "@/types/explorer";
import {
  validateFolderRename,
  validateFileRenameStem,
} from "@/lib/explorer/renameValidation";
import { useTags } from "@/components/features/explorer/hooks/useTags";
import { ITag } from "@/types/tag";
import { toast } from "sonner";

interface Props {
  item: IFile | IFolder;
  onBack: () => void;
  onClose: () => void;
  projectId: string;
  onSaveRename: (newName: string) => Promise<void>;
  onSaveTags: (tagIds: string[]) => Promise<void>;
}

function getNameWithoutExt(fullName: string): string {
  const lastDotIndex = fullName.lastIndexOf(".");
  return lastDotIndex > 0 ? fullName.substring(0, lastDotIndex) : fullName;
}

function getExtensionSuffix(fullName: string): string {
  const lastDotIndex = fullName.lastIndexOf(".");
  return lastDotIndex > 0 ? fullName.slice(lastDotIndex) : "";
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

export default function EditView({
  item,
  onBack,
  onClose,
  projectId,
  onSaveRename,
  onSaveTags,
}: Props) {
  const isFile = "mimeType" in item;

  const initialNameField = useMemo(
    () => (isFile ? getNameWithoutExt(item.name) : item.name),
    [isFile, item.name],
  );

  const [name, setName] = useState(initialNameField);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    tags: allTags,
    isLoading: tagsLoading,
    createTag,
  } = useTags(projectId);
  const [search, setSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [initialTagIds, setInitialTagIds] = useState<Set<string>>(new Set());
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    setName(isFile ? getNameWithoutExt(item.name) : item.name);
    setNameError(null);
    const ids = new Set((item.tags ?? []).map((t) => t._id));
    setSelectedTagIds(ids);
    setInitialTagIds(new Set(ids));
  }, [item._id, item.name, isFile, item.tags]);

  const filteredTags = useMemo(
    () =>
      allTags.filter((tag: ITag) =>
        tag.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [allTags, search],
  );

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const handleQuickCreateTag = async () => {
    if (!search.trim()) return;
    setIsCreatingTag(true);
    try {
      const response = await createTag({ name: search.trim(), projectId });
      setSelectedTagIds((prev) => new Set(prev).add(response._id));
      setSearch("");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const validateName = (): string | null => {
    if (isFile) {
      const r = validateFileRenameStem(name, item.name);
      if (!r.valid) return r.message;
      return null;
    }
    const r = validateFolderRename(name);
    if (!r.valid) return r.message;
    return null;
  };

  const handleSave = async () => {
    const err = validateName();
    if (err) {
      setNameError(err);
      toast.error(err);
      return;
    }
    setNameError(null);

    let trimmedName: string;
    if (isFile) {
      const vr = validateFileRenameStem(name, item.name);
      if (!vr.valid) return;
      trimmedName = vr.trimmed;
    } else {
      const vr = validateFolderRename(name);
      if (!vr.valid) return;
      trimmedName = vr.trimmed;
    }

    const nameChanged = trimmedName !== initialNameField;
    const tagsChanged = !setsEqual(selectedTagIds, initialTagIds);

    if (!nameChanged && !tagsChanged) {
      onBack();
      return;
    }

    setIsSaving(true);
    try {
      if (nameChanged) {
        await onSaveRename(trimmedName);
      }
      if (tagsChanged) {
        await onSaveTags(Array.from(selectedTagIds));
      }
      if (tagsChanged && !nameChanged) {
        toast.success("Tags updated successfully");
      }
      onBack();
    } catch (e) {
      console.error(e);
      if (tagsChanged && nameChanged) {
        toast.error("Could not save all changes");
      } else if (tagsChanged) {
        toast.error("Could not update tags");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const extSuffix = isFile ? getExtensionSuffix(item.name) : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border h-[70px] shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-2 text-foreground hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Edit</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-normal text-slate-500"
            >
              {isFile ? "Name" : "Folder name"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                className={`text-base text-slate-900 border-slate-300 focus-visible:ring-blue-500 ${nameError ? "border-red-500" : ""}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave();
                }}
              />
              {isFile && extSuffix ? (
                <span className="text-sm text-slate-500 shrink-0 tabular-nums">
                  {extSuffix}
                </span>
              ) : null}
            </div>
            {isFile ? (
              <p className="text-xs text-slate-400">
                Extension stays the same. Max length applies to the full file
                name including extension.
              </p>
            ) : null}
            {nameError ? (
              <p className="text-xs text-red-600">{nameError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-normal text-slate-500">Tags</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or create tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    filteredTags.length === 0 &&
                    search.trim()
                  ) {
                    void handleQuickCreateTag();
                  }
                }}
              />
            </div>
            {search.trim() && filteredTags.length === 0 && !tagsLoading ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                type="button"
                onClick={() => void handleQuickCreateTag()}
                disabled={isCreatingTag}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create &quot;{search.trim()}&quot;
              </Button>
            ) : null}

            <div className="border rounded-md max-h-[200px] overflow-y-auto">
              {tagsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading tags…
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredTags.map((tag: ITag) => (
                    <div
                      key={tag._id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleToggleTag(tag._id)}
                    >
                      <Checkbox
                        checked={selectedTagIds.has(tag._id)}
                        onCheckedChange={() => handleToggleTag(tag._id)}
                        id={`edit-tag-${tag._id}`}
                      />
                      <label
                        htmlFor={`edit-tag-${tag._id}`}
                        className="text-sm font-medium leading-none flex-1 cursor-pointer"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                  {filteredTags.length === 0 && !search.trim() ? (
                    <p className="text-xs text-slate-400 p-2 text-center">
                      No tags in this project yet. Type a name to create one.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-white flex justify-end gap-3 shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || !name.trim()}
          className="bg-[#6fa3b9] hover:bg-[#5d8a9e] text-white min-w-20"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
