"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { explorerService } from "@/services/explorer.service";
import PublishReadinessChecklist from "./PublishReadinessChecklist";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  /** Called after the user confirms publish (checklist all green). */
  onConfirm: () => void;
}

export default function PublishToPublishedModal({
  open,
  onOpenChange,
  fileId,
  onConfirm,
}: Props) {
  const { data: readiness, isLoading, isError } = useQuery({
    queryKey: ["file-publish-readiness", fileId],
    queryFn: () => explorerService.getFilePublishReadiness(fileId),
    enabled: open && !!fileId,
  });

  const canConfirm = readiness?.canPublish === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="p-6 pb-3 space-y-2">
          <DialogTitle className="text-left">Pre-publish checks</DialogTitle>
          <p className="text-sm text-muted-foreground text-left font-normal leading-relaxed">
            When an administrator publishes, the following must be satisfied:
          </p>
        </DialogHeader>
        <div className="px-6 pb-4">
          <PublishReadinessChecklist
            data={readiness}
            isLoading={isLoading}
            isError={isError}
            variant="modal"
          />
        </div>
        <DialogFooter className="flex-row justify-end gap-2 p-6 pt-2 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-amber-700 hover:bg-amber-800 text-white"
            disabled={isLoading || isError || !canConfirm}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
