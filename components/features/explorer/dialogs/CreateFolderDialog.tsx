"use client";

import { useState } from "react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  currentFolderName?: string;
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  currentFolderName = "Explorer",
}: Props) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name);
      setName("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white gap-0">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-xl font-normal text-slate-900">
            Create Folder In {currentFolderName}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-normal">
            Please enter a name for the new folder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pt-6">
          <div className="space-y-1">
            <Label
              htmlFor="name"
              className="text-slate-500 font-normal text-sm"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Name"
              className="border-0 border-b border-slate-300 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-slate-800 placeholder:italic placeholder:text-slate-300 text-base"
              autoComplete="off"
            />
          </div>

          <div className="h-px bg-slate-100 mt-8 mb-4" />

          {/* Custom Footer */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-700 hover:bg-transparent font-normal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
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
