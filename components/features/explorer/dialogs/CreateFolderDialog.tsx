"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  validateFolderName,
  MAX_FOLDER_NAME_LENGTH,
} from "@/lib/folderValidation";
import { AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }
    return error.message || "Request failed. Please try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  currentFolderName?: string;
  /** When true, cannot create a subfolder (max nesting depth reached). */
  nestingBlocked?: boolean;
}

const NESTING_ERROR_MESSAGE =
  "Maximum folder nesting depth (7 levels) has been reached.";

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  currentFolderName = "Explorer",
  nestingBlocked = false,
}: Props) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setFieldError(null);
    }
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFieldError(null);
    }
    onOpenChange(next);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (fieldError) setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (nestingBlocked) {
      setFieldError(NESTING_ERROR_MESSAGE);
      return;
    }

    const validation = validateFolderName(name);
    if (!validation.valid) {
      setFieldError(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(validation.trimmedName);
      setName("");
      handleOpenChange(false);
    } catch (error) {
      setFieldError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !nestingBlocked && !isSubmitting && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white gap-0">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-xl font-normal text-slate-900">
            Create Folder In {currentFolderName}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-normal">
            Please enter a name for the new folder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pt-6" noValidate>
          {nestingBlocked && (
            <p
              className="text-sm text-red-600 mb-3"
              role="alert"
              id="folder-nesting-error"
            >
              {NESTING_ERROR_MESSAGE}
            </p>
          )}

          <div className="space-y-1">
            <Label
              htmlFor="folder-name"
              className="text-slate-500 font-normal text-sm"
            >
              Name
            </Label>
            <Input
              id="folder-name"
              name="folderName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter Name"
              maxLength={MAX_FOLDER_NAME_LENGTH}
              disabled={nestingBlocked || isSubmitting}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "folder-name-error" : undefined}
              className="border-0 border-b border-slate-300 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-slate-800 placeholder:italic placeholder:text-slate-300 text-base"
              autoComplete="off"
            />
            <div className="flex justify-between items-start gap-2 min-h-[1.25rem] pt-1">
              {fieldError ? (
                <p
                  id="folder-name-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {fieldError}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                {name.length}/{MAX_FOLDER_NAME_LENGTH}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100 mt-6 mb-4" />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-700 hover:bg-transparent font-normal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#7da0b1] hover:bg-[#688a9a] text-white min-w-[100px] rounded-md"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
