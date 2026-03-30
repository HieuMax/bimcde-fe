"use client";

import React, { useEffect, useRef, useState } from "react";
import { IView } from "@/types/view";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  X,
  Pencil,
  Trash2,
  Box,
  FileText,
  MoreVertical,
  Calendar,
  User,
  Share2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { useTags } from "@/components/features/explorer/hooks/useTags";
import {
  VIEW_DESCRIPTION_MAX_LENGTH,
  VIEW_NAME_MAX_LENGTH,
  VIEW_TAGS_MAX_COUNT,
  getViewTagIds,
  validateViewEditInput,
  type ViewEditErrors,
} from "@/lib/view/viewFormValidation";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ViewPropertiesPanelProps {
  view: IView;
  projectId: string;
  onClose: () => void;
  /** When true once, panel opens in edit mode (e.g. from row “Edit”) */
  editIntent?: boolean;
  onEditIntentHandled?: () => void;
  onUpdate: (
    view: IView,
    payload: { name: string; description: string; tagIds: string[] },
  ) => Promise<void>;
  onDelete: (view: IView) => void;
  onOpen: (view: IView) => void;
}

export const ViewPropertiesPanel: React.FC<ViewPropertiesPanelProps> = ({
  view,
  projectId,
  onClose,
  editIntent = false,
  onEditIntentHandled,
  onUpdate,
  onDelete,
  onOpen,
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: view.name,
    description: view.description ?? "",
    tagIds: getViewTagIds(view),
  });
  const [errors, setErrors] = useState<ViewEditErrors>({});

  const prevViewIdRef = useRef<string | null>(null);

  const { tags: projectTags, isLoading: tagsLoading } = useTags(projectId);

  useEffect(() => {
    if (editIntent) {
      setMode("edit");
      onEditIntentHandled?.();
    }
  }, [editIntent, view._id, onEditIntentHandled]);

  useEffect(() => {
    setDraft({
      name: view.name,
      description: view.description ?? "",
      tagIds: getViewTagIds(view),
    });
    setErrors({});
  }, [view._id, view.name, view.description, view.tags]);

  useEffect(() => {
    if (prevViewIdRef.current === null) {
      prevViewIdRef.current = view._id;
      return;
    }
    if (prevViewIdRef.current !== view._id) {
      prevViewIdRef.current = view._id;
      setMode("view");
    }
  }, [view._id]);

  const resetDraftFromView = () => {
    setDraft({
      name: view.name,
      description: view.description ?? "",
      tagIds: getViewTagIds(view),
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setMode("view");
    resetDraftFromView();
  };

  const handleSave = async () => {
    const { errors: nextErrors, name, description, tagIds } =
      validateViewEditInput({
        nameRaw: draft.name,
        descriptionRaw: draft.description,
        tagIds: draft.tagIds,
      });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const msg =
        nextErrors.name ??
        nextErrors.description ??
        nextErrors.tags ??
        "Please fix the form.";
      toast.error(msg);
      return;
    }

    try {
      setSaving(true);
      await onUpdate(view, { name, description, tagIds });
      toast.success("View updated");
      setMode("view");
    } catch (e) {
      console.error(e);
      const msg =
        (e as AxiosError<{ message?: string }>)?.response?.data?.message ??
        "Failed to update view";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const tagPills = (view.tags ?? []).map((t, i) => {
    if (typeof t === "string") {
      return (
        <span
          key={`${t}-${i}`}
          className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border"
        >
          {t}
        </span>
      );
    }
    return (
      <span
        key={t._id}
        className="inline-flex px-2 py-0.5 rounded text-xs border"
        style={{
          backgroundColor: `${t.color}18`,
          borderColor: `${t.color}55`,
          color: "#334155",
        }}
      >
        {t.name}
      </span>
    );
  });

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-xl min-w-0">
      {mode === "view" ? (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[60px] shrink-0">
          <h2
            className="text-base font-medium text-gray-900 truncate pr-2"
            title={view.name}
          >
            {view.name}
          </h2>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              title="Edit"
              onClick={() => {
                resetDraftFromView();
                setMode("edit");
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border-b border-gray-200 min-h-[52px] shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Back"
            disabled={saving}
            onClick={handleCancelEdit}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">
              Edit View
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col pb-6">
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden shrink-0">
            {view.thumbnailUrl ? (
              <img
                src={view.thumbnailUrl}
                alt={view.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                {view.type === "3D" ? (
                  <Box className="w-16 h-16 mb-2 text-blue-300" />
                ) : (
                  <FileText className="w-16 h-16 mb-2 text-red-300" />
                )}
                <span className="text-sm">No Thumbnail</span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Button
                className="bg-white/90 text-black hover:bg-white shadow-sm"
                onClick={() => onOpen(view)}
              >
                Open View
              </Button>
            </div>
          </div>

          <Separator />

          {mode === "view" && (
            <>
              <div className="flex items-center justify-around p-2 bg-gray-50/50">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => onOpen(view)}
                >
                  <Box className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-semibold">
                    Open
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onDelete(view)}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-semibold">
                    Delete
                  </span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5" />
                      <span className="text-[10px] uppercase font-semibold">
                        More
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        resetDraftFromView();
                        setMode("edit");
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator />
            </>
          )}

          <div className="p-4 space-y-5">
            {mode === "view" ? (
              <>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Details
                </h3>

                <div className="space-y-4">
                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <Box className="h-3 w-3" /> Type
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                      {view.type} View
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Description
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                      {view.description || (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      Tags
                    </p>
                    <div className="pl-5 flex flex-wrap gap-1.5">
                      {tagPills.length > 0 ? (
                        tagPills
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          No tags
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <User className="h-3 w-3" /> Created By
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                      {(view.createdBy as { fullName?: string })?.fullName ||
                        "Unknown"}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Created Date
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                      {format(new Date(view.createdAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Last Modified
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                      {format(new Date(view.updatedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                      <Share2 className="h-3 w-3" /> Shared With
                    </p>
                    <div className="pl-5">
                      {view.sharedWith?.isPublic ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Public
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {view.sharedWith?.users?.length
                            ? `${view.sharedWith.users.length} users`
                            : "Private (Only me)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-5 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <Label className="text-xs font-medium text-gray-500">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {draft.name.length}/{VIEW_NAME_MAX_LENGTH}
                    </span>
                  </div>
                  <Input
                    value={draft.name}
                    maxLength={VIEW_NAME_MAX_LENGTH}
                    disabled={saving}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, name: e.target.value }));
                      if (errors.name)
                        setErrors((er) => ({ ...er, name: undefined }));
                    }}
                    className={cn(
                      "h-9",
                      errors.name && "border-red-600",
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Angle brackets and script-like patterns are removed on
                    save.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <Label className="text-xs font-medium text-gray-500">
                      Description
                    </Label>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {draft.description.length}/{VIEW_DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    value={draft.description}
                    maxLength={VIEW_DESCRIPTION_MAX_LENGTH}
                    disabled={saving}
                    onChange={(e) => {
                      setDraft((d) => ({
                        ...d,
                        description: e.target.value,
                      }));
                      if (errors.description)
                        setErrors((er) => ({
                          ...er,
                          description: undefined,
                        }));
                    }}
                    className={cn(
                      "min-h-[88px] resize-none",
                      errors.description && "border-red-600",
                    )}
                    placeholder="Plain text; HTML-like content is stripped on save."
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Shared With
                  </Label>
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Sharing controls will be available in a later update.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <Label className="text-xs font-medium text-gray-500">
                      Tags
                    </Label>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {draft.tagIds.length}/{VIEW_TAGS_MAX_COUNT}
                    </span>
                  </div>
                  <MultiSelect
                    values={draft.tagIds}
                    onValuesChange={(values) => {
                      setDraft((d) => ({
                        ...d,
                        tagIds: values.slice(0, VIEW_TAGS_MAX_COUNT),
                      }));
                      if (errors.tags)
                        setErrors((er) => ({ ...er, tags: undefined }));
                    }}
                  >
                    <MultiSelectTrigger
                      className="w-full justify-between"
                      disabled={saving || tagsLoading}
                    />
                    <MultiSelectContent>
                      {projectTags.map((t) => (
                        <MultiSelectItem key={t._id} value={t._id}>
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectContent>
                  </MultiSelect>
                  {errors.tags && (
                    <p className="text-xs text-red-600">{errors.tags}</p>
                  )}
                  {projectTags.length === 0 && !tagsLoading && (
                    <p className="text-[10px] text-gray-400">
                      No project tags yet. Create tags in the explorer.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {mode === "edit" && (
        <div className="border-t p-3 bg-white shrink-0">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={saving}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#005F9E] hover:bg-[#004B7D] text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
