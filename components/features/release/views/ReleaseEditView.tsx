"use client";

import React, { useState } from "react";
import { IRelease, UpdateReleaseDTO } from "@/types/release";
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
import {
  RELEASE_NAME_MAX_LENGTH,
  RELEASE_NOTE_MAX_LENGTH,
  dueDateToPayloadString,
  isDueDateInFuture,
  validateCreateReleaseInput,
  type CreateReleaseFieldErrors,
} from "@/lib/release/createReleaseValidation";
import { AxiosError } from "axios";

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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CreateReleaseFieldErrors>({});

  const handleSaveChanges = async () => {
    const {
      errors: nextErrors,
      name: safeName,
      dueIso,
      note,
    } = validateCreateReleaseInput({
      nameRaw: name,
      dueDate,
      noteRaw: description,
      noteEnabled: true,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name) toast.error(nextErrors.name);
      else if (nextErrors.dueDate) toast.error(nextErrors.dueDate);
      else if (nextErrors.note) toast.error(nextErrors.note);
      return;
    }

    try {
      setLoading(true);

      const payload: UpdateReleaseDTO = {
        name: safeName,
        dueDate: dueIso,
        description: note.length > 0 ? note : "",
      };

      await releaseService.updateRelease(release._id, payload);

      toast.success("Release updated successfully");
      await onSave(safeName);
    } catch (error) {
      console.error(error);
      const msg =
        (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Failed to update release";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
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

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2">
            <Label className="text-xs font-medium text-gray-500">
              Name <span className="text-red-500">*</span>
            </Label>
            <span className="text-xs text-gray-400 tabular-nums">
              {name.length}/{RELEASE_NAME_MAX_LENGTH}
            </span>
          </div>
          <Input
            value={name}
            maxLength={RELEASE_NAME_MAX_LENGTH}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            disabled={loading}
            className={cn(
              "h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
              errors.name && "border-red-600 focus-visible:ring-red-600",
            )}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
          <p className="text-[10px] text-gray-400">
            Angle brackets and script-like tags are removed on save.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">
            Due date <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                disabled={loading}
                className={cn(
                  "w-full h-9 justify-start text-left font-normal border-gray-300",
                  !dueDate && "text-muted-foreground",
                  errors.dueDate && "border-red-600",
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
                onSelect={(date) => {
                  setDueDate(date);
                  if (errors.dueDate)
                    setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
                disabled={(date) =>
                  !isDueDateInFuture(dueDateToPayloadString(date))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.dueDate && (
            <p className="text-xs text-red-600 mt-1">{errors.dueDate}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between gap-2">
            <Label className="text-xs font-medium text-gray-500">
              Notes
            </Label>
            <span className="text-xs text-gray-400 tabular-nums">
              {description.length}/{RELEASE_NOTE_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            value={description}
            maxLength={RELEASE_NOTE_MAX_LENGTH}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.note)
                setErrors((prev) => ({ ...prev, note: undefined }));
            }}
            disabled={loading}
            className={cn(
              "min-h-[100px] resize-none border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
              errors.note && "border-red-600",
            )}
            placeholder="Plain text only; HTML-like content is stripped on save."
          />
          {errors.note && (
            <p className="text-xs text-red-600">{errors.note}</p>
          )}
        </div>
      </div>

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
