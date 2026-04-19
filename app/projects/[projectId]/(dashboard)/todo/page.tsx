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
import DropdownDatePicker from "@/components/features/todo/dropdown/dropdownDatePciker";
import { columnsTable } from "@/components/features/todo/table/column";
import { DataTable } from "@/components/features/todo/table/DataTable";
import { NewTodoDrawer } from "@/components/todos/NewTodoDrawer";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ITodo } from "@/types/todo3d";

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

const DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Past 7 days", value: "7days" },
  { label: "Past 30 days", value: "30days" },
];

export default function page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromTopicQueryHandled = useRef(false);
  const openTodoQueryHandled = useRef(false);
  const [date, setDate] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [groupData, setGroupData] = useState([]);
  const [memberData, setMemberData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [tagData, setTagData] = useState([]);

  const [todoList, setTodoList] = useState([]);

  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [linkedTopicForNewTodo, setLinkedTopicForNewTodo] =
    useState<TopicLinkOption | null>(null);
  const [topicLinkOptions, setTopicLinkOptions] = useState<TopicLinkOption[]>(
    [],
  );
  const [rowSelection, setRowSelection] = useState<ITodo | null>(null);
  // Filter states
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Array<{ name: string; value?: string }>
  >([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

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
      } else {
        console.error("Failed to fetch group:", response.error);
      }
    } catch (err) {
      console.error("Error fetching group:", err);
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

      const response = await get(`/todo`, { params: { projectId } }); // ✅ valid
      if (response) {
        setTodoList(response);
      } else {
        console.error("Failed to fetch tag :", response.error);
      }
    } catch (err) {
      console.error("Error fetching tag :", err);
    }
  };

  const onLoadApi = () => {
    getAllUser();
    getAllGroup();
    getAllTodo();
  };

  useEffect(() => {
    getAllUser();
    getAllGroup();
    getAllTopics();
    getAllTags();
    getAllTodo();
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
        const todo = await get(`/todo/${todoId}`);
        if (todo) {
          setRowSelection(todo);
          setIsOpenDrawer(true);
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
  }, [searchParams, get, router, routeParams?.projectId]);
  //#endregion

  //#region HANDLE FILTER
  const getCurrentUserId = () => {
    return user?._id || "";
  };

  const filterTodos = () => {
    let filtered = [...todoList];

    // Filter by Owner
    if (selectedOwners.length > 0) {
      const currentUserId = getCurrentUserId();
      console.log(currentUserId);
      filtered = filtered.filter((todo: any) => {
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
                // try common populated shapes
                return (
                  todo.createdBy._id || todo.createdBy.userId || todo.createdBy.id || ""
                );
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
      filtered = filtered.filter((todo: any) => {
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
      filtered = filtered.filter((todo: any) => {
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

      filtered = filtered.filter((todo: any) => {
        // Get status value from todo (could be direct value or from status object)
        const todoStatusValue =
          todo.status?.value || todo.status || todo.statusName || "";
        return selectedStatusValues.includes(todoStatusValue);
      });
    }

    // Filter by Priority
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((todo: any) => {
        const todoPriority = todo.priority?.name || todo.priorityName || "";
        return selectedPriorities.includes(todoPriority);
      });
    }

    // Filter by Date Modified (quick options)
    if (date) {
      const now = new Date();
      let startDate: Date;

      switch (date) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "yesterday":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
          );
          const endDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          filtered = filtered.filter((todo: any) => {
            if (!todo.modifiedOn) return false;
            const modifiedDate = new Date(todo.modifiedOn);
            return modifiedDate >= startDate && modifiedDate < endDate;
          });
          return filtered;
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter((todo: any) => {
        if (!todo.modifiedOn) return false;
        const modifiedDate = new Date(todo.modifiedOn);
        return modifiedDate >= startDate;
      });
    }

    // Filter by custom date range (from / to)
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((todo: any) => {
        if (!todo.modifiedOn) return false;
        const modifiedDate = new Date(todo.modifiedOn);

        if (dateRange.from && modifiedDate < startOfDay(dateRange.from)) {
          return false;
        }
        if (dateRange.to && modifiedDate > endOfDay(dateRange.to)) {
          return false;
        }
        return true;
      });
    }

    return filtered;
  };
  //#endregion

  //#region HANDLE DATA TABLE

  const assigneeData = [...memberData, ...groupData];

  const filteredData = useMemo(
    () => filterTodos(),
    [
      todoList,
      selectedOwners,
      selectedUsers,
      selectedGroups,
      selectedStatuses,
      selectedPriorities,
      date,
      dateRange,
      user,
    ],
  );

  const handleRowSelectionChange = useCallback(
    (rowSelection: Record<string, any>) => {
      setIsOpenDrawer(false);

      if (rowSelection && rowSelection.original) {
        setRowSelection(rowSelection.original);
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
      date !== "" ||
      dateRange.from !== null ||
      dateRange.to !== null
    );
  };

  const handleResetFilters = () => {
    setSelectedOwners([]);
    setSelectedUsers([]);
    setSelectedGroups([]);
    setSelectedStatuses([] as Array<{ name: string; value?: string }>);
    setSelectedPriorities([]);
    setDate("");
    setDateRange({ from: null, to: null });
  };
  //#endregion

  return (
    <div className="flex relative w-full h-full gap-3">
      <div className="   h-full w-full overflow-y-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-normal text-gray-800">Todo</h1>

          <Button
            onClick={() => {
              setLinkedTopicForNewTodo(null);
              setOpenDialog(true);
            }}
            className="bg-[#406D87] hover:bg-[#345a70] px-6 py-4 rounded text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            New
          </Button>
        </div>
        {/* BODY */}
        <div className="  border-t h-[calc(100%-40px)] w-full">
          {/* FILTER */}
          <div className="px-6 py-4 flex gap-2 overflow-x-auto whitespace-nowrap min-h-[56px]">
            <DropDownCheckBox
              title="Owner"
              options={optionsOwner}
              isSearch={false}
              value={selectedOwners}
              onChange={setSelectedOwners as any}></DropDownCheckBox>
            <DropDownCheckBox
              title="Users"
              options={memberData}
              isSearch={true}
              value={selectedUsers}
              onChange={setSelectedUsers as any}></DropDownCheckBox>
            <DropDownCheckBox
              title="Group"
              options={groupData}
              isSearch={true}
              value={selectedGroups}
              onChange={setSelectedGroups as any}></DropDownCheckBox>
            <DropDownCheckBox
              title="Status"
              options={status}
              isSearch={false}
              value={selectedStatuses}
              onChange={setSelectedStatuses as any}
              returnObject={true}></DropDownCheckBox>

            <DropDownCheckBox
              title="Priority"
              options={priorityData}
              isSearch={false}
              value={selectedPriorities}
              onChange={setSelectedPriorities as any}></DropDownCheckBox>
            <DropdownDatePicker
              title="Date modified"
              options={DATE_OPTIONS}
              value={date}
              onChange={setDate}
              from={dateRange.from}
              to={dateRange.to}
              onRangeChange={setDateRange}></DropdownDatePicker>

            {hasActiveFilters() && (
              <Button
                onClick={handleResetFilters}
                className="text-blue-800 bg-transparent shadow-none text-base hover:bg-blue-100">
                Reset
              </Button>
            )}
          </div>

          {/* TABLE */}
          <DataTable
            columns={columnsTable}
            data={filteredData}
            isDrawer={isOpenDrawer}
            selectedTodoId={rowSelection?._id ?? null}
            onRowSelectionChange={handleRowSelectionChange}></DataTable>
        </div>
        <AddTodoDialog
          key={openDialog ? "dialog-open" : "dialog-closed"}
          open={openDialog}
          users={assigneeData}
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
      <NewTodoDrawer
        open={isOpenDrawer}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDrawer();
          }
        }}
        projectId={projectId}
        todoToEdit={rowSelection}
        mode="view"
        onRestoreView={(viewState) => {
          if (!rowSelection) return;
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
