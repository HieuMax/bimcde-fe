"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Camera,
  ChevronDown,
  Download,
  FileText,
  File as FileIcon,
  Loader2,
  MessageSquare,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/app/context/authContext";
import { useComments } from "@/components/features/explorer/hooks/useComments";
import CommentList from "@/components/features/explorer/properties/components/comments/CommentList";
import CommentInput from "@/components/features/explorer/properties/components/comments/CommentInput";
import { topicsService } from "@/services/topics.service";
import {
  Topic,
  TopicPriority,
  TopicStatus,
  TopicType,
  formatTopicDateTime,
} from "./topic-types";
import { TopicReferencesDialog } from "@/components/features/topics/TopicReferencesDialog";
import { RecipientSelector } from "@/components/features/release/RecipientSelector";
import type { TopicFilterOption } from "./filters/TopicsFilters";

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "gray" | "green" | "yellow" | "red" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "yellow"
        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
        : tone === "red"
          ? "bg-red-50 text-red-700 border-red-200"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${cls}`}
    >
      {label}
    </span>
  );
}

export type CreateDefaults = {
  type?: string;
  priority?: string;
  status?: string;
  tags?: string[];
};

export interface TopicPropertiesPanelProps {
  topic: Topic;
  projectId: string;
  onClose: () => void;
  onSaveTopic: (updated: Topic) => void;
  variant?: "edit" | "create";
  /** Default values from filter when creating */
  createDefaults?: CreateDefaults;
  /** Filter options for Type, Priority, Status (from topicSettings) */
  topicTypes?: TopicFilterOption[];
  topicStatuses?: TopicFilterOption[];
  topicPriorities?: TopicFilterOption[];
}

export const TopicPropertiesPanel: React.FC<TopicPropertiesPanelProps> =
  React.memo(({
    topic,
    projectId,
    onClose,
    onSaveTopic,
    variant = "edit",
    createDefaults,
    topicTypes = [],
    topicStatuses = [],
    topicPriorities = [],
  }) => {
    const [mode, setMode] = useState<"view" | "edit">(
      variant === "create" ? "edit" : "view",
    );
    const [coordinationOpen, setCoordinationOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<
      "comments" | "views" | "references"
    >("references");

    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<{
      title: string;
      description: string;
      assignee: string;
      assigneeIds: string[];
      type: TopicType;
      priority: TopicPriority;
      dueDate?: Date;
      tags: string[];
      status: TopicStatus;
    }>(() => {
      const def = variant === "create" ? createDefaults : undefined;
      return {
        title: topic.title,
        description: topic.description ?? "",
        assignee: topic.assignee ?? "",
        assigneeIds: [],
        type: (def?.type as TopicType) ?? topic.type,
        priority: (def?.priority as TopicPriority) ?? topic.priority,
        dueDate: topic.dueDate ? new Date(topic.dueDate) : undefined,
        tags: def?.tags ?? topic.tags ?? [],
        status: (def?.status as TopicStatus) ?? topic.status,
      };
    });

    const [pendingAttachments, setPendingAttachments] = useState<
      NonNullable<Topic["attachments"]>
    >([]);

    useEffect(() => {
      setMode(variant === "create" ? "edit" : "view");
      setCoordinationOpen(false);
      setActiveTab("references");
      const def = variant === "create" ? createDefaults : undefined;
      setDraft({
        title: topic.title,
        description: topic.description ?? "",
        assignee: topic.assignee ?? "",
        assigneeIds: [],
        type: (def?.type as TopicType) ?? topic.type,
        priority: (def?.priority as TopicPriority) ?? topic.priority,
        dueDate: topic.dueDate ? new Date(topic.dueDate) : undefined,
        tags: def?.tags ?? topic.tags ?? [],
        status: (def?.status as TopicStatus) ?? topic.status,
      });
      if (variant === "create") setPendingAttachments([]);
    }, [topic, variant, createDefaults]);

    const handleCancelEdit = () => {
      if (variant === "create") {
        onClose();
        return;
      }
      setMode("view");
      setDraft({
        title: topic.title,
        description: topic.description ?? "",
        assignee: topic.assignee ?? "",
        assigneeIds: [],
        type: topic.type,
        priority: topic.priority,
        dueDate: topic.dueDate ? new Date(topic.dueDate) : undefined,
        tags: topic.tags ?? [],
        status: topic.status,
      });
    };

    const handleSave = async () => {
      if (!draft.title.trim()) return;
      try {
        setSaving(true);
        if (variant === "create") {
          const created = await topicsService.createTopicItem(projectId, {
            title: draft.title.trim(),
            description: draft.description.trim(),
            assignee: draft.assignee.trim(),
            type: draft.type,
            priority: draft.priority,
            status: draft.status,
            tags: draft.tags,
            dueDate: draft.dueDate?.toISOString(),
            authorName: user?.fullName ?? "Unknown",
          });
          const createdTopic = {
            ...created,
            id: created.id,
            code: created.code,
            attachments: created.attachments ?? [],
            stats: created.stats ?? {
              comments: 0,
              viewpoints: 0,
              attachments: 0,
            },
          } as Topic;
          if (pendingAttachments.length > 0 && created.id) {
            await topicsService.addTopicAttachments(created.id, pendingAttachments);
            createdTopic.attachments = pendingAttachments;
            createdTopic.stats = {
              ...createdTopic.stats,
              attachments: pendingAttachments.length,
            };
          }
          onSaveTopic(createdTopic);
        } else {
          const updatedTopic = await topicsService.updateTopicItem(topic.id, {
            title: draft.title.trim(),
            description: draft.description.trim(),
            assignee: draft.assignee.trim(),
            type: draft.type,
            priority: draft.priority,
            status: draft.status,
            tags: draft.tags,
            dueDate: draft.dueDate?.toISOString() ?? null,
          });
          onSaveTopic({
            ...topic,
            ...updatedTopic,
            modifiedAt: updatedTopic.modifiedAt ?? new Date().toISOString(),
          });
          setMode("view");
        }
      } finally {
        setSaving(false);
      }
    };

    const { user } = useAuth();
    const {
      comments,
      totalComments,
      isLoading: isCommentsLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      commentInput,
      setCommentInput,
      addComment,
      isAdding: isAddingComment,
      updateComment,
      deleteComment,
      currentUserId,
    } = useComments(topic.id, "topic");

    const attachments = topic.attachments ?? [];
    const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
    const [isSavingAttachments, setIsSavingAttachments] = useState(false);

    const handleUpdateAttachments = (nextAttachments: Topic["attachments"]) => {
      const next = {
        ...topic,
        attachments: nextAttachments ?? [],
        stats: {
          ...topic.stats,
          attachments: (nextAttachments ?? []).length,
        },
        modifiedAt: new Date().toISOString(),
      };
      onSaveTopic(next);
    };

    const handleAddAttachments = async (
      newFiles: NonNullable<Topic["attachments"]>,
    ) => {
      if (!topic.id) return;
      const safeFiles = Array.isArray(newFiles) ? newFiles : [];
      if (safeFiles.length === 0) return;
      try {
        setIsSavingAttachments(true);
        await topicsService.addTopicAttachments(topic.id, safeFiles);
        handleUpdateAttachments([...(topic.attachments ?? []), ...safeFiles]);
        setIsAttachDialogOpen(false);
      } finally {
        setIsSavingAttachments(false);
      }
    };

    const handleRemoveAttachment = async (url: string) => {
      if (!topic.id) return;
      try {
        setIsSavingAttachments(true);
        await topicsService.removeTopicAttachment(topic.id, url);
        handleUpdateAttachments(
          (topic.attachments ?? []).filter((a) => a.url !== url),
        );
      } finally {
        setIsSavingAttachments(false);
      }
    };

    const handleDownloadAll = () => {
      for (const att of attachments) {
        if (!att.url) continue;
        window.open(att.url, "_blank", "noopener,noreferrer");
      }
    };

    const handleRemoveAll = async () => {
      if (!topic.id) return;
      if (attachments.length === 0) return;
      if (!confirm("Remove all references for this topic?")) return;
      try {
        setIsSavingAttachments(true);
        await topicsService.removeAllTopicAttachments(topic.id);
        handleUpdateAttachments([]);
      } finally {
        setIsSavingAttachments(false);
      }
    };

    return (
      <div className="flex flex-col h-full min-w-0 overflow-hidden bg-white border-l shadow-xl">
        {mode === "view" ? (
          <div className="flex items-center justify-between p-3 border-b border-gray-200 min-h-[52px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">View</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit"
                onClick={() => setMode("edit")}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Delete"
                disabled
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="More"
                disabled
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 min-h-[52px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelEdit}
              className="h-8 w-8"
              title="Back"
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {variant === "create" ? "Create Topic" : "Edit Topic"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              title="Close"
              disabled={saving}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 min-w-0 overflow-x-hidden">
          <div className="p-4 w-full min-w-0 max-w-full overflow-x-hidden">
            {mode === "edit" ? (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    disabled={saving}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Description
                  </Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    disabled={saving}
                    className="min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Assignee
                  </Label>
                  <RecipientSelector
                    key={topic.id}
                    projectId={projectId}
                    initialOptions={
                      draft.assignee
                        ? [
                            {
                              id: draft.assignee,
                              label: draft.assignee,
                              type: "USER" as const,
                            },
                          ]
                        : []
                    }
                    onChange={(ids, options) => {
                      setDraft((d) => ({
                        ...d,
                        assigneeIds: ids,
                        assignee: options?.[0]?.label ?? "",
                      }));
                    }}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Type
                  </Label>
                  <Select
                    value={draft.type}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, type: v as TopicType }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(topicTypes.length > 0
                        ? topicTypes.map((o) => o.value)
                        : [
                            "Undefined",
                            "Comment",
                            "Issue",
                            "Request",
                            "Fault",
                            "Inquiry",
                            "Solution",
                            "Remark",
                            "Clash",
                          ] as const
                      ).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Priority
                  </Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, priority: v as TopicPriority }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {(topicPriorities.length > 0
                        ? topicPriorities.map((o) => o.value)
                        : ["Low", "Normal", "High"] as const
                      ).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Status
                  </Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, status: v as TopicStatus }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(topicStatuses.length > 0
                        ? topicStatuses.map((o) => o.value)
                        : [
                            "New",
                            "In Progress",
                            "Done",
                            "Waiting",
                            "Closed",
                          ] as const
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Due date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={saving}
                        className={cn(
                          "w-full h-9 justify-start text-left font-normal border-gray-300",
                          !draft.dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {draft.dueDate ? (
                          format(draft.dueDate, "MM/dd/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DateCalendar
                        mode="single"
                        selected={draft.dueDate}
                        onSelect={(d) =>
                          setDraft((x) => ({ ...x, dueDate: d ?? undefined }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    Tags
                  </Label>
                  <MultiSelect
                    values={draft.tags}
                    onValuesChange={(values) =>
                      setDraft((d) => ({ ...d, tags: values }))
                    }
                  >
                    <MultiSelectTrigger className="w-full justify-between" />
                    <MultiSelectContent>
                      {[
                        "Issue",
                        "Clash",
                        "Coordination",
                        "Review",
                        "RFI",
                        "Safety",
                        "MEP",
                        "Structure",
                      ].map((t) => (
                        <MultiSelectItem key={t} value={t}>
                          {t}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectContent>
                  </MultiSelect>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">
                    References
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsAttachDialogOpen(true)}
                    className="text-sm text-[#005F9E] hover:underline font-medium flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add References
                  </button>
                  {variant === "create" ? (
                    pendingAttachments.length > 0 && (
                      <div className="mt-2 space-y-1 min-w-0">
                        {pendingAttachments.map((att, idx) => (
                          <div
                            key={att.url || att.fileId || att.name || idx}
                            className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border rounded px-2 py-1.5 min-w-0 group"
                          >
                            <FileIcon className="w-4 h-4 text-blue-500 shrink-0" />
                            <span
                              className="truncate flex-1"
                              title={att.name}
                            >
                              {att.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAttachments((prev) =>
                                  prev.filter(
                                    (a) =>
                                      (a.url || a.fileId || a.name) !==
                                      (att.url || att.fileId || att.name),
                                  ),
                                )
                              }
                              className="shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    attachments.length > 0 && (
                      <div className="mt-2 space-y-1 min-w-0">
                        {attachments.map((att, idx) => (
                          <div
                            key={att.url || att.fileId || att.name || idx}
                            className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border rounded px-2 py-1.5 min-w-0 group"
                          >
                            <FileIcon className="w-4 h-4 text-blue-500 shrink-0" />
                            <span
                              className="truncate flex-1"
                              title={att.name}
                            >
                              {att.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.url)}
                              disabled={isSavingAttachments}
                              className="shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold text-gray-900">
                  {topic.code}
                </div>
                <div className="text-lg font-medium text-gray-900 leading-tight">
                  {topic.title}
                </div>
                {topic.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {topic.description}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between"
                    onClick={() => setCoordinationOpen((v) => !v)}
                  >
                    <div className="text-sm font-semibold text-gray-800">
                      Coordination
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        coordinationOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  {coordinationOpen && (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Author
                      </div>
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-100 text-sm text-gray-800 w-fit">
                        {topic.authorName}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill
                          label={topic.priority}
                          tone={topic.priority === "Low" ? "green" : "gray"}
                        />
                        <Pill
                          label={topic.status}
                          tone={
                            topic.status === "New"
                              ? "green"
                              : topic.status === "In Progress"
                                ? "yellow"
                                : "gray"
                          }
                        />
                        {topic.tags.includes("Issue") && (
                          <Pill label="Issue" tone="red" />
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Created {formatTopicDateTime(topic.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Modified {formatTopicDateTime(topic.modifiedAt)} by{" "}
                        {topic.authorName}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="mt-4 border-b border-gray-200 flex">
                    {(
                      [
                        {
                          id: "comments",
                          title: "Comments",
                          Icon: MessageSquare,
                          count: totalComments,
                        },
                        {
                          id: "views",
                          title: "Views",
                          Icon: Camera,
                          count: topic.stats.viewpoints,
                        },
                        {
                          id: "references",
                          title: "References",
                          Icon: FileText,
                          count: attachments.length,
                        },
                      ] as const
                    ).map(({ id, title, Icon, count }) => {
                      const isActive = activeTab === id;
                      const color = isActive
                        ? "text-[#0B4F8A]"
                        : "text-gray-500";
                      return (
                        <button
                          key={id}
                          type="button"
                          title={title}
                          onClick={() => setActiveTab(id)}
                          className={`flex-1 h-11 flex items-center justify-center gap-2 border-b-2 -mb-px transition-colors ${
                            isActive
                              ? "border-[#0B4F8A] bg-white"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className={`text-sm font-medium ${color}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === "comments" && (
                    <CommentList
                      comments={comments}
                      totalComments={totalComments}
                      isLoading={isCommentsLoading}
                      hasNextPage={Boolean(hasNextPage)}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                      currentUserId={currentUserId}
                      onUpdate={updateComment}
                      onDelete={deleteComment}
                    />
                  )}

                  {activeTab === "views" && (
                    <div className="mt-4 text-sm text-gray-500">
                      No views available
                    </div>
                  )}

                  {activeTab === "references" && (
                    <div className="mt-4 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-gray-500" />
                          References
                          <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full">
                            {attachments.length}
                          </span>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-50"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-1">
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleDownloadAll()}
                              disabled={attachments.length === 0}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download all
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-red-600"
                              onClick={() => handleRemoveAll()}
                              disabled={
                                attachments.length === 0 || isSavingAttachments
                              }
                            >
                              Remove all
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {attachments.length === 0 ? (
                        <div className="text-sm text-gray-500 italic">
                          No references available
                        </div>
                      ) : (
                        <div className="space-y-2 min-w-0 ">
                          {attachments.map((att, idx) => (
                            <div
                              key={att.fileId ?? att.url ?? idx}
                              className="flex items-center gap-3 p-3 rounded-md border bg-white hover:bg-slate-50 transition-colors min-w-0 overflow-hidden"
                            >
                              <div className="w-10 h-10 rounded bg-white border flex items-center justify-center shrink-0">
                                <FileIcon className="w-5 h-5 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0 max-w-[150px] overflow-hidden">
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-slate-700 hover:underline block truncate"
                                  title={att.name}
                                >
                                  {att.name}
                                </a>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50"
                                disabled={isSavingAttachments}
                                onClick={() => handleRemoveAttachment(att.url)}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {mode === "view" && activeTab === "comments" && (
          <CommentInput
            value={commentInput}
            onChange={setCommentInput}
            onSend={addComment}
            isSending={isAddingComment}
          />
        )}

        {mode === "view" && activeTab === "references" && (
          <div className="border-t p-4 bg-white flex justify-center">
            <Button
              size="icon"
              variant="default"
              disabled={isSavingAttachments}
              onClick={() => setIsAttachDialogOpen(true)}
              className="h-14 w-14 rounded-full bg-[#005F9E] hover:bg-[#004B7D] text-white shadow"
              title="Add reference"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}

        {isAttachDialogOpen && (
          <TopicReferencesDialog
            open={isAttachDialogOpen}
            onOpenChange={setIsAttachDialogOpen}
            projectId={projectId}
            userId={user?._id || ""}
            onAdd={
              variant === "create"
                ? (files) => {
                    setPendingAttachments((prev) => {
                      const seen = new Set(
                        prev.map((a) => a.url || a.fileId || a.name),
                      );
                      const added = files.filter((a) => {
                        const key = a.url || a.fileId || a.name;
                        if (!key || seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });
                      return [...prev, ...added];
                    });
                    setIsAttachDialogOpen(false);
                  }
                : handleAddAttachments
            }
          />
        )}

        {mode === "edit" && (
          <div className="border-t p-3 bg-white">
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
                disabled={saving || !draft.title.trim()}
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
  });

TopicPropertiesPanel.displayName = "TopicPropertiesPanel";
