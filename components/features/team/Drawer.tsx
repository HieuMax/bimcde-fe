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
        updatedData,
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
      const userIdPost = {
        userId: data.userId,
        projectId: data.projectId
      };
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
        { userRemove: userRemove },
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
    <>
      {isOpen && (
        <>
          {/* Desktop Drawer */}
          <div className="hidden lg:flex flex-col bg-white h-full ml-auto min-w-[320px] max-w-[420px] relative shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex-1 min-w-0"></div>

                <div className="">
                  <div className="flex items-center nowrap border-t border-t-[#d0d0d7] pl-4 pr-2">
                    <h5 className=" my-2 overflow-hidden whitespace-nowrap text-ellipsis">
                      Details
                    </h5>
                  </div>
                  <div className=" pl-4 pr-2 flex flex-col flex-nowrap space-y-2">
                    <div className="min-h-12 flex flex-col relative text-sm">
                      <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                        Last accessed
                      </label>
                      {data.lastAccessed ? (
                        <div className=" overflow-hidden text-ellipsis whitespace-nowrap">
                          {data.lastAccessed
                            ? new Date(data.lastAccessed).toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )
                            : ""}
                        </div>
                      ) : (
                        <p className="font-semibold">Never</p>
                      )}
                    </div>
                    <div className="min-h-12 flex flex-col relative text-sm">
                      <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                        Role:
                      </label>
                      <Select
                        value={selectedRole}
                        onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full border-b-1  focus-visible:outline-none focus:ring-0">
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
                  </div>

                  <div className="">
                    <div className="flex items-center border-t border-slate-200 px-6 py-4">
                      <h5 className="my-0 truncate text-sm font-semibold">
                        Details
                      </h5>
                    </div>
                    <div className="px-6 pb-4 flex flex-col gap-4">
                      <div className="min-h-12 flex flex-col relative text-sm">
                        <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                          Last accessed
                        </label>
                        {data.lastAccessed ? (
                          <div className=" overflow-hidden text-ellipsis whitespace-nowrap">
                            {data.lastAccessed
                              ? new Date(data.lastAccessed).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )
                              : ""}
                          </div>
                        ) : (
                          <p className="font-semibold">Never</p>
                        )}
                      </div>
                      <div className="min-h-12 flex flex-col relative text-sm">
                        <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                          Role:
                        </label>
                        <Select
                          value={selectedRole}
                          onValueChange={handleRoleChange}>
                          <SelectTrigger className="w-full border-b focus-visible:outline-none focus:ring-0">
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
                    </div>
                  </div>
                  {activeGroup && activeGroup._id == "all" && (
                    <div className="">
                      <div className="flex justify-between items-center border-t border-slate-200 px-6 py-4 mt-2">
                        <h5 className="truncate text-sm font-semibold">
                          Groups
                        </h5>
                        <Button
                          onClick={onAddToGroup}
                          className="bg-transparent text-[#005f9e] shadow-none hover:bg-blue-100 hover:text-blue-800">
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
                        <div className="mt-4 px-6">
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
                                    <MultiSelectItem
                                      key={gr._id}
                                      value={gr._id}>
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
                            size="sm"
                            className="bg-[#005f9e] hover:bg-[#004a79]  text-white mt-2">
                            Add
                          </Button>
                        </div>
                      )}

                      {groupList?.length > 0 && (
                        <div className="mt-4 px-6">
                          {groupList.map((group) => (
                            <div
                              key={group._id}
                              className="flex items-center justify-between min-h-10 w-full gap-3">
                              <div className="overflow-hidden text-ellipsis text-sm">
                                {group.name}
                              </div>
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
                </div>
              </div>
            </div>
            <div className="bg-white border-t border-t-[#d0d0d7] w-full">
              <div className="p-2">
                <div className="w-full">
                  <Button
                    onClick={onRemoveFromProject}
                    className="w-full bg-transparent text-red-700 shadow-none hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ">
                    Remove from Project
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Drawer */}
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={onCLoseDrawer}
            />
            {/* Sheet */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="font-semibold text-lg">Member Details</h3>
                <Button
                  onClick={onCLoseDrawer}
                  className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
                  <X />
                </Button>
              </div>
              <div className="overflow-y-auto flex flex-col h-full">
                <div className="flex-1 pb-4">
                  <div className="block">
                    <div className="flex items-center justify-center bg-slate-50 p-4 min-h-[150px]">
                      <div className="flex flex-col w-full items-center">
                        <Image
                          src="https://resources.connect.trimble.com/thumb/user.png"
                          alt="User image"
                          width={88}
                          height={88}
                        />
                        <div className="mt-2 text-center">
                          <h3 className="text-lg font-semibold">
                            {data.fullName}
                          </h3>
                          <span>
                            <a
                              href={`mailto:${data.email}`}
                              className="text-sm text-[#005f9e] hover:underline">
                              {data.email}
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="">
                      <div className="flex items-center border-t border-slate-200 px-6 py-4">
                        <h5 className="my-0 truncate text-sm font-semibold">
                          Details
                        </h5>
                      </div>
                      <div className="px-6 pb-4 flex flex-col gap-4">
                        <div className="min-h-12 flex flex-col relative text-sm">
                          <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                            Last accessed
                          </label>
                          {data.lastAccessed ? (
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {data.lastAccessed
                                ? new Date(data.lastAccessed).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )
                                : ""}
                            </div>
                          ) : (
                            <p className="font-semibold">Never</p>
                          )}
                        </div>
                        <div className="min-h-12 flex flex-col relative text-sm">
                          <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                            Role:
                          </label>
                          <Select
                            value={selectedRole}
                            onValueChange={handleRoleChange}>
                            <SelectTrigger className="w-full border-b focus-visible:outline-none focus:ring-0">
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
                      </div>
                    </div>
                    {activeGroup && activeGroup._id == "all" && (
                      <div className="">
                        <div className="flex justify-between items-center border-t border-slate-200 px-6 py-4 mt-2">
                          <h5 className="truncate text-sm font-semibold">
                            Groups
                          </h5>
                          <Button
                            onClick={onAddToGroup}
                            className="bg-transparent text-[#005f9e] shadow-none hover:bg-blue-100 hover:text-blue-800">
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
                          <div className="mt-4 px-6">
                            <MultiSelect
                              values={selectedGroup}
                              onValuesChange={setSelectedGroup}>
                              <MultiSelectTrigger className="w-full h-11">
                                <MultiSelectValue placeholder="Type to add" />
                              </MultiSelectTrigger>
                              <MultiSelectContent className="p-4">
                                {filterData?.length > 0 ? (
                                  <MultiSelectGroup>
                                    {filterData?.map((gr: any) => (
                                      <MultiSelectItem
                                        key={gr._id}
                                        value={gr._id}>
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
                              size="sm"
                              className="bg-[#005f9e] hover:bg-[#004a79] text-white mt-2">
                              Add
                            </Button>
                          </div>
                        )}

                        {groupList?.length > 0 && (
                          <div className="mt-4 px-6">
                            {groupList.map((group) => (
                              <div
                                key={group._id}
                                className="flex items-center justify-between border-none min-h-10 w-full">
                                <div className="overflow-hidden text-ellipsis text-sm">
                                  {group.name}
                                </div>
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
                  </div>
                </div>
              </div>
              <div className="bg-white border-t border-t-[#d0d0d7] w-full">
                <div className="p-4">
                  <div className="w-full">
                    <Button
                      onClick={onRemoveFromProject}
                      className="w-full bg-transparent text-red-700 shadow-none hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                      Remove from Project
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
