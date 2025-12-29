"use client";

import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EllipsisVertical, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";

const listRole = [
  { id: "admin", name: "Admin" },
  { id: "user", name: "User" },
];

export default function TeamDrawer({
  isOpen,
  onClose,
  data,
  activeGroup,
  groupData,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  activeGroup: any;
  groupData: any;
}) {
  useEffect(() => {
    getAllGroupByUserId();
    setSelectedRole(data.role);
  }, [data.userId]);

  const [selectedRole, setSelectedRole] = useState<string>(data.role || "user");
  const [selectedGroup, setSelectedGroup] = useState<any[]>([]);
  const [isAddToGroup, setIsAddToGroup] = useState<boolean>(false);
  const [groupList, setGroupList] = useState<any[]>([]);
  const { post, get } = useApi();

  const handleRoleChange = async (e: any) => {
    setSelectedRole(e);

    const updatedData = {
      ...data,
      role: e,
    };
    try {
      const response = await post(
        `/projects/updateProjectMember/${data.projectId}`,
        updatedData
      );
      if (response.success) {
        console.log("Role updated successfully");
      } else {
        console.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const getAllGroupByUserId = async () => {
    try {
      const userIdPost = { userId: data.userId };
      const response = await post(`/team/getAllGroupByUserId`, userIdPost);
      if (response.success) {
        const listGroup = response.result;
        setGroupList(listGroup);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const onAddToGroup = () => {
    if (!isAddToGroup) {
      setIsAddToGroup(true);
    } else {
      setIsAddToGroup(false);
    }
  };
  const handleAddToGroup = async () => {
    try {
      const response = await post(`/team/addGroupToPeople/${data.userId}`, {
        groupIds: selectedGroup,
      });

      if (response.success) {
        window.location.reload();
      } else {
        alert("Failed to add people to the group.");
      }
    } catch (error) {
      console.error("Error adding people to group:", error);
      alert("An error occurred while adding people.");
    } finally {
    }
  };

  const onRemoveFromGroup = async (groupId: string) => {
    try {
      const response = await post(`/team/removeMemberFromGroup/${groupId}`, {
        userId: data.userId,
      });
      if (response.success) {
        window.location.reload();
      } else {
        alert("Failed to add people to the group.");
      }
    } catch (error) {
      console.error("Error adding people to group:", error);
      alert("An error occurred while adding people.");
    }
  };

  const onRemoveFromProject = async () => {
    try {
      const userRemove = data.userId;
      const response = await post(
        `/projects/removeFromProject/${data.projectId}`,
        { userRemove: userRemove }
      );
      if (response.success) {
        window.location.reload();
      } else {
        alert("Failed to add people to the group.");
      }
    } catch (error) {
      console.error("Error adding people to group:", error);
      alert("An error occurred while adding people.");
    }
  };

  const onCLoseDrawer = () => {
    setIsAddToGroup(false);
    setSelectedGroup([]);
    onClose();
  };

  const filterData = groupData.filter((gr: any) => {
    return !groupList.some((g) => g._id === gr._id);
  });
  return (
    <Drawer.Root open={isOpen} onClose={onCLoseDrawer}>
      <Drawer.Trigger>Open Drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="right-0 top-0 bottom-0 fixed z-10 outline-none w-[310px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
        >
          <div className="bg-zinc-50 h-full w-full grow overflow-y-auto  flex flex-col rounded-[16px]">
            <div className="max-w-md mt-14">
              <Drawer.Title className="font-medium mb-2 text-zinc-900">
                <div className="flex items-center gap-2 justify-end border-b-2 border-b-gray-300 p-5">
                  <Button className="bg-transparent shadow-none text-gray500 hover:bg-gray-200">
                    <EllipsisVertical className="w-full h-full"></EllipsisVertical>
                  </Button>
                  <Button
                    onClick={onCLoseDrawer}
                    className="bg-transparent shadow-none text-gray500 hover:bg-gray-200">
                    <X></X>
                  </Button>
                </div>
              </Drawer.Title>
            </div>
            <div className="flex flex-col items-center bg-zinc-100 border-b-2 border-b-gray-300 py-3">
              <Image
                src="https://resources.connect.trimble.com/thumb/user.png"
                alt="User image"
                width={100}
                height={100}
              />
              <h3 className="font-semibold text-lg">{data.fullName}</h3>
              <span>
                <a
                  href={`mailto:${data.email}`}
                  className="text-sm text-[#005f9e] hover:underline">
                  {data.email}
                </a>
              </span>
            </div>

            <div className=" text-gray-500 p-4 border-b-2 border-b-gray-300 ">
              <h3 className="font-medium text-base">Details</h3>
              <div className="pt-4">
                <span className="text-sm">Last accessed</span>
                {data.lastAccessed ? (
                  <p className="font-normal ">
                    {data.lastAccessed
                      ? new Date(data.lastAccessed).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : ""}
                  </p>
                ) : (
                  <p className="font-semibold">Never</p>
                )}
              </div>
              <div className="pt-4">Role</div>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full border-b-2 border-b-blue-700 focus-visible:outline-none focus:ring-0">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {listRole.length > 0 ? (
                    listRole.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))
                  ) : (
                    <p>No roles available</p>
                  )}
                </SelectContent>
              </Select>
            </div>
            {activeGroup && activeGroup._id == "all" && (
              <div className="p-4">
                <div className="flex items-center justify-between ">
                  <h3 className="font-medium text-base text-gray-500">
                    Groups
                  </h3>
                  <Button
                    onClick={onAddToGroup}
                    className="bg-transparent text-blue-700 shadow-none hover:bg-blue-100 hover:text-blue-800">
                    {isAddToGroup ? (
                      <span>Cancel</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus></Plus> Add to Group
                      </span>
                    )}
                  </Button>
                </div>

                {isAddToGroup && (
                  <div className="mt-4">
                    <MultiSelect
                      values={selectedGroup}
                      onValuesChange={setSelectedGroup}>
                      <MultiSelectTrigger className=" w-full h-11">
                        <MultiSelectValue placeholder="Type to add" />
                      </MultiSelectTrigger>
                      <MultiSelectContent className="p-4">
                        {filterData?.length > 0 ? (
                          <MultiSelectGroup>
                            {filterData?.map((gr: any) => (
                              <MultiSelectItem key={gr._id} value={gr._id}>
                                <span>{gr.name}</span>
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        ) : (
                          <p>No users available in this project</p>
                        )}
                      </MultiSelectContent>
                    </MultiSelect>
                    <Button
                      onClick={handleAddToGroup}
                      className="bg-[#005a92] hover:bg-[#004a79] text-white mt-2">
                      Add
                    </Button>
                  </div>
                )}

                {groupList?.length > 0 && (
                  <div className="mt-4">
                    {groupList.map((group) => (
                      <div
                        key={group._id}
                        className="mb-1 flex items-center justify-between">
                        {group.name}{" "}
                        <Button
                          onClick={() => onRemoveFromGroup(group._id)}
                          className="bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-500 shadow-none">
                          <X></X>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-auto p-4">
              <Button
                onClick={onRemoveFromProject}
                className="w-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md py-2">
                Remove from Project
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
