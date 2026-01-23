"use client";

import React, { useState, useMemo } from "react";
import { IRelease } from "@/types/release";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";
import { RecipientSelector, RecipientOption } from "../RecipientSelector";

interface ReleaseEditViewProps {
  release: IRelease;
  onBack: () => void;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

const ReleaseEditView: React.FC<ReleaseEditViewProps> = ({
  release,
  onBack,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(release.name);
  const [description, setDescription] = useState(release.description || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    release.dueDate ? new Date(release.dueDate) : undefined,
  );

  const initialRecipientOptions: RecipientOption[] = useMemo(() => {
    if (!release.recipients) return [];
    return release.recipients.map((r: any) => ({
      id: r._id,
      label: r.fullName || r.name || "Unknown", // Fallback name
      email: r.email,
      type: "USER", // Mặc định là USER, nếu BE trả về flag isGroup thì check tại đây
    }));
  }, [release.recipients]);

  // [UPDATE] State lưu mảng ID recipients thay vì string
  const [recipientIds, setRecipientIds] = useState<string[]>(
    release.recipients?.map((r) => (typeof r === "string" ? r : r._id)) || [],
  );

  const [loading, setLoading] = useState(false);

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name,
        description,
        dueDate,
        recipients: recipientIds, // Gửi mảng ID trực tiếp
      };

      await releaseService.updateRelease(release._id, payload);

      toast.success("Release updated successfully");
      await onSave(name);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update release");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b min-h-[60px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-gray-800">Edit Release</h3>
      </div>

      {/* Form Body */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="h-9"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">Due date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                disabled={loading}
                className={cn(
                  "w-full h-9 justify-start text-left font-normal border-gray-300",
                  !dueDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                {dueDate ? (
                  format(dueDate, "MM/dd/yyyy")
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

        {/* Recipients [UPDATE] */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">
            Recipients
          </Label>

          <RecipientSelector
            projectId={release.projectId}
            initialOptions={initialRecipientOptions}
            onChange={(ids) => setRecipientIds(ids)}
            disabled={loading}
          />

          <p className="text-[10px] text-gray-400">
            You can search for project members or groups.
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">Notes</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="min-h-[100px] resize-none"
            placeholder="Add notes about this release..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          className="text-gray-600"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveChanges}
          disabled={loading}
          className="bg-[#005F9E] hover:bg-[#004B7D] text-white"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ReleaseEditView;
