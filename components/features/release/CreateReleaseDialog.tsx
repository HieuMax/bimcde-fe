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
import { CalendarIcon, Loader2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  // Form State
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // UI State
  const [showNote, setShowNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; dueDate?: boolean }>(
    {}
  );

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

    // Validation Logic
    const newErrors = {
      name: !name.trim(),
      dueDate: !dueDate,
    };
    setErrors(newErrors);

    if (newErrors.name || newErrors.dueDate) {
      return; // Stop if invalid
    }

    try {
      setLoading(true);

      const payload: CreateReleaseDTO = {
        projectId,
        name,
        description,
        dueDate: dueDate,
        items: [],
        recipients: recipientIds,
      };

      await releaseService.createRelease(payload);
      toast.success("Release created successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create release");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white overflow-hidden rounded-md">
        {/* HEADER */}
        <DialogHeader className="p-5 pb-2 flex flex-row items-center justify-between border-b-0 space-y-0">
          <DialogTitle className="text-xl font-medium text-gray-800">
            Create Release
          </DialogTitle>
          {/* Nút X đóng dialog, override mặc định của shadcn để giống ảnh */}
          {/* <DialogClose /> thường có sẵn, nhưng ta custom để control tốt hơn */}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
          {/* Release Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-normal text-gray-600">
              Release Name (required)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value)
                  setErrors((prev) => ({ ...prev, name: false }));
              }}
              className={cn(
                "h-9 border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]",
                errors.name && "border-red-600 focus-visible:ring-red-600"
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">
                This field is required.
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-gray-600">
              Due date (required)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal border-gray-300",
                    !dueDate && "text-muted-foreground",
                    errors.dueDate && "border-red-600"
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
                    if (date)
                      setErrors((prev) => ({ ...prev, dueDate: false }));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && (
              <p className="text-xs text-red-600 mt-1">
                This field is required.
              </p>
            )}
          </div>

          {/* Recipients */}
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

          {/* Note Section (Toggle) */}
          <div className="space-y-2 pt-2">
            {!showNote ? (
              <span
                onClick={() => setShowNote(true)}
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
                  <span
                    onClick={() => {
                      setShowNote(false);
                      setDescription("");
                    }}
                    className="text-xs text-gray-400 cursor-pointer hover:text-red-500"
                  >
                    Remove
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] border-gray-300 focus-visible:ring-1 focus-visible:ring-[#005F9E]"
                  placeholder="Enter description..."
                />
              </div>
            )}
            {/* Divider line like in image */}
            <div className="border-b border-gray-200 mt-4"></div>
          </div>

          {/* Footer Buttons */}
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
