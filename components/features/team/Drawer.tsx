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
        <div className=" flex flex-col bg-white nowrap h-full ml-auto  min-w-80 relative shadow">
          <div className="flex border-b border-b-[#d0d0d7] nowrap p-4 items-center ">
            <div className="items-center flex flex-1 overflow-hidden"></div>
            <Button className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
              <EllipsisVertical className="w-full h-full"></EllipsisVertical>
            </Button>
            <Button
              onClick={onCLoseDrawer}
              className="bg-transparent shadow-none text-gray500 hover:bg-gray-200">
              <X></X>
            </Button>
          </div>
          <div className="overflow-y-auto flex flex-col nowrap h-full">
            <div className="flex-1 pb-4">
              <div className="block">
                <div className="items-center bg-[#f9f9fb] bg-position-[50%]  nowrap bg-cover flex justify-center min-h-24 p-4">
                  <div className="flex flex-col w-full items-center">
                    <Image
                      src="https://resources.connect.trimble.com/thumb/user.png"
                      alt="User image"
                      width={88}
                      height={88}
                    />
                    <div className="mt-2 text-center">
                      <h3 className="text-lg font-semibold">{data.fullName}</h3>
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
                </div>
                {activeGroup && activeGroup._id == "all" && (
                  <div className="">
                    <div className="flex nowrap justify-between items-center pl-4 pr-2 border-t border-t-[#d0d0d7] mt-2">
                      <h5 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
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
                      <div className="mt-4 pl-4 pr-2">
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
                          size="sm"
                          className="bg-[#005f9e] hover:bg-[#004a79]  text-white mt-2">
                          Add
                        </Button>
                      </div>
                    )}

                    {groupList?.length > 0 && (
                      <div className="mt-4 pl-4 pr-2">
                        {groupList.map((group) => (
                          <div
                            key={group._id}
                            className="flex items-center justify-between border-none nowrap min-h-10 w-full">
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
      )}
    </>
  );
}
