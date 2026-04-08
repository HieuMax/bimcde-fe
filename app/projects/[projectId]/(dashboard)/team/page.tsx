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
      id: "user", // Changed to 'user' to ensure unique ID
      label: "User",
    },
    {
      id: "admin", // Changed to 'admin' to ensure unique ID
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
    id: "user", // Initial role set to 'user'
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
      // Fetch members for the selected group
      const response = await get(`/team/getMemberGroup/${group._id}`);
      setMemberData(response.result || []);
      setMemberGroup(response.result || null);
    }
  };

  const handleCheckedChange = (role: "user" | "admin", checked: boolean) => {
    setRoleFilter((prevState) => ({
      ...prevState,
      [role]: checked, // Cập nhật trạng thái checkbox cho từng role
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
    setTtileDialog("Invite others to test");
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
      // Refresh group and member data after deletion
      setSelectedGroup(null);
      setActiveGroup({ _id: "all", name: "" });
      fetchTeam();
    } catch (err) {
      console.error("Error deleting group:", err);
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
    setIsOpenDrawer(false);

    if (rowSelection && rowSelection.original) {
      setRowSelection(rowSelection.original);
      setIsOpenDrawer(true);
    }
  };

  const onCloseDrawer = () => {
    setIsOpenDrawer(false);
  };

  // Lọc dữ liệu dựa trên checkbox
  const isProjectAdmin = useMemo(() => {
    if (!user?._id || !memberPorject?.length) return false;
    const me = memberPorject.find(
      (m: any) => String(m.userId) === String(user._id)
    );
    return me?.role === "admin";
  }, [user?._id, memberPorject]);

  const showGroupMemberRoleCol = activeGroup._id !== "all";

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
          toast.success("Đã cập nhật vai trò trong nhóm.");
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
              "Không thể cập nhật."
          );
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi cập nhật vai trò trong nhóm.");
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
    <div className="flex relative w-full h-full gap-3">
      <div className="pt-4 space-y-4 bg-muted h-full w-full overflow-y-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4">
          <h1 className="text-xl font-normal text-gray-800">Project members</h1>
          <Button
            onClick={handleInvitePeople}
            className="bg-[#406D87] hover:bg-[#345a70] px-6 py-4 rounded text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            Invite people to project
          </Button>
        </div>
        {/* BODY */}
        <div className="flex  border-t h-[calc(100%-40px)] bg-white">
          {/* groups */}

          <div className="max-w-72 w-full border-r">
            <div className="h-16 flex items-center justify-between p-4 font-semibold text-lg border-b">
              <h3>Groups</h3>
              <Button
                onClick={handleNewGroup}
                className="bg-[#406D87] hover:bg-[#345a70] text-white ">
                New Group
              </Button>
            </div>
            {/* group item */}

            <div className="h-full bg-white border-none ">
              <Button
                onClick={() => handleGroupSelection({ _id: "all" })}
                className={`w-full flex flex-col rounded-none items-start h-14 bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none ${
                  activeGroup._id === "all" ? "text-[#005f9e] bg-[#e5f0f8]" : ""
                }`}>
                <span> All project members</span>
                <span className="font-normal">{memberProjectCount} Users</span>
              </Button>
              <div className="h-14 items-center">
                <Button className="w-full rounded-none pointer-events-none justify-start h-14 bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none">
                  CUSTOM GROUPS
                </Button>
              </div>
              {groupData.map((group: any) => (
                <div key={group._id}>
                  <Button
                    onClick={() => handleGroupSelection(group)}
                    className={`w-full flex flex-col items-start rounded-none h-14 bg-white text-gray-500 hover:bg-gray-200 border-none outline-none shadow-none ${
                      activeGroup._id === group._id
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

          {/* table */}

          <div className=" w-full">
            {/* filter table */}
            <div className="  border-b h-16 w-full">
              <div className="flex justify-between p-4 pr-28 items-center h-full">
                <div>
                  <h3 className="font-semibold text-lg">
                    {activeGroup._id === "all"
                      ? "All project members"
                      : `Members — ${activeGroup.name}`}
                  </h3>
                  {showGroupMemberRoleCol && isProjectAdmin && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phân quyền Group Leader / Group Member (ISO 19650): dùng cột
                      &quot;Trong nhóm&quot;.
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  {!isSearch && (
                    <div>
                      {" "}
                      <CustomDropdown
                        type="checkbox"
                        icon={<ChevronDown></ChevronDown>}
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
                          memberGroup={memberGroup}></AddPeopleToGroup>
                      )}
                    </div>
                  )}

                  {/* Search */}
                  <div
                    className={`flex items-center ${
                      isSearch
                        ? "border w-[450px] border-b-4 border-b-blue-900"
                        : ""
                    }`}>
                    <Button
                      variant="ghost"
                      className=""
                      onClick={() => setIsSearch(true)}>
                      <Search className="!h-full  !w-full" size={23} />
                    </Button>
                    {isSearch && (
                      <Input
                        className="focus-visible:ring-0 border-none "
                        placeholder="Tìm kiếm..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        autoFocus
                        onBlur={onSearchBlur}
                      />
                    )}
                  </div>

                  {/* Excel */}

                  <CustomDropdown
                    icon={<EllipsisVertical></EllipsisVertical>}
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
                              className: "border-t mt-2",
                              label: "Delete Group",
                              onClick: () => onModifiedGroup("delete"),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* data table */}
            <DataTable
              columns={tableColumns}
              data={filteredData}
              isDrawer={isOpenDrawer}
              onRowSelectionChange={handleRowSelectionChange}></DataTable>
          </div>
        </div>
        {/* DIALOG */}
        <Dialog
          open={!!dialog}
          onOpenChange={(open) => {
            if (!open) {
              oncloseDialog();
            }
          }}>
          {" "}
          <DialogContent
            aria-describedby={undefined}
            className="sm:max-w-[425px]">
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
                    // onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
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
                        <p>No users available to add project</p>
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
                          <p>No groups available to add project</p>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  </div>
                  <RadioGroup
                    className="flex items-center text-black"
                    value={roleDialog.id}
                    onValueChange={(value) => handleRoleDialog(value)}>
                    {roleRadio.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 ">
                        <Label>{item.label}</Label>
                        <RadioGroupItem
                          value={item.id}
                          id={item.id}></RadioGroupItem>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => oncloseDialog()}>
                Cancel
              </Button>
              <Button
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
        ;{/* CONFIRM DELETE GROUP */}
        <ConfirmDeleteGroup
          open={isOpenConfirmDelete}
          groupName={activeGroup?.name || ""}
          onConfirm={() => handleDeleteGroup(activeGroup?._id)}
          onCancel={() => onCloseConfirmDelete()}
        />
      </div>
      <TeamDrawer
        isOpen={isOpenDrawer}
        onClose={onCloseDrawer}
        data={rowSelection}
        groupData={groupData}
        activeGroup={activeGroup}></TeamDrawer>
      <Toaster richColors position="top-center" />
    </div>
  );
}

//#region CUSTOM DROPDOWN
/**
 * label
 * checked: true/false
 * onCheckedChange: check boolean
 * onClick : callback
 */
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
        <Button variant="ghost" className="focus-visible:ring-0">
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
              className={`cursor-pointer ${item.className}`}>
              {item.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={`cursor-pointer h-12 ${item.className}`}>
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the group "{groupName}" ? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
