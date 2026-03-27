"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useApi } from "@/app/hooks/useApi";
import { useAuth } from "@/app/context/authContext";

interface AddTodoDialogProps {
  open: boolean;
  priority: any[];
  type: any[];
  users: any[];
  tag: any[];
  projectId: string;
  onClose: () => void;
}

interface Assignee {
  id: string;
  name: string;
}

export default function AddTodoDialog({
  open,
  onClose,
  priority,
  users,
  type,
  tag,
  projectId,
}: AddTodoDialogProps) {
  const [name, setName] = useState("");
  const [showError, setShowError] = useState(false);
  const [moreDetails, setMoreDetails] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [prioritySelected, setPrioritySelected] = useState({});
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);
  const { post, get } = useApi();
  const { user } = useAuth();
  const onToggleDetails = () => {
    setMoreDetails(!moreDetails);
  };
  const handleSave = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    const selectedUserObjects = users.filter((user) =>
      selectedUsers.includes(user._id),
    );

    const selectedTagObjects = tag.filter((t) => selectedTags.includes(t._id));

    const selectedPriority = priority.find((p) => prioritySelected === p._id);
    const selectedType = type.find((p) => typeId === p._id);

    const assignessUpdate = selectedUserObjects?.map((a) => ({
      assigneeId: a.userId || a._id,
      name: a.name,
      type: a.type,
      label: a.email || a.name,
    }));

    const tagUpdate = selectedTagObjects?.map((t) => ({
      tagId: t._id,
      name: t.name,
    }));

    const priorityUpdate = selectedPriority
      ? {
          priorityId: selectedPriority._id,
          name: selectedPriority.name,
          color: selectedPriority.color,
        }
      : null;

    const typeUpdate = selectedType
      ? {
          typeId: selectedType._id,
          name: selectedType.name,
        }
      : null;

    const userCreateBy = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };

    const data = {
      projectId: projectId,
      name,
      description,
      assignees: assignessUpdate,
      tag: tagUpdate,
      priority: priorityUpdate,
      typeTopic: typeUpdate,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : "",
      createdBy: userCreateBy,
      modifiedBy: userCreateBy,
    };

    try {
      const response = await post(`/todo/create/${projectId}`, {
        data,
      });

      if (response.success) {
        // window.location.reload();
      } else {
        alert("Failed to add people to the group.");
      }
    } catch (error) {
      console.error("Error adding people to group:", error);
      alert("An error occurred while adding people.");
    } finally {
      onClose();
    }

    if (!createAnother) {
      onClose();
    } else {
      // reset form nếu muốn tạo tiếp
      setName("");
      setDescription("");
      setSelectedUsers([]);
      setSelectedTags([]);
      setPrioritySelected({});
      setTypeId(null);
      setDueDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create ToDo
          </DialogTitle>
        </DialogHeader>

        {/* BODY */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowError(false);
              }}
              className={showError ? "border-red-500" : ""}
            />
            {showError && (
              <p className="text-sm text-red-500">This field is required.</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <Label>Assignee</Label>
            <MultiSelect
              values={selectedUsers}
              onValuesChange={setSelectedUsers}>
              <MultiSelectTrigger className=" w-full min-h-11 h-fit">
                <MultiSelectValue
                  className="flex flex-col justify-items-start "
                  placeholder="Please enter users, groups"
                />
              </MultiSelectTrigger>
              <MultiSelectContent className="">
                {users.length > 0 ? (
                  <MultiSelectGroup>
                    <ScrollArea className="h-44">
                      {users.map((user: any) => (
                        <MultiSelectItem
                          className="flex items-center h-8 cursor-pointer"
                          key={user._id}
                          value={user._id}>
                          <span>
                            {user.name}
                            {user.email && ` (${user.email})`}
                          </span>
                        </MultiSelectItem>
                      ))}
                    </ScrollArea>
                  </MultiSelectGroup>
                ) : (
                  <p>No users available in this project</p>
                )}
              </MultiSelectContent>
            </MultiSelect>
          </div>

          {moreDetails && (
            <>
              {/* Priority + Due date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select onValueChange={setPrioritySelected}>
                    <SelectTrigger>
                      <SelectValue placeholder="Please Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {priority.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item._id}
                          className={`cursor-pointer h-12`}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? (
                          format(dueDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label>Type</Label>
                <Select onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <ScrollArea className="h-44">
                      {type.map((item, index) => (
                        <SelectItem
                          key={index}
                          value={item._id}
                          className={`cursor-pointer h-12`}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <Label>Tags</Label>
                <MultiSelect
                  values={selectedTags}
                  onValuesChange={setSelectedTags}>
                  <MultiSelectTrigger className=" w-full min-h-11 h-fit">
                    <MultiSelectValue
                      className="flex flex-col justify-items-start "
                      placeholder="Tags"
                    />
                  </MultiSelectTrigger>
                  <MultiSelectContent className="">
                    <ScrollArea className="h-32">
                      {tag.length > 0 ? (
                        <MultiSelectGroup>
                          {tag.map((t: any) => (
                            <MultiSelectItem
                              className="flex items-center  h-8 cursor-pointer"
                              key={t._id}
                              value={t._id}>
                              <span>{t.name}</span>
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      ) : (
                        <p>No tag available in this project</p>
                      )}
                    </ScrollArea>
                  </MultiSelectContent>
                </MultiSelect>{" "}
              </div>
            </>
          )}

          <Button
            onClick={onToggleDetails}
            className="text-sm bg-transparent w-full text-left justify-start shadow-none hover:bg-blue-100 text-blue-600 ">
            Show less
          </Button>
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="createAnother"
              checked={createAnother}
              onCheckedChange={(value) => setCreateAnother(Boolean(value))}
            />
            <Label htmlFor="createAnother" className="text-sm font-normal">
              Create another
            </Label>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
