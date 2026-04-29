"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { Search, ChevronDown, EllipsisVertical, Loader2 } from "lucide-react";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/features/team/DataTable";
import { getTeamTableColumns } from "@/components/features/team/column";
import { useApi } from "@/app/hooks/useApi";
import { useAuth } from "@/app/context/authContext";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AddPeopleToGroup from "@/components/features/team/AddMemberToGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TeamDrawer from "@/components/features/team/Drawer";

export default function page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [roleFilter, setRoleFilter] = useState({
    user: false,
    admin: false,
  });

  const roleRadio = [
    {
      id: "user",
      label: "User",
    },
    {
      id: "admin",
      label: "Admin",
    },
  ];

  const [isSearch, setIsSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [isInvite, setIsInvite] = useState(false);

  const [dialogInput, setDialogInput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [titleDialog, setTtileDialog] = useState<string | null>(null);
  const [labelDialog, setLabelDialog] = useState<string | null>(null);
  const [memberPorject, setMemberProject] = useState<any[]>([]);
  const [memberGroup, setMemberGroup] = useState<any[]>([]);
  const [isDialogAddToGroup, setIsDialogAddToGroup] = useState(false);
  const [memberProjectCount, setMemberProjectCount] = useState(0);
  const [roleDialog, setRoleDialog] = useState({
    id: "user",
    label: "User",
  });

  const [memberData, setMemberData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [activeGroup, setActiveGroup] = useState({ _id: "all", name: "" });
  const [projectIdStorage, setProjectIdStorage] = useState<string | null>(null);
  const [listUser, setListUser] = useState([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isEditGroup, setIsEditGroup] = useState(false);
  const [isOpenConfirmDelete, setIsOpenConfirmDelete] = useState(false);
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  const [permissions, setPermissions] = useState<any>(null);

  const fetchPermissions = async () => {
    const projectId = (await params).projectId;
    try {
      const response = await get(`/permissions/get/${projectId}`);
      if (response.success) {
        setPermissions(response.result);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const { user } = useAuth();
  const { get, post, put, delete: deleteApi } = useApi();
  const [updatingGroupRoleUserId, setUpdatingGroupRoleUserId] = useState<
    string | null
  >(null);

  const getAllUser = async () => {
    try {
      const response = await get(`/accounts/getAllUser`);
      if (response.success) {
        setListUser(response.result || []);
      } else {
        console.error("Failed to fetch all users:", response.error);
      }
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  const fetchTeam = async () => {
    const projectId = (await params).projectId;
    setProjectIdStorage(projectId);
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const response = await get(`/team/getMemberProject/${projectId}`);
      console.log(response)
      if (response.success) {
        setMemberData(response.result || memberData);
        setMemberProjectCount(response.result.length || 0);
        setMemberProject(response.result || null);
      } else {
        console.error("Failed to fetch team:", response.error);
      }

      const groupResponse = await get(`/team/getGroup/${projectId}`);
      if (groupResponse.success) {
        setGroupData(groupResponse.result || []);
      } else {
        console.error("Failed to fetch groups:", groupResponse.error);
      }
    } catch (e: any) {
      setErrorMessage(e.response.data.error);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    await fetchTeam();
    await getAllUser();
    await fetchPermissions();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGroupSelection = async (group: any) => {
    setActiveGroup(group);
    const projectId = (await params).projectId;

    if (group._id === "all") {
      const response = await get(`/team/getMemberProject/${projectId}`);
      setMemberData(response.result || []);
      setMemberProjectCount(response.result.length || 0);
    } else {
      const response = await get(`/team/getMemberGroup/${group._id}`);
      setMemberData(response.result || []);
      setMemberGroup(response.result || null);
    }
  };

  const handleCheckedChange = (role: "user" | "admin", checked: boolean) => {
    setRoleFilter((prevState) => ({
      ...prevState,
      [role]: checked,
    }));
  };

  const onSearchBlur = () => {
    setIsSearch(false);
  };

  const handleExcel = (event: any) => {
    console.log(event);
  };

  const onModifiedGroup = (key: string) => {
    if (key === "edit") {
      setDialog(true);
      setTtileDialog("Rename Group");
      setLabelDialog("Group name");
      setIsEditGroup(true);
      setDialogInput(activeGroup.name);
    } else if (key === "delete") {
      setIsOpenConfirmDelete(true);
    }
  };

  const handleInvitePeople = () => {
    setDialog(true);
    setTtileDialog("Invite others to project");
    setLabelDialog("People");
    setIsInvite(true);
  };

  const handleNewGroup = () => {
    setDialog(true);
    setTtileDialog("Create Group");
    setLabelDialog("Group name");
  };

  const handleSubmitDialog = async () => {
    setLoading(true);
    const projectId = (await params).projectId;

    const name = dialogInput;

    if (isInvite) {
      const data = {
        userId: selectedUser,
        groupId: selectedGroup,
        role: roleDialog.id,
      };

      try {
        await post(`/projects/inviteToProject/${projectId}`, data);
      } catch (err) {
        console.error("Save failed", err);
      }
    } else {
      try {
        if (!name || name.trim() === "") {
          setErrorMessage("Group name cannot be empty.");
          return;
        }
        if (isEditGroup) {
          await put(`/team/updateGroup/${activeGroup._id}`, {
            name,
          });
        } else
          await post(`/team/createGroup/${projectId}`, {
            name,
          });
      } catch (err) {
        console.error("Save failed", err);
      }
    }
    loadInitialData();
    oncloseDialog();
  };

  const onHandleInviteSelect = async (key: string, value: string) => {
    if (key === "member") {
      setSelectedUser(value);
    } else if (key === "group") {
      setSelectedGroup(value);
    }
  };

  const handleDeleteGroup = async (groupId: string | null) => {
    if (!groupId) return;
    try {
      await deleteApi(`/team/deleteGroup/${groupId}`);
      setSelectedGroup(null);
      setActiveGroup({ _id: "all", name: "" });
      setIsOpenConfirmDelete(false);
      await fetchTeam();
      toast.success("Group deleted successfully.");
    } catch (err) {
      console.error("Error deleting group:", err);
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ||
        "Unable to delete this group.";
      toast.error(msg);
    }
  };

  const oncloseDialog = () => {
    setDialogInput(null);
    setIsInvite(false);
    setDialog(false);
    setLoading(false);
    setIsDialogAddToGroup(false);
    setSelectedUser(null);
    setSelectedGroup(null);
    setIsEditGroup(false);
  };

  const onCloseConfirmDelete = () => {
    setIsOpenConfirmDelete(false);
  };

  const handleRoleDialog = (data: any) => {
    const selectedRole = roleRadio.find((role) => role.id === data);
    setRoleDialog(selectedRole || { id: "user", label: "User" });
  };

  const handleRowSelectionChange = (rowSelection: Record<string, any>) => {
    if (isTeamReadOnly) return;
    setIsOpenDrawer(false);

    if (rowSelection && rowSelection.original) {
      setRowSelection(rowSelection.original);
      setIsOpenDrawer(true);
    }
  };

  const onCloseDrawer = () => {
    setIsOpenDrawer(false);
  };

  const isProjectAdmin = useMemo(() => {
    if (!user?._id || !memberPorject?.length) return false;
    const me = memberPorject.find(
      (m: any) => String(m.userId) === String(user._id)
    );
    return me?.role === "admin";
  }, [user?._id, memberPorject]);

  const canInvite = isProjectAdmin || (permissions && !permissions.isProjectInviteRestricted);

  const showGroupMemberRoleCol = activeGroup._id !== "all";
  const isTeamReadOnly = !isProjectAdmin;

  const handleGroupMemberRoleChange = useCallback(
    async (targetUserId: string, role: "GROUP_LEADER" | "GROUP_MEMBER") => {
      if (activeGroup._id === "all") return;
      setUpdatingGroupRoleUserId(targetUserId);
      try {
        const res = await put(
          `/team/updateGroupMemberRole/${activeGroup._id}`,
          {
            userId: targetUserId,
            role,
          }
        );
        if (res.success) {
          toast.success("Group role updated.");
          const response = await get(
            `/team/getMemberGroup/${activeGroup._id}`
          );
          if (response.success) {
            setMemberData(response.result || []);
            setMemberGroup(response.result || null);
          }
        } else {
          toast.error(
            (res.message as string) ||
            (res.error as string) ||
            "Unable to update."
          );
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to update group role.");
      } finally {
        setUpdatingGroupRoleUserId(null);
      }
    },
    [activeGroup._id, put, get]
  );

  const tableColumns = useMemo(
    () =>
      getTeamTableColumns({
        showGroupMemberRole: showGroupMemberRoleCol,
        projectAdmin: isProjectAdmin,
        onGroupMemberRoleChange: isProjectAdmin
          ? handleGroupMemberRoleChange
          : undefined,
        updatingUserId: updatingGroupRoleUserId,
      }),
    [
      showGroupMemberRoleCol,
      isProjectAdmin,
      handleGroupMemberRoleChange,
      updatingGroupRoleUserId,
    ]
  );

  const filteredData = memberData.filter((m: any) => {
    const roleMatch =
      (!roleFilter.user && !roleFilter.admin) ||
      (roleFilter.user && m.role === "user") ||
      (roleFilter.admin && m.role === "admin");

    const searchMatch =
      m.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      m.email.toLowerCase().includes(searchText.toLowerCase());

    return roleMatch && searchMatch;
  });

  const listUserData = listUser.filter((u: any) => {
    return !memberPorject.some((m) => m.userId === u._id);
  });

  return (
    // Đã chỉnh sửa div bọc ngoài thành flex-row
    <div className="flex flex-row relative w-full h-full gap-3 bg-muted overflow-hidden">

      {/* Sửa w-full thành flex-1 min-w-0 để nhường khoảng trống cho Drawer */}
      <div className="pt-4 space-y-4 h-full flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 gap-4">
          <h1 className="text-xl font-normal text-gray-800">Project members</h1>
          {canInvite && (
            <Button
              onClick={handleInvitePeople}
              className="bg-[#406D87] hover:bg-[#345a70] w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-4 rounded text-sm sm:text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              Invite people to project
            </Button>
          )}
        </div>

        {/* BODY */}
        <div className="flex flex-col md:flex-row border-t flex-1 bg-white overflow-hidden">
          {/* GROUPS SIDEBAR */}
          <div className="w-full md:max-w-72 border-b md:border-b-0 md:border-r flex flex-col shrink-0 overflow-y-auto h-48 md:h-full">
            <div className="h-16 flex shrink-0 items-center justify-between p-4 font-semibold text-lg border-b sticky top-0 bg-white z-10">
              <h3>Groups</h3>
              {!isTeamReadOnly ? (
                <Button
                  onClick={handleNewGroup}
                  size="sm"
                  className="bg-[#406D87] hover:bg-[#345a70] text-white ">
                  New Group
                </Button>
              ) : null}
            </div>

            {/* group items */}
            <div className="flex-1 bg-white">
              <Button
                onClick={() => handleGroupSelection({ _id: "all" })}
                className={`w-full flex flex-col rounded-none items-start h-14 bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none ${activeGroup._id === "all" ? "text-[#005f9e] bg-[#e5f0f8]" : ""
                  }`}>
                <span> All project members</span>
                <span className="font-normal">{memberProjectCount} Users</span>
              </Button>
              <div className="h-14 flex items-center">
                <Button className="w-full rounded-none pointer-events-none justify-start h-full bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none">
                  CUSTOM GROUPS
                </Button>
              </div>
              {groupData.map((group: any) => (
                <div key={group._id}>
                  <Button
                    onClick={() => handleGroupSelection(group)}
                    className={`w-full flex flex-col items-start rounded-none h-14 bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none ${activeGroup._id === group._id
                      ? "text-[#005f9e] bg-[#e5f0f8]"
                      : ""
                      }`}>
                    <span> {group.name}</span>
                    <span className="font-normal">
                      {group.memberCount} Users
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="w-full flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* filter table header */}
            <div className="border-b w-full shrink-0">
              <div className="flex flex-col lg:flex-row justify-between p-4 items-start lg:items-center gap-4 w-full">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {activeGroup._id === "all"
                      ? "All project members"
                      : `Members — ${activeGroup.name}`}
                  </h3>
                  {showGroupMemberRoleCol && isProjectAdmin && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Group Leader / Group Member permission assignment (ISO 19650): use the
                      &quot;Within Group&quot; column.
                    </p>
                  )}
                </div>

                {/* Actions: Roles, Invite, Search, Excel */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
                  {!isSearch && !isTeamReadOnly && (
                    <div className="flex flex-wrap items-center gap-2">
                      <CustomDropdown
                        type="checkbox"
                        icon={<ChevronDown className="w-4 h-4 ml-1" />}
                        label="Role"
                        items={[
                          {
                            label: "User",
                            checked: roleFilter.user,
                            onCheckedChange: (checked) =>
                              handleCheckedChange("user", checked),
                          },
                          {
                            label: "Admin",
                            checked: roleFilter.admin,
                            onCheckedChange: (checked) =>
                              handleCheckedChange("admin", checked),
                          },
                        ]}
                      />
                      {activeGroup._id !== "all" && projectIdStorage && (
                        <AddPeopleToGroup
                          projectId={projectIdStorage}
                          groupId={activeGroup._id}
                          memberProject={memberPorject}
                          memberGroup={memberGroup} />
                      )}
                    </div>
                  )}

                  {/* Search */}
                  {!isTeamReadOnly ? (
                    <div
                      className={`flex items-center transition-all duration-300 ${isSearch
                        ? "border w-full sm:w-[250px] lg:w-[350px] border-b-4 border-b-blue-900"
                        : "w-auto"
                        }`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setIsSearch(true)}>
                        <Search size={20} />
                      </Button>
                      {isSearch && (
                        <Input
                          className="focus-visible:ring-0 border-none h-8 px-2 flex-1 min-w-0"
                          placeholder="Search..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          autoFocus
                          onBlur={onSearchBlur}
                        />
                      )}
                    </div>
                  ) : null}

                  {/* Excel */}
                  {!isTeamReadOnly ? (
                    <CustomDropdown
                      icon={<EllipsisVertical size={20} />}
                      type="item"
                      items={[
                        {
                          label: "Export to Excel",
                          onClick: () => handleExcel("export"),
                        },
                        {
                          label: "Import from Excel",
                          onClick: () => handleExcel("import"),
                        },

                        ...(activeGroup._id !== "all"
                          ? [
                            {
                              label: "Rename Group",
                              onClick: () => onModifiedGroup("edit"),
                            },
                            {
                              className: "border-t mt-2 text-red-600 focus:text-red-600 focus:bg-red-50",
                              label: "Delete Group",
                              onClick: () => onModifiedGroup("delete"),
                            },
                          ]
                          : []),
                      ]}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {/* data table */}
            <div className="flex-1 overflow-auto bg-white min-h-0">
              <DataTable
                columns={tableColumns}
                data={filteredData}
                isDrawer={isOpenDrawer}
                onRowSelectionChange={handleRowSelectionChange} />
            </div>
          </div>
        </div>

        {/* DIALOGS */}
        <Dialog
          open={!!dialog}
          onOpenChange={(open) => {
            if (!open) {
              oncloseDialog();
            }
          }}>
          <DialogContent
            aria-describedby={undefined}
            className="sm:max-w-[425px] w-[95%] rounded-md">
            <DialogHeader>
              <DialogTitle>{titleDialog}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-gray-500">
                  {labelDialog}
                </Label>

                {!isInvite && (
                  <Input
                    className="border-b-2 border-b-blue-700 focus-visible:ring-0"
                    id="name"
                    value={dialogInput || ""}
                    onChange={(e) => setDialogInput(e.target.value)}
                  />
                )}
              </div>
              {isInvite && (
                <div className="flex flex-col justify-start gap-4">
                  <Select
                    onValueChange={(e) => onHandleInviteSelect("member", e)}>
                    <SelectTrigger className="w-full border-b-2 border-b-blue-700 focus-visible:outline-none focus:ring-0">
                      <SelectValue placeholder="Select people" />
                    </SelectTrigger>
                    <SelectContent>
                      {listUserData.length > 0 ? (
                        listUserData.map((user: any) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.fullName} ({user.email})
                          </SelectItem>
                        ))
                      ) : (
                        <p className="p-2 text-sm text-gray-500">No users available to add project</p>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsDialogAddToGroup(true)}
                    className="w-fit bg-gray-100 hover:bg-gray-300 text-gray-500 focus-visible:ring-0">
                    Add to a group
                  </Button>
                  {isDialogAddToGroup && (
                    <Select
                      onValueChange={(e) => onHandleInviteSelect("group", e)}>
                      <SelectTrigger className="w-full border-b-2 border-b-blue-700 focus-visible:outline-none focus:ring-0">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupData.length > 0 ? (
                          groupData.map((gr: any) => (
                            <SelectItem key={gr._id} value={gr._id}>
                              {gr.name}
                            </SelectItem>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-gray-500">No groups available to add project</p>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  </div>
                  <RadioGroup
                    className="flex text-black flex-col py-2"
                    value={roleDialog.id}
                    onValueChange={(value) => handleRoleDialog(value)}>
                    {roleRadio.map((item) => {
                      if (item.id === "admin" && !isProjectAdmin) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-3 ">
                          <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
                          <RadioGroupItem
                            value={item.id}
                            id={item.id}></RadioGroupItem>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => oncloseDialog()}>
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleSubmitDialog}
                disabled={
                  loading ||
                  (!dialogInput && !isInvite) ||
                  (!selectedUser && isInvite)
                }>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CONFIRM DELETE GROUP */}
        <ConfirmDeleteGroup
          open={isOpenConfirmDelete}
          groupName={activeGroup?.name || ""}
          onConfirm={() => handleDeleteGroup(activeGroup?._id)}
          onCancel={() => onCloseConfirmDelete()}
        />
      </div>

      <TeamDrawer
        isOpen={!isTeamReadOnly && isOpenDrawer}
        onClose={onCloseDrawer}
        data={rowSelection}
        groupData={groupData}
        activeGroup={activeGroup}></TeamDrawer>

      <Toaster richColors position="top-center" />
    </div>
  );
}

//#region CUSTOM DROPDOWN
type DropdownItem = {
  label: string;
  checked?: boolean;
  className?: string;

  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
};

type DropdownProps = {
  label?: string;
  items: DropdownItem[];
  type: "checkbox" | "item";
  icon?: ReactNode;
};
const CustomDropdown = ({ label, items, type, icon }: DropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="focus-visible:ring-0 flex items-center">
          {label} {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuSeparator />
        {items.map((item, index) =>
          type === "checkbox" ? (
            <DropdownMenuCheckboxItem
              key={index}
              checked={item.checked}
              onCheckedChange={item.onCheckedChange}
              className={`cursor-pointer ${item.className || ''}`}>
              {item.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={`cursor-pointer h-12 ${item.className || ''}`}>
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
//#endregion

//#region CONFIRM DELETE GROUP
const ConfirmDeleteGroup = ({
  open,
  groupName,
  onConfirm,
  onCancel,
}: {
  open?: boolean;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent className="w-[95%] sm:max-w-md rounded-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the group "{groupName}" ? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel className="mt-0 w-full sm:w-auto" onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};