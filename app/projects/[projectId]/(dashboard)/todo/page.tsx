"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns";

import { useApi } from "@/app/hooks/useApi";
import { useAuth } from "@/app/context/authContext";
import AddTodoDialog from "@/components/features/todo/dialog/addTodoDialog";
import type { TopicLinkOption } from "@/components/features/todo/dialog/addTodoDialog";
import { topicsService } from "@/services/topics.service";
import DropDownCheckBox from "@/components/features/todo/dropdown/dropdownCheckBox";
import { DateFilter } from "@/components/features/activity/DateFilter";
import { MultiCheckboxFilterPopover } from "@/components/features/topics/filters/TopicsFilters";
import { columnsTable } from "@/components/features/todo/table/column";
import { DataTable } from "@/components/features/todo/table/DataTable";
import { NewTodoDrawer } from "@/components/todos/NewTodoDrawer";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ITodo } from "@/types/todo3d";
import { TodoItem } from "@/types/explorer";

/** Gộp todo 3D (BCF) và todo 2D (PDF) trên cùng bảng */
export type DashboardTodoRow = ITodo & {
  __source?: "todo3d" | "todo2d";
  __todo2d?: TodoItem;
  /** Dùng cho bộ lọc Date modified khi BE không trả modifiedOn */
  modifiedOn?: string;
};

// function normalizeTodo2dRow(
//   t: TodoItem,
//   members: { userId?: string; _id?: string; fullName?: string; name?: string }[],
// ): DashboardTodoRow {
//   const rawIds: string[] = Array.isArray(t.assignees)
//     ? (t.assignees as string[]).filter(Boolean)
//     : t.assignee
//       ? [typeof t.assignee === "string" ? t.assignee : (t.assignee as { _id?: string })?._id].filter(
//           Boolean,
//         ) as string[]
//       : [];

//   const assignees: IAssigneeTodo[] = rawIds.map((id) => {
//     const m = members.find(
//       (u) => String(u.userId || u._id || "") === String(id),
//     );
//     return {
//       assigneeId: id,
//       name: m?.fullName || m?.name || id,
//       type: "user",
//     };
//   });

//   const fileIdRaw = t.fileId;
//   const fileIdStr =
//     fileIdRaw && typeof fileIdRaw === "object"
//       ? String((fileIdRaw as { _id?: string })._id || "")
//       : typeof fileIdRaw === "string"
//         ? fileIdRaw
//         : "";

//   const userIdRaw = t.userId;
//   const userIdStr = userIdRaw ? String(userIdRaw) : "";
//   const createdByName =
//     typeof t.createdBy === "string" ? t.createdBy : "";

//   const priName = t.priority || "Normal";
//   const priority: IPriority = {
//     priorityId: "",
//     name: priName,
//     color: TODO2D_PRIORITY_COLORS[priName] || "#94a3b8",
//   };

//   const updated = t.updatedAt || "";
//   const created = t.createdAt || "";

//   return {
//     _id: t._id,
//     title: t.title || "",
//     description: t.description,
//     status: mapTodo2dStatusToSlug(t.status),
//     priority,
//     completion: t.completion ?? 0,
//     assignees,
//     type: null,
//     tags: null,
//     dueDate: t.dueDate,
//     projectId: t.projectId || "",
//     topicId: null,
//     topicItemId: null,
//     createdBy: {
//       _id: userIdStr,
//       fullName: createdByName || undefined,
//     },
//     createdAt: created,
//     updatedAt: updated,
//     modifiedOn: updated || created,
//     __source: "todo2d",
//     __todo2d: { ...t, fileId: fileIdStr || t.fileId },
//   };
// }

const optionsOwner = [
  { name: "Assigned to me", checked: false },
  { name: "Created by me", checked: false },

  { name: "Unassigned", checked: false },
];

const status = [
  { name: "New", checked: false, value: "new" },
  { name: "In progress", checked: false, value: "in_progress" },
  {
    name: "Waiting",
    checked: false,
    value: "waiting",
  },
  { name: "Done", checked: false, value: "done" },
  {
    name: "Closed",
    checked: false,
    value: "closed",
  },
];

const STATUS_SLUG_FALLBACK_COLORS: Record<string, string> = {
  new: "#2563eb",
  in_progress: "#ea580c",
  waiting: "#16a34a",
  done: "#0ea5e9",
  closed: "#64748b",
};

