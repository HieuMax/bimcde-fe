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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export default function AddPeopleToGroup({
  projectId,
  groupId,
  memberProject,
  memberGroup,
}: {
  projectId: string | null;
  groupId: string;
  memberProject: any;
  memberGroup: any;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { get, post } = useApi();

  const handleAddPeople = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to add.");
      return;
    }

    try {
      setLoading(true);
      const response = await post(`/team/addPeopleToGroup/${groupId}`, {
        userIds: selectedUsers,
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
      setLoading(false);
    }
  };

  const filterData = memberProject.filter((user: any) => {
    if (memberGroup) {
      return !memberGroup.some(
        (groupUser: any) => groupUser.userId === user.userId
      );
    }
    return true;
  });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
          variant="outline">
          Add people to group
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-[300px] ">
        <h3>Add people to grop</h3>
        <MultiSelect values={selectedUsers} onValuesChange={setSelectedUsers}>
          <MultiSelectTrigger className=" w-full h-11">
            <MultiSelectValue placeholder="Type to add" />
          </MultiSelectTrigger>
          <MultiSelectContent className="p-4">
            {filterData.length > 0 ? (
              <MultiSelectGroup>
                {filterData.map((user: any) => (
                  <MultiSelectItem key={user.userId} value={user.userId}>
                    <span>
                      {user.fullName} ({user.email})
                    </span>
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            ) : (
              <p>No users available in this project</p>
            )}
          </MultiSelectContent>
        </MultiSelect>

        <Button
          className="mt-4"
          onClick={handleAddPeople}
          disabled={loading || selectedUsers?.length === 0}>
          {loading ? "Adding..." : "Add"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
