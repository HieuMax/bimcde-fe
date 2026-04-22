"use client";

import { type FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useApi } from "@/app/hooks/useApi";
import { useAuth } from "@/app/context/authContext";
import {
  RecipientSelector,
  type RecipientOption,
} from "@/components/features/release/RecipientSelector";

export type TopicLinkOption = {
  id: string;
  code: string;
  title: string;
};

interface AddTodoDialogProps {
  open: boolean;
  priority: any[];
  type: any[];
  tag: any[];
  projectId: string;
  onClose: () => void;
  /** Topics shown in "Link to a Topic" when the user may choose (e.g. /todo page). */
  topicLinkOptions?: TopicLinkOption[];
  /**
   * Pre-selected or forced topic. When `topicLinkLocked` is true, this is the only link used.
   */
  linkedTopicItem?: TopicLinkOption | null;
  /** If true, the topic link cannot be changed (e.g. opened from a topic's panel). */
  topicLinkLocked?: boolean;
}

const NONE_TOPIC_VALUE = "__none__";

export default function AddTodoDialog({
  open,
  onClose,
  priority,
  type,
  tag,
  projectId,
  topicLinkOptions = [],
  linkedTopicItem = null,
  topicLinkLocked = false,
}: AddTodoDialogProps) {
  const [title, setTitle] = useState("");
  const [showError, setShowError] = useState(false);
  const [moreDetails, setMoreDetails] = useState(false);
  const [assigneeSelections, setAssigneeSelections] = useState<RecipientOption[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [prioritySelected, setPrioritySelected] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);
  const [selectedTopicLink, setSelectedTopicLink] = useState<TopicLinkOption | null>(
    null,
  );
  const { post } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form field when `open` becomes true
    setSelectedTopicLink(linkedTopicItem ?? null);
  }, [open, linkedTopicItem?.id, linkedTopicItem?.code, linkedTopicItem?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setTitle("");
      setShowError(false);
      setMoreDetails(false);
      setAssigneeSelections([]);
      setSelectedTags([]);
      setDescription("");
      setPrioritySelected("");
      setDueDate(undefined);
      setTypeId(null);
      setCreateAnother(false);
    });
  }, [open]);

  const handleSave = async () => {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    const selectedTagObjects = tag.filter((t) => selectedTags.includes(t._id));

    const selectedPriority = priority.find((p) => p._id === prioritySelected);
    const selectedType = type.find((p) => typeId === p._id);

    const assignessUpdate = assigneeSelections.map((a) => ({
      assigneeId: a.id,
      name: a.label,
      type: a.type === "GROUP" ? "group" : "user",
      label: a.email ?? a.label,
    }));

    const tagUpdate = selectedTagObjects?.map((t) => ({
      tagId: t._id,
      name: t.name,
    }));

    const priorityUpdate = selectedPriority
      ? {
          priorityId: selectedPriority._id,
          name: selectedPriority.name,
          color: selectedPriority.color,
        }
      : null;

    const typeUpdate = selectedType
      ? {
          typeId: selectedType._id,
          name: selectedType.name,
        }
      : null;

    const userCreateBy = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };

    const data: Record<string, unknown> = {
      projectId: projectId,
      title,
      description,
      assignees: assignessUpdate,
      tags: tagUpdate,
      priority: priorityUpdate,
      type: typeUpdate,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : "",
      createdBy: userCreateBy,
      modifiedBy: userCreateBy,
    };

    const topicForLink = topicLinkLocked ? linkedTopicItem : selectedTopicLink;
    if (topicForLink?.id) {
      data.topicItemId = topicForLink.id;
    }

    try {
      const response = await post(`/todo`, {
        ...data,
      });

      if (!response) {
        alert("Failed to create todo.");
        return;
      }
    } catch (error) {
      console.error("Error adding people to group:", error);
      alert("An error occurred while creating todo.");
      return;
    }

    if (!createAnother) {
      onClose();
    } else {
      setTitle("");
      setDescription("");
      setAssigneeSelections([]);
      setSelectedTags([]);
      setPrioritySelected("");
      setTypeId(null);
      setDueDate(undefined);
      if (!topicLinkLocked) {
        setSelectedTopicLink(linkedTopicItem ?? null);
      }
    }
  };

  const fieldInputClass =
    "h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]";
  const fieldSelectTriggerClass =
    "h-9 w-full border-gray-300 font-normal focus-visible:ring-1 focus-visible:ring-[#005F9E]";
  const multiSelectTriggerClass =
    "h-auto min-h-9 w-full border-gray-300 font-normal focus-visible:ring-1 focus-visible:ring-[#005F9E]";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-md bg-white p-0 sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b-0 p-5 pb-2">
          <DialogTitle className="text-xl font-medium text-gray-800">
            Create ToDo
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pt-2 pb-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-gray-600">
              Link to a Topic
            </Label>
            {topicLinkLocked && linkedTopicItem?.id ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-800">
                <span className="font-medium">{linkedTopicItem.code}</span>
                {linkedTopicItem.title ? (
                  <span className="text-slate-700">
                    {" "}
                    — {linkedTopicItem.title}
                  </span>
                ) : null}
              </div>
            ) : topicLinkLocked ? (
              <p className="text-sm text-gray-500">No topic linked.</p>
            ) : (
              <Select
                value={selectedTopicLink?.id ?? NONE_TOPIC_VALUE}
                onValueChange={(v) => {
                  if (v === NONE_TOPIC_VALUE) {
                    setSelectedTopicLink(null);
                    return;
                  }
                  const opt = topicLinkOptions.find((t) => t.id === v);
                  setSelectedTopicLink(opt ?? { id: v, code: v, title: "" });
                }}
              >
                <SelectTrigger className="h-9 w-full border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-44">
                    <SelectItem
                      value={NONE_TOPIC_VALUE}
                      className="cursor-pointer"
                    >
                      None
                    </SelectItem>
                    {topicLinkOptions.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        className="h-auto min-h-11 cursor-pointer py-2"
                      >
                        <span className="font-medium">{t.code}</span>
                        {t.title ? (
                          <span className="text-slate-600"> — {t.title}</span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="todo-title"
              className="text-sm font-normal text-gray-600"
            >
              Title (required)
            </Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setShowError(false);
              }}
              className={cn(
                "h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
                showError && "border-red-500 focus-visible:ring-red-500",
              )}
              placeholder="Enter title"
            />
            {showError && (
              <p className="mt-1 text-xs text-red-600">This field is required.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="todo-desc"
              className="text-sm font-normal text-gray-600"
            >
              Description
            </Label>
            <Textarea
              id="todo-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]"
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-gray-600">Assignee</Label>
            <RecipientSelector
              projectId={projectId}
              initialOptions={[]}
              onChange={(_ids, opts) => setAssigneeSelections(opts ?? [])}
              addButtonPlaceholder="Add user or group..."
            />
          </div>

          {moreDetails && (
            <div className="space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal text-gray-600">
                    Priority
                  </Label>
                  <Select
                    value={prioritySelected || undefined}
                    onValueChange={setPrioritySelected}
                  >
                    <SelectTrigger className="h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]">
                      <SelectValue placeholder="Please select" />
                    </SelectTrigger>
                    <SelectContent>
                      {priority.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item._id}
                          className="h-12 cursor-pointer"
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-normal text-gray-600">
                    Due date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start border-gray-300 text-left font-normal focus-visible:ring-1 focus-visible:ring-[#005F9E]",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "MM/dd/yyyy") : (
                          <span>mm/dd/yyyy</span>
                        )}
                      
                        {dueDate ? (
                          format(dueDate, "MM/dd/yyyy")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-normal text-gray-600">Type</Label>
                <Select
                  value={typeId ?? undefined}
                  onValueChange={setTypeId}
                >
                  <SelectTrigger className="h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-44">
                      {type.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item._id}
                          className="h-12 cursor-pointer"
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-normal text-gray-600">Tags</Label>
                <MultiSelect
                  values={selectedTags}
                  onValuesChange={setSelectedTags}
                >
                  <MultiSelectTrigger className="h-auto min-h-11 w-full border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]">
                    <MultiSelectValue
                      className="flex flex-col justify-items-start"
                      placeholder="Tags"
                    />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    <ScrollArea className="h-32">
                      {tag.length > 0 ? (
                        <MultiSelectGroup>
                          {tag.map((t: any) => (
                            <MultiSelectItem
                              className="flex h-8 cursor-pointer items-center"
                              key={t._id}
                              value={t._id}
                            >
                              <span>{t.name}</span>
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      ) : (
                        <p className="px-2 py-2 text-sm text-muted-foreground">
                          No tag available in this project
                        </p>
                      )}
                    </ScrollArea>
                  </MultiSelectContent>
                </MultiSelect>
              </div>
            </div>
          )}

          {!moreDetails ? (
            <span
              role="button"
              tabIndex={0}
              onClick={() => setMoreDetails(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setMoreDetails(true);
              }}
              className="inline-block cursor-pointer text-sm font-medium text-gray-500 hover:text-[#005F9E] hover:underline"
            >
              Add more details
            </span>
          ) : (
            <span
              role="button"
              tabIndex={0}
              onClick={() => setMoreDetails(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setMoreDetails(false);
              }}
              className="inline-block cursor-pointer text-sm font-medium text-gray-500 hover:text-[#005F9E] hover:underline"
            >
              Show less
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="createAnother"
              checked={createAnother}
              onCheckedChange={(value) => setCreateAnother(Boolean(value))}
            />
            <Label htmlFor="createAnother" className="text-sm font-normal">
              Create another
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="min-w-[80px] rounded-sm bg-[#005F9E] font-medium text-white hover:bg-[#004B7D]"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
