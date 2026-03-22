"use client";

import { useEffect, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";

import { useApi } from "@/app/hooks/useApi";
import { useAuth } from "@/app/context/authContext";
import CustomDropdown from "@/components/features/team/dropdown";
import AddTodoDialog from "@/components/features/todo/dialog/addTodoDialog";
import TodoDrawer from "@/components/features/todo/drawer/todoDrawer";
import DropDownCheckBox from "@/components/features/todo/dropdown/dropdownCheckBox";
import DropdownDatePicker from "@/components/features/todo/dropdown/dropdownDatePciker";
import { columnsTable } from "@/components/features/todo/table/column";
import { DataTable } from "@/components/features/todo/table/DataTable";

import { Button } from "@/components/ui/button";

import { EllipsisVertical } from "lucide-react";

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
  const [rowSelection, setRowSelection] = useState({});

  // Filter states
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Array<{ name: string; value?: string }>>([]);
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

      const response = await get(`/todo/getAll/${projectId}`);
      if (response) {
        setTodoList(response.result);
      } else {
        console.error("Failed to fetch tag :", response.error);
      }
    } catch (err) {
      console.error("Error fetching tag :", err);
    }
  };

  useEffect(() => {
    getAllUser();
    getAllGroup();
    getAllTopics();
    getAllTags();
    getAllTodo();
  }, []);
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
              return todo.createdBy?.userId === currentUserId;
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
        .map((statusObj) => statusObj.value || statusObj.name.toLowerCase().replace(/\s+/g, "_"))
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

  const filteredData = filterTodos();

  const handleRowSelectionChange = (rowSelection: Record<string, any>) => {
    setIsOpenDrawer(false);

    if (rowSelection && rowSelection.original) {
      setRowSelection(rowSelection.original);
      setIsOpenDrawer(true);
    }
  };

  const onCloseDrawer = () => {
    setIsOpenDrawer(false);
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

  const handleExcel = (type: String) => {};
  return (
    <div className="flex relative w-full h-full gap-3">
      <div className="pt-6 space-y-6 bg-muted h-full w-full overflow-y-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold ">Todo</h1>
          <div className="flex items-center gap-8">
            <CustomDropdown
              icon={<EllipsisVertical></EllipsisVertical>}
              type="item"
              label="Export"
              items={[
                {
                  label: "Export to Excel",
                  onClick: () => handleExcel("export"),
                },
                {
                  label: "Import from Excel",
                  onClick: () => handleExcel("import"),
                },
              ]}
            />{" "}
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-[#005a92] hover:bg-[#004a79] h-10 px-6 text-white">
              New
            </Button>
          </div>
        </div>
        {/* BODY */}
        <div className="  border-t h-[calc(100%-40px)] w-full">
          {/* FILTER */}
          <div className="px-6 py-4 flex flex-wrap gap-2">
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
            onRowSelectionChange={handleRowSelectionChange}></DataTable>
        </div>
        <AddTodoDialog
          open={openDialog}
          users={assigneeData}
          priority={priorityData}
          type={typeData}
          tag={tagData}
          projectId={projectId}
          onClose={() => setOpenDialog(false)}
        />
      </div>
      <TodoDrawer
        isOpen={isOpenDrawer}
        onClose={onCloseDrawer}
        users={assigneeData}
        priority={priorityData}
        type={typeData}
        tag={tagData}
        data={rowSelection}></TodoDrawer>
    </div>
  );
}
