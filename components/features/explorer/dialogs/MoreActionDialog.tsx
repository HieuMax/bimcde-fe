// components/features/explorer/dialogs/MoreActionsDialog.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  CheckCircle2,
  Activity,
  Tags,
  Lock,
  Share2,
} from "lucide-react";
import { IFile, IFolder } from "@/types/explorer";
import ShareFileDialog from "./ShareFileDialog";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IFile | IFolder | null;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  currentUserId: string;
  onOpenActivity?: () => void;
}

export default function MoreActionsDialog({
  open,
  onOpenChange,
  item,
  onToggleLock,
  currentUserId,
  onOpenActivity,
}: Props) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!item) return null;

  const isFile = "mimeType" in item;
  const isLocked = isFile && (item as IFile).isLocked;
  const lockedByMe =
    isFile && (item as IFile).lockedBy?.toString() === currentUserId;

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Actions for {item.name}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            {/* 1. CHECK-OUT (LOCK) */}
            {(!isFile || !isLocked) && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-12"
                onClick={() => handleAction(() => onToggleLock("LOCK"))}
              >
                <LogOut className="h-4 w-4 text-orange-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {isFile ? "Checkout (Lock)" : "Checkout all files"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Prevent others from editing
                  </span>
                </div>
              </Button>
            )}

            {/* 2. CHECK-IN (UNLOCK) */}
            {(!isFile || (isLocked && lockedByMe)) && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-12"
                onClick={() => handleAction(() => onToggleLock("UNLOCK"))}
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {isFile ? "Checkin (Unlock)" : "Checkin all files"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Release file for others
                  </span>
                </div>
              </Button>
            )}

            {/* Case */}
            {isFile && isLocked && !lockedByMe && (
              <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-md border border-red-100">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Locked by another user</span>
              </div>
            )}

            <Button
              variant="ghost"
              className="justify-start gap-3 h-10"
              onClick={() =>
                handleAction(() => onOpenActivity?.())
              }
            >
              <Activity className="h-4 w-4" />
              See activity
            </Button>

            {/* 4. TAGS (Placeholder) */}
            <Button
              variant="ghost"
              className="justify-start gap-3 h-10"
              disabled
            >
              <Tags className="h-4 w-4" />
              Add tags
            </Button>

            {isFile && (
              <Button
                variant="ghost"
                className="justify-start h-auto py-3 px-4 hover:bg-slate-50"
                onClick={() => setIsShareOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                    <Share2 size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Share</div>
                    <div className="text-xs text-slate-500">
                      Share file with others via link or email
                    </div>
                  </div>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Render Share Dialog */}
      {isShareOpen && isFile && (
        <ShareFileDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          file={item}
        />
      )}
    </>
  );
}
