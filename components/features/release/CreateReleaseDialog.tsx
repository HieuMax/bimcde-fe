import React, { useState } from "react";
import { CreateReleaseDTO } from "@/types/release";
import { Button } from "@/components/ui/button";
import { RecipientSelector } from "./RecipientSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  RELEASE_NAME_MAX_LENGTH,
  RELEASE_NOTE_MAX_LENGTH,
  dueDateToPayloadString,
  isDueDateInFuture,
  validateCreateReleaseInput,
  type CreateReleaseFieldErrors,
} from "@/lib/release/createReleaseValidation";
import { AxiosError } from "axios";

interface CreateReleaseDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateReleaseDialog: React.FC<CreateReleaseDialogProps> = ({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [showNote, setShowNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CreateReleaseFieldErrors>({});

  const resetForm = () => {
    setName("");
    setDueDate(undefined);
    setRecipientIds([]);
    setDescription("");
    setShowNote(false);
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      errors: nextErrors,
      name: safeName,
      dueIso,
      note,
    } = validateCreateReleaseInput({
      nameRaw: name,
      dueDate,
      noteRaw: description,
      noteEnabled: showNote,
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

      const payload: CreateReleaseDTO = {
        projectId,
        name: safeName,
        description: showNote && note ? note : undefined,
        dueDate: dueIso,
        items: [],
        recipients: recipientIds,
      };

      await releaseService.createRelease(payload);
      toast.success("Release created successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      const msg =
        (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Failed to create release";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white overflow-hidden rounded-md">
        <DialogHeader className="p-5 pb-2 flex flex-row items-center justify-between border-b-0 space-y-0">
          <DialogTitle className="text-xl font-medium text-gray-800">
            Create Release
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
          <div className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <Label
                htmlFor="name"
                className="text-sm font-normal text-gray-600"
              >
                Release name (required)
              </Label>
              <span className="text-xs text-gray-400 tabular-nums">
                {name.length}/{RELEASE_NAME_MAX_LENGTH}
              </span>
            </div>
            <Input
              id="name"
              value={name}
              maxLength={RELEASE_NAME_MAX_LENGTH}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={cn(
                "h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
                errors.name && "border-red-600 focus-visible:ring-red-600",
              )}
              placeholder="Enter release name"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-gray-600">
              Due date (required)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal border-gray-300",
                    !dueDate && "text-muted-foreground",
                    errors.dueDate && "border-red-600",
                  )}
                >
                  {dueDate ? (
                    format(dueDate, "MM/dd/yyyy")
                  ) : (
                    <span>mm/dd/yyyy</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            <Label className="text-sm font-normal text-gray-600">
              Recipients
            </Label>
            <RecipientSelector
              projectId={projectId}
              onChange={(ids) => setRecipientIds(ids)}
              initialOptions={[]}
            />
          </div>

          <div className="space-y-2 pt-2">
            {!showNote ? (
              <span
                role="button"
                tabIndex={0}
                onClick={() => setShowNote(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setShowNote(true);
                }}
                className="text-sm font-medium text-gray-500 cursor-pointer hover:text-[#005F9E] hover:underline"
              >
                Add a note
              </span>
            ) : (
              <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="description"
                    className="text-sm font-normal text-gray-600"
                  >
                    Note
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {description.length}/{RELEASE_NOTE_MAX_LENGTH}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setShowNote(false);
                        setDescription("");
                        setErrors((prev) => ({ ...prev, note: undefined }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setShowNote(false);
                          setDescription("");
                        }
                      }}
                      className="text-xs text-gray-400 cursor-pointer hover:text-red-500"
                    >
                      Remove
                    </span>
                  </div>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  maxLength={RELEASE_NOTE_MAX_LENGTH}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.note)
                      setErrors((prev) => ({ ...prev, note: undefined }));
                  }}
                  className={cn(
                    "min-h-[80px] border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
                    errors.note && "border-red-600",
                  )}
                  placeholder="Enter description..."
                />
                {errors.note && (
                  <p className="text-xs text-red-600">{errors.note}</p>
                )}
              </div>
            )}
            <div className="border-b border-gray-200 mt-4" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-normal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#005F9E] hover:bg-[#004B7D] text-white font-medium min-w-[80px] rounded-sm"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
