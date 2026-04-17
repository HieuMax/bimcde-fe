"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { client } from "@/app/utils/apiClient";
import AddTodoDialog from "@/components/features/todo/dialog/addTodoDialog";
import { toast } from "sonner";

function todoMatchesTopic(todo: Record<string, unknown>, topicId: string) {
  const raw =
    todo.topicItemId ?? todo.topicId ?? (todo as { topicItem?: { _id?: string } }).topicItem;
  if (raw == null) return false;
  if (typeof raw === "string") return raw === topicId;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    return String((raw as { _id?: string })._id) === topicId;
  }
  return String(raw) === topicId;
}

function formatTodoStatus(raw: unknown): string {
  if (typeof raw === "string") return raw.replace(/_/g, " ");
  if (raw && typeof raw === "object") {
    const obj = raw as { name?: string; value?: string };
    const s = obj.name ?? obj.value;
    if (s) return String(s).replace(/_/g, " ");
  }
  return "Unknown";
}

function formatTodoCreator(raw: unknown): string {
  if (!raw) return "Unknown";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const obj = raw as { fullName?: string; name?: string; email?: string; userId?: string };
    return (
      obj.fullName ??
      obj.name ??
      obj.email ??
      obj.userId ??
      "Unknown"
    );
  }
  return "Unknown";
}

function formatTodoAssignees(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "Unassigned";
  const names = raw
    .map((a) => {
      if (!a || typeof a !== "object") return "";
      const obj = a as { name?: string; label?: string; assigneeId?: string };
      return obj.name ?? obj.label ?? obj.assigneeId ?? "";
    })
    .filter((x) => x.trim().length > 0);
  return names.length > 0 ? names.join(", ") : "Unassigned";
}

/** Minimal topic identity (matches dashboard Topic or 3D TopicItem). */
export interface TopicTodoViewProps {
  topic: { id: string; code: string; title: string };
  projectId: string;
  /** When true (e.g. IFC viewer), hides “Add Todo” and the create dialog. */
  hideAddTodo?: boolean;
}

export const TopicTodoView: React.FC<TopicTodoViewProps> = ({
  topic,
  projectId,
  hideAddTodo = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Record<string, unknown>[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [memberData, setMemberData] = useState<Record<string, unknown>[]>([]);
  const [groupData, setGroupData] = useState<Record<string, unknown>[]>([]);
  const [priorityData, setPriorityData] = useState<Record<string, unknown>[]>(
    [],
  );
  const [typeData, setTypeData] = useState<Record<string, unknown>[]>([]);
  const [tagData, setTagData] = useState<Record<string, unknown>[]>([]);

  const loadTodos = useCallback(async () => {
    try {
      const res = await client.get(`/todo`, { params: { projectId } });
      const response = res?.data;
      if (Array.isArray(response)) {
        setTodos(response as Record<string, unknown>[]);
      } else {
        setTodos([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load todos");
      setTodos([]);
    }
  }, [projectId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadTodos(),
          (async () => {
            const res = await client.get(`/team/getMemberProject/${projectId}`);
            const u = res?.data;
            if (!alive || !u?.success) return;
            const updatedUsers = (u.result || []).map(
              (user: Record<string, unknown>) => ({
                ...user,
                subLabel: user.email,
                name: user.fullName,
                type: "user",
              }),
            );
            setMemberData(updatedUsers);
          })(),
          (async () => {
            const res = await client.get(`/team/getGroup/${projectId}`);
            const g = res?.data;
            if (!alive || !g?.success) return;
            const updateData = (g.result || []).map(
              (group: Record<string, unknown>) => ({
                ...group,
                subLabel: group.memberCount,
                type: "group",
              }),
            );
            setGroupData(updateData);
          })(),
          (async () => {
            const res = await client.get(`/topics/getAll/${projectId}`);
            const t = res?.data;
            if (!alive || !t?.success) return;
            setPriorityData(t.result?.topicPriorities || []);
            setTypeData(t.result?.topicTypes || []);
          })(),
          (async () => {
            const res = await client.get(`/tags?projectId=${projectId}`);
            const tags = res?.data;
            if (!alive) return;
            if (tags) setTagData(tags);
          })(),
        ]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, loadTodos]);

  const linkedForTopic = useMemo(
    () => ({
      id: topic.id,
      code: topic.code,
      title: topic.title,
    }),
    [topic.id, topic.code, topic.title],
  );

  const filtered = useMemo(
    () => todos.filter((t) => todoMatchesTopic(t, topic.id)),
    [todos, topic.id],
  );

  const assigneeData = useMemo(
    () => [...memberData, ...groupData],
    [memberData, groupData],
  );

  const handleCloseAdd = () => {
    setAddOpen(false);
    void loadTodos();
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <p className="text-xs text-gray-500">
          {filtered.length} linked{" "}
          {filtered.length === 1 ? "todo" : "todos"}
        </p>
        {!hideAddTodo && (
          <Button
            type="button"
            size="sm"
            className="bg-[#005F9E] hover:bg-[#004B7D] text-white shrink-0"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Todo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No todos linked to this topic yet.
        </p>
      ) : (
        <ScrollArea className="flex-1 min-h-[200px] max-h-[50vh] pr-2">
          <ul className="space-y-2">
            {filtered.map((row) => {
              const id = String(row._id ?? row.id ?? "");
              const title = String(row.title ?? "Untitled");
              const description = String(row.description ?? "").trim();
              const status = formatTodoStatus(row.status);
              const createdBy = formatTodoCreator(row.createdBy);
              const assignees = formatTodoAssignees(row.assignees);
              return (
                <li
                  key={id || title}
                  className="rounded-md border border-gray-100 bg-slate-50/80 px-3 py-2 text-sm cursor-pointer hover:bg-slate-100/90 transition-colors"
                  onClick={() => {
                    if (!id) return;
                    router.push(`/projects/${projectId}/todo?openTodoId=${encodeURIComponent(id)}`);
                  }}
                >
                  <div className="font-medium text-gray-900 truncate">
                    {title}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                    <span className="text-gray-500">Description: </span>
                    <span className="font-medium">
                      {description.length > 0 ? description : "No description"}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className="font-medium capitalize">{status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created by: </span>
                      <span className="font-medium">{createdBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned to: </span>
                      <span className="font-medium">{assignees}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      {!hideAddTodo && (
        <AddTodoDialog
          open={addOpen}
          onClose={handleCloseAdd}
          users={assigneeData}
          priority={priorityData}
          type={typeData}
          tag={tagData}
          projectId={projectId}
          topicLinkLocked
          linkedTopicItem={linkedForTopic}
        />
      )}
    </div>
  );
};

TopicTodoView.displayName = "TopicTodoView";
