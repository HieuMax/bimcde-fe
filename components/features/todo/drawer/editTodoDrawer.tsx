import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function EditTodoDrawer({
  formData,
  handleInputChange,
  users,
  priority,
  type,
  tag,
  showError,
  status,
}: {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  users: any[];
  priority: any[];
  type: any[];
  tag: any[];
  showError: boolean;
  status: { name: string; value: string }[];
}) {
  return (
    <div className=" px-3 overflow-y-auto pt-2">
      {/* Title */}
      <div className="pb-2">
        <Label>Title</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={showError ? "border-red-500" : ""}
          placeholder="Enter task title"
        />
        {showError && (
          <p className="text-sm text-red-500">This field is required.</p>
        )}
      </div>

      {/* Description */}
      <div className="pb-2">
        <Label>Description</Label>
        <Textarea
          rows={2}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Enter task description"
        />
      </div>

      {/* Assignee */}
      <div className="pb-2">
        <Label>Assignee</Label>
        <MultiSelect
          values={formData.selectedUsers}
          onValuesChange={(values) =>
            handleInputChange("selectedUsers", values)
          }>
          <MultiSelectTrigger className="w-full min-h-11 h-fit">
            <MultiSelectValue
              className="flex flex-col justify-items-start"
              placeholder="Select assignees"
            />
          </MultiSelectTrigger>
          <MultiSelectContent className="">
            {users?.length > 0 ? (
              <MultiSelectGroup>
                <ScrollArea className="h-44">
                  {users?.map((user: any) => (
                    <MultiSelectItem
                      className="flex w-full items-center h-8 cursor-pointer"
                      key={user._id}
                      value={user._id}>
                      <span className="w-full">
                        {user.name}
                        {user.email && ` (${user.email})`}
                      </span>
                    </MultiSelectItem>
                  ))}
                </ScrollArea>
              </MultiSelectGroup>
            ) : (
              <p className="px-2 py-1 text-sm text-gray-500">
                No users available
              </p>
            )}
          </MultiSelectContent>
        </MultiSelect>
      </div>

      {/* STATUS */}
      <div className="pb-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleInputChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {status?.map((item, index) => (
              <SelectItem
                key={index}
                value={item.value}
                className="cursor-pointer h-12">
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="pb-2">
        <Label>Priority</Label>
        <Select
          value={formData.priorityId}
          onValueChange={(value) => handleInputChange("priorityId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {priority?.map((item, index) => (
              <SelectItem
                key={index}
                value={item._id}
                className="cursor-pointer h-12">
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Completion % */}
      <div className="pb-2">
        <Label>Completion %</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={formData.completion}
          onChange={(e) => handleInputChange("completion", e.target.value)}
          placeholder="0-100"
        />
      </div>

      {/* Due Date */}
      <div className="pb-2">
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.dueDate && "text-muted-foreground"
              )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? (
                (() => {
                  const dateValue =
                    formData.dueDate instanceof Date
                      ? formData.dueDate
                      : formData.dueDate
                      ? new Date(formData.dueDate)
                      : null;
                  return dateValue && !isNaN(dateValue.getTime())
                    ? format(dateValue, "PPP")
                    : "Pick a date";
                })()
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                formData.dueDate instanceof Date
                  ? formData.dueDate
                  : formData.dueDate
                  ? new Date(formData.dueDate)
                  : undefined
              }
              onSelect={(date) => handleInputChange("dueDate", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Type */}
      <div className="pb-2">
        <Label>Type</Label>
        <Select
          value={formData.typeId}
          onValueChange={(value) => handleInputChange("typeId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="">
            <ScrollArea className="h-44">
              {type?.map((item, index) => (
                <SelectItem
                  key={index}
                  value={item._id}
                  className="cursor-pointer h-12">
                  {item.name}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="pb-2">
        <Label>Tags</Label>
        <MultiSelect
          values={formData.selectedTags}
          onValuesChange={(values) =>
            handleInputChange("selectedTags", values)
          }>
          <MultiSelectTrigger className="w-full min-h-11 h-fit">
            <MultiSelectValue
              className="flex flex-col justify-items-start"
              placeholder="Select tags"
            />
          </MultiSelectTrigger>
          <MultiSelectContent className="">
            <ScrollArea className="h-32">
              {tag?.length > 0 ? (
                <MultiSelectGroup>
                  {tag?.map((t: any) => (
                    <MultiSelectItem
                      className="flex items-center h-8 cursor-pointer"
                      key={t._id}
                      value={t._id}>
                      <span>{t.name}</span>
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              ) : (
                <p className="px-2 py-1 text-sm text-gray-500">
                  No tags available
                </p>
              )}
            </ScrollArea>
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
}