/** Map status Todo2D → slug filter (cùng logic với topic dashboard) */
function map2dStatusToFilterSlug(s: string): string {
  const m: Record<string, string> = {
    Open: "new",
    "In Progress": "in_progress",
    Done: "done",
    Closed: "closed",
  };
  return m[s] || s.toLowerCase().replace(/\s+/g, "_");
}

/** Gộp Todo2D vào bảng: chỉ hiển thị title (không prefix TO-xxxx), chuẩn hóa assignee/priority cho filter */
function normalizeTodo2dRow(t: any, memberData: any[]) {
  const ids = Array.isArray(t.assignees)
    ? t.assignees
    : t.assignee
      ? [t.assignee]
      : [];
  const assignees = ids.map((id: string) => {
    const m = memberData.find(
      (u: any) => String(u._id) === String(id) || u.userId === id,
    );
    return {
      assigneeId: id,
      name: m?.name || m?.fullName || id,
      type: "user" as const,
      label: m?.subLabel,
    };
  });
  const st =
    typeof t.status === "string" ? t.status : t.status?.name || "";
  const statusSlug = map2dStatusToFilterSlug(st);
  return {
    ...t,
    _todoSource: "2d" as const,
    title: t.title || "",
    assignees,
    priority:
      typeof t.priority === "string"
        ? { priorityId: t.priority, name: t.priority, color: "#94a3b8" }
        : t.priority,
    type:
      typeof t.type === "string"
        ? { typeId: t.type, name: t.type }
        : t.type,
    status: { value: statusSlug, name: st },
    tags: Array.isArray(t.tags)
      ? t.tags.map((tag: string) => ({ tagId: tag, name: tag }))
      : [],
  };
}

