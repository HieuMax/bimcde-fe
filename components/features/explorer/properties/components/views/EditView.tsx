"use client";

import { useState } from "react";
import { ArrowLeft, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { IFile, IFolder } from "@/types/explorer";

interface Props {
  item: IFile | IFolder;
  onBack: () => void;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

export default function EditView({ item, onBack, onClose, onSave }: Props) {
  const isFile = "mimeType" in item;

  const getNameWithoutExt = (fullName: string) => {
    if (!isFile) return fullName;
    const lastDotIndex = fullName.lastIndexOf(".");
    return lastDotIndex > 0 ? fullName.substring(0, lastDotIndex) : fullName;
  };

  const [name, setName] = useState(getNameWithoutExt(item.name));
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || name === getNameWithoutExt(item.name)) {
      onBack();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(name);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header: Back + Title + Close */}
      <div className="flex items-center justify-between p-4 border-b border-border h-[70px] shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-2 text-foreground hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Edit</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Body: Form Inputs */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-normal text-slate-500"
            >
              Name {isFile ? "(extension hidden)" : ""}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base text-slate-900 border-slate-300 focus-visible:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>

          {/* Tags Field (Placeholder) */}
          <div className="space-y-2">
            <Label
              htmlFor="tags"
              className="text-sm font-normal text-slate-500"
            >
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Begin typing to search..."
              className="text-base text-slate-900 border-slate-300 focus-visible:ring-blue-500 italic placeholder:text-slate-400"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer: Action Buttons */}
      <div className="p-4 border-t border-border bg-white flex justify-end gap-3 shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-[#6fa3b9] hover:bg-[#5d8a9e] text-white min-w-20"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
