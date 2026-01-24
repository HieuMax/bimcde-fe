import React from "react";
import { IRelease } from "@/types/release";
import { Button } from "@/components/ui/button";
import { X, Download, Send, File as FileIcon, User } from "lucide-react";
import { ReleaseStatusBadge } from "./ReleaseStatusBadge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";

interface ReleaseDetailPanelProps {
  release: IRelease | null;
  onClose: () => void;
  onUpdate: () => void; // Trigger refresh
}

export const ReleaseDetailPanel: React.FC<ReleaseDetailPanelProps> = ({
  release,
  onClose,
  onUpdate,
}) => {
  if (!release) return null;

  const handleSend = async () => {
    try {
      await releaseService.sendRelease(release._id);
      toast.success("Release sent successfully");
      onUpdate();
      onClose(); // Or just refresh
    } catch (error) {
      console.error(error);
      toast.error("Failed to send release");
    }
  };

  const handleDownload = async () => {
      try {
          await releaseService.downloadRelease(release._id);
          toast.info("Download started (Mock)");
      } catch (error) {
          console.error(error);
          toast.error("Failed to download");
      }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Release Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Name</h4>
            <p className="text-base font-medium text-gray-900 mt-1">{release.name}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <div className="mt-1">
              <ReleaseStatusBadge status={release.status} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="text-sm text-gray-700 mt-1">
              {release.description || "No description"}
            </p>
          </div>

          <div>
             <h4 className="text-sm font-medium text-gray-500">Created By</h4>
             <p className="text-sm text-gray-700 mt-1">
                 {/* Assuming createdBy is an ID, ideally we resolve this to a name */}
                 User {release.createdBy.slice(0, 8)}...
             </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Created At</h4>
            <p className="text-sm text-gray-700 mt-1">
              {release.createdAt ? format(new Date(release.createdAt), "PPpp") : "-"}
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <FileIcon className="h-4 w-4" />
                Items ({release.items.length})
            </h4>
            <div className="bg-gray-50 rounded-md border border-gray-100 divide-y divide-gray-100">
              {release.items.length === 0 ? (
                <p className="p-3 text-sm text-gray-400 text-center">No items</p>
              ) : (
                release.items.map((item, index) => (
                  <div key={index} className="p-2 text-sm flex justify-between items-center">
                    <span className="truncate flex-1" title={item.name}>{item.name}</span>
                    <span className="text-xs text-gray-500 ml-2">v{item.version}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipients ({release.recipients?.length || 0})
            </h4>
            {/* List recipients here if needed */}
             <div className="bg-gray-50 rounded-md border border-gray-100 p-2">
                {release.recipients && release.recipients.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        {release.recipients.map(r => <li key={r}>{r.slice(0, 8)}...</li>)}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400">No recipients</p>
                )}
             </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
        {release.status === "DRAFT" && (
           <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
             <Send className="mr-2 h-4 w-4" /> Send Release
           </Button>
        )}
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
    </div>
  );
};