export default function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromTopicQueryHandled = useRef(false);
  const openTodoQueryHandled = useRef(false);
  const [dateModifiedRange, setDateModifiedRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [dateFilterResetKey, setDateFilterResetKey] = useState(0);
  const [groupData, setGroupData] = useState([]);
  const [memberData, setMemberData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [tagData, setTagData] = useState([]);

  const [todoList, setTodoList] = useState<DashboardTodoRow[]>([]);
  const [todo2dList, setTodo2dList] = useState<any[]>([]);

  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [linkedTopicForNewTodo, setLinkedTopicForNewTodo] =
    useState<TopicLinkOption | null>(null);
  const [topicLinkOptions, setTopicLinkOptions] = useState<TopicLinkOption[]>(
    [],
  );
  const [rowSelection, setRowSelection] = useState<DashboardTodoRow | null>(
    null,
  );
  // Filter states
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Array<{ name: string; value?: string }>
  >([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const [permissions, setPermissions] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");

  const { get, post, put, delete: deleteApi } = useApi();
  const { user } = useAuth();

  //#region CALL API
  const getAllUser = async () => {
    try {
      const projectId = (await params).projectId;

      const response = await get(`/team/getMemberProject/${projectId}`);
      if (response.success) {
        const updatedUsers = (response.result || []).map((user: any) => {
          return {
            ...user,
            subLabel: user.email,
            name: user.fullName,
            type: "user",
          };
        });

        setMemberData(updatedUsers);

        const currentUserMember = response.result.find((m: any) => m.userId === user?._id);
        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        }
      } else {
        console.error("Failed to fetch group:", response.error);
      }
    } catch (err) {
      console.error("Error fetching group:", err);
    }
  };

  const getPermissions = async () => {
    try {
      const pid = (await params).projectId;
      const response = await get(`/permissions/get/${pid}`);
      if (response.success) {
        setPermissions(response.result);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getAllTopics = async () => {
    try {
      const projectId = (await params).projectId;
      setProjectId(projectId);
      const response = await get(`/topics/getAll/${projectId}`);
      if (response.success) {
        const priority = response.result.topicPriorities || [];
        const type = response.result.topicTypes || [];
        const status = response.result.topicStatuses || [];

        setPriorityData(priority);
        setTypeData(type);
        setStatusData(status);
      } else {
        console.error("Failed to fetch topics:", response.error);
      }
    } catch (err) {
      console.error("Error fetching topics:", err);
    }
  };

  const getAllGroup = async () => {
    try {
      const projectId = (await params).projectId;

      const response = await get(`/team/getGroup/${projectId}`);
      if (response.success) {
        const updateData = (response.result || []).map((group: any) => {
          return {
            ...group,
            subLabel: group.memberCount,
            type: "group",
          };
        });
        setGroupData(updateData);
      } else {
        console.error("Failed to fetch team users:", response.error);
      }
    } catch (err) {
      console.error("Error fetching team users:", err);
    }
  };

  const getAllTags = async () => {
    try {
      const projectId = (await params).projectId;

      const response = await get(`/tags?projectId=${projectId}`);
      if (response) {
        setTagData(response);
      } else {
        console.error("Failed to fetch tag :", response.error);
      }
    } catch (err) {
      console.error("Error fetching tag :", err);
    }
  };

  const getAllTodo = async () => {
    try {
      const projectId = (await params).projectId;

      /** Chỉ todo 3D — todo 2D nằm ở `getAllTodo2d` + `mergedTodoRows` để tránh trùng dòng */
      const response = await get(`/todo`, { params: { projectId } });
      if (Array.isArray(response)) {
        const rows = response.map((r: ITodo) => ({
          ...r,
          __source: "todo3d" as const,
          modifiedOn:
            (r as DashboardTodoRow).modifiedOn ?? r.updatedAt ?? r.createdAt,
        }));
        setTodoList(rows as DashboardTodoRow[]);
      } else {
        setTodoList([]);
        console.error("Failed to fetch todos:", response);
      }
    } catch (err) {
      console.error("Error fetching todos :", err);
    }
  };

  const getAllTodo2d = async () => {
    try {
      const projectId = (await params).projectId;
      const response = await get(`/todos2d/project/${projectId}`);
      if (Array.isArray(response)) {
        setTodo2dList(response);
      } else {
        setTodo2dList([]);
      }
    } catch (err) {
      console.error("Error fetching todo2d:", err);
      setTodo2dList([]);
    }
  };

  const onLoadApi = () => {
    getAllUser();
    getAllGroup();
    getAllTodo();
    getAllTodo2d();
  };

  useEffect(() => {
    getAllUser();
    getAllGroup();
    getAllTopics();
    getAllTags();
    getAllTodo();
    getAllTodo2d();
    getPermissions();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const pid = (await params).projectId;
        const items = await topicsService.getTopicItems(pid);
        if (!alive) return;
        setTopicLinkOptions(
          items.map((t) => ({
            id: t.id,
            code: t.code,
            title: t.title,
          })),
        );
      } catch (e) {
        console.error("Failed to load topics for todo link:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params]);

  useEffect(() => {
    if (fromTopicQueryHandled.current) return;
    if (searchParams.get("openAddTodo") !== "1") return;
    fromTopicQueryHandled.current = true;
    const tid = searchParams.get("topicItemId");
    if (tid) {
      setLinkedTopicForNewTodo({
        id: tid,
        code: searchParams.get("topicCode") || "",
        title: searchParams.get("topicTitle") || "",
      });
    } else {
      setLinkedTopicForNewTodo(null);
    }
    setOpenDialog(true);
    const pid =
      typeof routeParams?.projectId === "string" ? routeParams.projectId : "";
    if (pid) {
      router.replace(`/projects/${pid}/todo`, { scroll: false });
    }
  }, [searchParams, router, routeParams?.projectId]);

  useEffect(() => {
    if (openTodoQueryHandled.current) return;
    const todoId = searchParams.get("openTodoId");
    if (!todoId) return;
    openTodoQueryHandled.current = true;

    (async () => {
      try {
        let opened = false;
        try {
          const todo = await get(`/todo/${todoId}`);
          if (todo) {
            setRowSelection({ ...todo, _todoSource: "3d" });
            setIsOpenDrawer(true);
            opened = true;
          }
        } catch {
          /* thử Todo2D */
        }
        if (!opened) {
          try {
            const t2 = await get(`/todos2d/${todoId}`);
            if (t2) {
              setRowSelection(normalizeTodo2dRow(t2, memberData));
              setIsOpenDrawer(true);
            }
          } catch (err) {
            console.error("Failed to open todo from query:", err);
          }
        }
      } catch (err) {
        console.error("Failed to open todo from query:", err);
      } finally {
        const pid =
          typeof routeParams?.projectId === "string" ? routeParams.projectId : "";
        if (pid) {
          router.replace(`/projects/${pid}/todo`, { scroll: false });
        }
      }
    })();
  }, [searchParams, get, router, routeParams?.projectId, memberData]);
  //#endregion

  //#region HANDLE FILTER
  const getCurrentUserId = () => {
    return user?._id || "";
  };

  const mergedTodoRows = useMemo(() => {
    const a = (todoList || []).map((t: any) => ({
      ...t,
      _todoSource: "3d" as const,
    }));
    const b = (todo2dList || []).map((t: any) =>
      normalizeTodo2dRow(t, memberData || []),
    );
    return [...a, ...b];
  }, [todoList, todo2dList, memberData]);

  const filterTodos = (source: any[]) => {
    let filtered = [...source];
    const currentUserId = getCurrentUserId();

    if (permissions?.isTodosRestricted && userRole !== "admin") {
      filtered = filtered.filter((todo: any) => {
        const createdById = typeof todo.createdBy === "string"
          ? todo.createdBy
          : (todo.createdBy?._id || todo.createdBy?.userId || "");
        const isCreator = String(createdById) === String(currentUserId);

        // Cho phép nếu được Assign
        const isAssignee = todo.assignees?.some(
          (assignee: any) => assignee.assigneeId === currentUserId
        );

        return isCreator || isAssignee;
      });
    }

    // Filter by Owner
    if (selectedOwners.length > 0) {
      const currentUserId = getCurrentUserId();
      filtered = filtered.filter((todo: DashboardTodoRow) => {
        // Check if todo matches any of the selected owner filters (OR logic)
        return selectedOwners.some((ownerFilter) => {
          switch (ownerFilter) {
            case "Assigned to me":
              return todo.assignees?.some(
                (assignee: any) => assignee.assigneeId === currentUserId,
              );
            case "Created by me":
              // createdBy can be a string id or a populated object; handle both
              const createdById = (() => {
                if (!todo.createdBy) return "";
                if (typeof todo.createdBy === "string") return todo.createdBy;
                const o = todo.createdBy as {
                  _id?: string;
                  userId?: string;
                  id?: string;
                };
                return o._id || o.userId || o.id || "";
              })();
              return String(createdById) === String(currentUserId);
            case "Unassigned":
              return !todo.assignees || todo.assignees.length === 0;

            default:
              return false;
          }
        });
      });
    }

    // Filter by Users
    if (selectedUsers.length > 0) {
      filtered = filtered.filter((todo: DashboardTodoRow) => {
        return todo.assignees?.some((assignee: any) => {
          // Filter by user type and name
          const assigneeName =
            assignee.name || assignee.fullName || assignee.label;
          const isUser = assignee.type === "user" || !assignee.type; // Default to user if type not specified
          return isUser && selectedUsers.includes(assigneeName);
        });
      });
    }

    // Filter by Groups
    if (selectedGroups.length > 0) {
      filtered = filtered.filter((todo: DashboardTodoRow) => {
        return todo.assignees?.some((assignee: any) => {
          // Filter by group type and name
          const assigneeName =
            assignee.name || assignee.fullName || assignee.label;
          const isGroup = assignee.type === "group";
          return isGroup && selectedGroups.includes(assigneeName);
        });
      });
    }

    // Filter by Status
    if (selectedStatuses.length > 0) {
      // Extract status values from selected status objects
      const selectedStatusValues = selectedStatuses
        .map(
          (statusObj) =>
            statusObj.value ||
            statusObj.name.toLowerCase().replace(/\s+/g, "_"),
        )
        .filter(Boolean);

      filtered = filtered.filter((todo: DashboardTodoRow) => {
        const s = todo.status as unknown;
        let todoStatusValue = "";
        if (s == null) todoStatusValue = (todo as { statusName?: string }).statusName || "";
        else if (typeof s === "string") todoStatusValue = s;
        else if (typeof s === "object" && s !== null && "value" in s)
          todoStatusValue = String((s as { value?: string }).value ?? "");
        return selectedStatusValues.includes(todoStatusValue);
      });
    }

    // Filter by Priority
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((todo: DashboardTodoRow) => {
        const todoPriority =
          todo.priority?.name ||
          (todo as { priorityName?: string }).priorityName ||
          "";
        return selectedPriorities.includes(todoPriority);
      });
    }

    if (dateModifiedRange.startDate && dateModifiedRange.endDate) {
      filtered = filtered.filter((todo: any) => {
        if (!todo.modifiedOn) return false;
        const modifiedDate = new Date(todo.modifiedOn);
        return (
          modifiedDate >= startOfDay(dateModifiedRange.startDate!) &&
          modifiedDate <= endOfDay(dateModifiedRange.endDate!)
        );
      });
    }

    return filtered;
  };
  //#endregion

  //#region HANDLE DATA TABLE

  const filteredData = useMemo(
    () => filterTodos(mergedTodoRows),
    [
      mergedTodoRows,
      selectedOwners,
      selectedUsers,
      selectedGroups,
      selectedStatuses,
      selectedPriorities,
      dateModifiedRange,
      user,
      permissions,
      userRole,
    ],
  );

  const handleRowSelectionChange = useCallback(
    (rowSelection: Record<string, any>) => {
      setIsOpenDrawer(false);

      if (rowSelection && rowSelection.original) {
        const original = rowSelection.original as DashboardTodoRow;
        setRowSelection(original);
        setIsOpenDrawer(true);
      } else {
        setRowSelection(null);
      }
    },
    [],
  );

  const onCloseDialog = () => {
    setOpenDialog(false);
    setLinkedTopicForNewTodo(null);
    fromTopicQueryHandled.current = false;
    onLoadApi();
  };

  const onCloseDrawer = () => {
    setIsOpenDrawer(false);
    setRowSelection(null);
    onLoadApi();
  };
  //#endregion

  //#region RESET FILTERS
  const hasActiveFilters = () => {
    return (
      selectedOwners.length > 0 ||
      selectedUsers.length > 0 ||
      selectedGroups.length > 0 ||
      selectedStatuses.length > 0 ||
      selectedPriorities.length > 0 ||
      (dateModifiedRange.startDate != null &&
        dateModifiedRange.endDate != null)
    );
  };

  const handleResetFilters = () => {
    setSelectedOwners([]);
    setSelectedUsers([]);
    setSelectedGroups([]);
    setSelectedStatuses([] as Array<{ name: string; value?: string }>);
    setSelectedPriorities([]);
    setDateModifiedRange({});
    setDateFilterResetKey((k) => k + 1);
  };
  //#endregion

  const handleExcel = (type: String) => { };

  const statusFilterOptions = useMemo(() => {
    type ApiStatus = { name?: string; color?: string; visible?: boolean };
    const apiRows = (statusData as ApiStatus[]).filter(
      (r) => Boolean(r?.name) && r.visible !== false,
    );

    const slugForStatusName = (name: string) => {
      const n = name.trim().toLowerCase();
      const found = status.find((s) => s.name.toLowerCase() === n);
      if (found?.value) return found.value as string;
      return name.trim().toLowerCase().replace(/\s+/g, "_");
    };

    if (apiRows.length > 0) {
      return apiRows.map((row) => {
        const slug = slugForStatusName(row.name!);
        return {
          value: slug,
          label: row.name!,
          color:
            row.color ||
            STATUS_SLUG_FALLBACK_COLORS[slug] ||
            "#94a3b8",
        };
      });
    }

    return status.map((s) => ({
      value: s.value as string,
      label: s.name,
      color: STATUS_SLUG_FALLBACK_COLORS[s.value as string] ?? "#94a3b8",
    }));
  }, [statusData]);

  const priorityFilterOptions = useMemo(() => {
    return (priorityData as { name?: string; color?: string }[])
      .map((p) => ({
        value: p.name ?? "",
        label: p.name ?? "",
        color: p.color,
      }))
      .filter((o) => o.value);
  }, [priorityData]);

  const selectedStatusValuesForUi = useMemo(
    () =>
      selectedStatuses
        .map(
          (statusObj) =>
            statusObj.value ||
            statusObj.name.toLowerCase().replace(/\s+/g, "_"),
        )
        .filter(Boolean) as string[],
    [selectedStatuses],
  );

  const handleStatusFilterChange = (nextValues: string[]) => {
    setSelectedStatuses(
      nextValues.map((v) => {
        const row = status.find((s) => s.value === v);
        const fromOptions = statusFilterOptions.find((o) => o.value === v);
        return {
          name: row?.name ?? fromOptions?.label ?? v,
          value: (row?.value ?? v) as string,
        };
      }),
    );
  };

  return (
    <div className="relative flex h-full min-h-0 w-full bg-[#F5F6F7]">
      <div
        className={`flex min-h-0 flex-1 w-full min-w-0 flex-col overflow-hidden transition-all duration-300 ${
          isOpenDrawer ? "mr-0 sm:mr-80" : "mr-0"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between rounded-t-md border-b border-gray-100 bg-white px-4 py-3">
            <h2 className="text-lg font-medium text-gray-800">Todo</h2>
            <Button
              onClick={() => {
                setLinkedTopicForNewTodo(null);
                setOpenDialog(true);
              }}
              className="flex items-center rounded bg-[#406D87] px-6 py-2 text-base font-medium text-white transition-colors hover:bg-[#345a70] focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            >
              New
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                <DropDownCheckBox
                  title="Owner"
                  options={optionsOwner}
                  isSearch={false}
                  value={selectedOwners}
                  onChange={setSelectedOwners as any}
                />
                <span className="text-gray-300">|</span>
                <DropDownCheckBox
                  title="Users"
                  options={memberData}
                  isSearch={true}
                  value={selectedUsers}
                  onChange={setSelectedUsers as any}
                />
                <span className="text-gray-300">|</span>
                <DropDownCheckBox
                  title="Group"
                  options={groupData}
                  isSearch={true}
                  value={selectedGroups}
                  onChange={setSelectedGroups as any}
                />
                <span className="text-gray-300">|</span>
                <MultiCheckboxFilterPopover
                  label="Status"
                  options={statusFilterOptions}
                  selectedValues={selectedStatusValuesForUi}
                  onChange={handleStatusFilterChange}
                />
                <span className="text-gray-300">|</span>
                <MultiCheckboxFilterPopover
                  label="Priority"
                  options={priorityFilterOptions}
                  selectedValues={selectedPriorities}
                  onChange={setSelectedPriorities}
                  renderOptionIcon={(opt) =>
                    opt.color ? (
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full border border-gray-200/80"
                        style={{ backgroundColor: opt.color }}
                      />
                    ) : null
                  }
                />
                <span className="text-gray-300">|</span>
                <DateFilter
                  key={dateFilterResetKey}
                  label="Date modified"
                  onFilterChange={(range) =>
                    setDateModifiedRange({
                      startDate: range.startDate,
                      endDate: range.endDate,
                    })
                  }
                />
              </div>

              {hasActiveFilters() && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-gray-500 hover:text-red-600"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>

            <DataTable
              columns={columnsTable}
              data={filteredData}
              isDrawer={isOpenDrawer}
              selectedTodoId={rowSelection?._id ?? null}
              onRowSelectionChange={handleRowSelectionChange}
            />
          </div>

          <AddTodoDialog
            key={openDialog ? "dialog-open" : "dialog-closed"}
            open={openDialog}
            priority={priorityData}
            type={typeData}
            tag={tagData}
            projectId={projectId}
            topicLinkOptions={topicLinkOptions}
            topicLinkLocked={false}
            linkedTopicItem={linkedTopicForNewTodo}
            onClose={onCloseDialog}
          />
        </div>
      </div>
      <NewTodoDrawer
        embedded
        open={isOpenDrawer}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDrawer();
          }
        }}
        projectId={projectId}
        todoToEdit={rowSelection}
        mode="view"
        onRestoreView={() => {
          if (!rowSelection) return;
          if ((rowSelection as { _todoSource?: string })._todoSource === "2d") {
            const t = rowSelection as {
              viewId?: string;
              fileId?: string | { _id?: string };
            };
            const vid = t.viewId;
            const fid =
              typeof t.fileId === "object" && t.fileId
                ? String(t.fileId._id)
                : t.fileId
                  ? String(t.fileId)
                  : "";
            if (!vid || !fid) {
              toast.error("This 2D todo has no view or file linked.");
              return;
            }
            router.push(
              `/projects/${projectId}/viewer/${vid}?fileId=${encodeURIComponent(fid)}`,
            );
            return;
          }
          const targetUrls = Array.from(
            new Set((rowSelection.items || []).map((i: any) => i.fileUrl).filter(Boolean)),
          );
          if (targetUrls.length === 0) {
            toast.error("No 3D models attached to this Todo");
            return;
          }
          const pendingKey = `bimcde_pending_todo_${projectId}`;
          sessionStorage.setItem(
            pendingKey,
            JSON.stringify({ todo: rowSelection, mode: "view", type: "todo" })
          );
          const newUrlsParams = JSON.stringify(targetUrls);
          router.push(
            `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`
          );
        }}
      />
    </div>
  );
}
