"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { httpClient } from "@/lib/http-client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { _id: string; name: string } | null;
}

type ShareType = "SPECIFIC" | "INTERNAL_LINK" | "PUBLIC_LINK";

export default function ShareFileDialog({ open, onOpenChange, file }: Props) {
  const [shareType, setShareType] = useState<ShareType>("PUBLIC_LINK");
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [accessLevel, setAccessLevel] = useState("VIEW");
  const [showLatest, setShowLatest] = useState(false);

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && emailInput.trim()) {
      e.preventDefault();
      if (!recipients.includes(emailInput.trim())) {
        setRecipients([...recipients, emailInput.trim()]);
      }
      setEmailInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  // Mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      return await httpClient.post("/files/share", {
        fileId: file?._id,
        type: shareType,
        recipients,
        note,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        accessLevel,
        showLatestVersion: showLatest,
        userId: "CURRENT_USER_ID",
      });
    },
    onSuccess: () => {
      toast.success("File shared successfully");
      onOpenChange(false);
      // Reset form
      setRecipients([]);
      setNote("");
    },
    onError: () => toast.error("Failed to share file"),
  });

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-xl font-semibold text-slate-800">
            Share data
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-4">
          {/* 1. Share With (Dropdown) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 font-normal">
              Share with
            </Label>
            <Select
              value={shareType}
              onValueChange={(val) => setShareType(val as ShareType)}
            >
              <SelectTrigger className="h-10 border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPECIFIC">
                  Specific members of the project
                </SelectItem>
                <SelectItem value="INTERNAL_LINK">
                  Signed in users with the link
                </SelectItem>
                <SelectItem value="PUBLIC_LINK">
                  Any users with the link
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. People (Email Input with Chips) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 font-normal">People</Label>
            <div className="border border-slate-300 rounded-md p-2 min-h-[80px] bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <div className="flex flex-wrap gap-2 mb-2">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="bg-slate-200 text-slate-700 text-sm px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="hover:text-slate-900 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                className="w-full outline-none text-sm text-slate-700 placeholder:text-slate-400 placeholder:italic"
                placeholder={
                  recipients.length > 0
                    ? ""
                    : "Please enter valid email address"
                }
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddRecipient}
              />
            </div>
          </div>

          {/* 3. Note */}
          {shareType !== "PUBLIC_LINK" && (
            <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-xs text-slate-500 font-normal">Note</Label>
              <Textarea
                placeholder="Add a message"
                className="resize-none h-20 text-sm border-slate-300"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          {/* 4. Link Options (Expire + Access) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expire Date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-normal">
                Link expires on (in UTC Time Zone)
              </Label>
              <Input
                type="date"
                className="text-sm border-slate-300"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            {/* Access Level */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-normal">
                Access
              </Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger className="h-10 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">View only</SelectItem>
                  <SelectItem value="DOWNLOAD">View & Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5. Show Latest Version Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="latest"
              checked={showLatest}
              onCheckedChange={(c) => setShowLatest(c as boolean)}
              className="border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label
              htmlFor="latest"
              className="text-sm text-slate-600 font-normal cursor-pointer"
            >
              Show latest version
            </Label>
          </div>

          {/* Note footer text */}
          {shareType === "SPECIFIC" && (
            <div className="border-t border-slate-200 pt-3 mt-2">
              <p className="text-xs text-slate-500">
                Note : Any access restrictions placed on the files are removed
                when the files are shared.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
          <Button
            className="bg-[#005F9E] hover:bg-[#004B7D] text-white min-w-[100px]"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Share"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
