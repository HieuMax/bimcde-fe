import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, FileText, Loader2, X } from "lucide-react";
import { releaseService } from "@/services/release.service";
import { IRelease } from "@/types/release";
import { IFile, IFolder } from "@/types/explorer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  itemsToAdd: (IFile | IFolder)[]; // Danh sách các item (File/Folder) cần thêm
}

export const AddToReleaseDialog: React.FC<AddToReleaseDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  itemsToAdd,
}) => {
  const [releases, setReleases] = useState<IRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // State lưu các Release ID được tích chọn
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<Set<string>>(
    new Set()
  );

  // State đóng/mở phần xem chi tiết items
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // Chỉ lấy File, bỏ qua Folder (vì Schema Release hiện tại chỉ link tới File)
  // Nếu bạn muốn hỗ trợ Folder, cần logic đệ quy lấy file trong folder đó ở BE hoặc FE
  const filesToAdd = useMemo(
    () => itemsToAdd.filter((item): item is IFile => "mimeType" in item),
    [itemsToAdd]
  );

  // [NEW] Tính toán danh sách Release đã chứa file này rồi (để disable)
  const existingReleaseIds = useMemo(() => {
    const ids = new Set<string>();
    if (releases.length === 0 || filesToAdd.length === 0) return ids;

    const fileIdsToAdd = new Set(filesToAdd.map((f) => f._id));

    releases.forEach((release) => {
      // Kiểm tra xem Release này đã chứa file nào trong danh sách add chưa
      const hasFile = release.items.some((item) => {
        // item.fileId trả về từ API có thể là string ID
        const itemId =
          typeof item.fileId === "object"
            ? (item.fileId as any)._id
            : item.fileId;
        return fileIdsToAdd.has(itemId);
      });

      if (hasFile) {
        ids.add(release._id);
      }
    });
    return ids;
  }, [releases, filesToAdd]);

  useEffect(() => {
    if (open) {
      fetchDraftReleases();
      setSelectedReleaseIds(new Set());
      setIsItemsExpanded(false);
    }
  }, [open, projectId]);

  const fetchDraftReleases = async () => {
    try {
      setLoading(true);
      // Lấy tất cả release đang là DRAFT
      const data = await releaseService.getReleases({
        projectId,
        status: "DRAFT",
      });

      // Lọc tiếp ở FE: Chỉ lấy cái chưa hết hạn (Due Date >= Now hoặc không có Due Date)
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time để so sánh ngày

      const validReleases = data.filter((r) => {
        if (!r.dueDate) return true;
        return new Date(r.dueDate) >= now;
      });

      setReleases(validReleases);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load releases");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRelease = (id: string, isDisabled: boolean) => {
    if (isDisabled) return;
    const newSet = new Set(selectedReleaseIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReleaseIds(newSet);
  };

  const handleSave = async () => {
    if (selectedReleaseIds.size === 0) {
      toast.warning("Please select at least one release");
      return;
    }
    if (filesToAdd.length === 0) {
      toast.warning("No valid files to add (Folders are ignored)");
      return;
    }

    try {
      setProcessing(true);

      // Duyệt qua từng Release được chọn để update
      const updatePromises = Array.from(selectedReleaseIds).map(
        async (releaseId) => {
          // 1. Lấy thông tin chi tiết Release hiện tại để lấy danh sách items cũ
          const currentRelease = await releaseService.getReleaseById(releaseId);

          // 2. Tạo danh sách item mới từ filesToAdd
          const newItems = filesToAdd.map((f) => ({
            fileId: f._id,
            version: f.currentVersion, // Mặc định lấy version hiện tại
          }));

          // 3. Merge items cũ và mới (tránh trùng lặp fileId)
          // Tạo Map để unique theo fileId
          const itemMap = new Map();

          // Add cũ
          currentRelease.items.forEach((item: any) => {
            // item trong DB có thể là object populated hoặc struct {fileId, version...}
            // BE trả về item.fileId là string ID hoặc object file. Cần handle cẩn thận.
            const fId =
              typeof item.fileId === "string" ? item.fileId : item.fileId._id;
            itemMap.set(fId.toString(), {
              fileId: fId,
              version: item.version,
            });
          });

          // Add mới (Override nếu trùng, hoặc giữ cũ tùy logic. Ở đây ta override version mới nhất)
          newItems.forEach((item) => {
            itemMap.set(item.fileId.toString(), item);
          });

          const mergedItems = Array.from(itemMap.values());

          // 4. Gọi API Update
          return releaseService.updateRelease(releaseId, {
            name: currentRelease.name, // Giữ nguyên tên
            items: mergedItems,
          });
        }
      );

      await Promise.all(updatePromises);

      toast.success(
        `Added ${filesToAdd.length} files to ${selectedReleaseIds.size} releases`
      );
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add items to release");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b space-y-0">
          <DialogTitle className="text-xl font-medium text-gray-800">
            Add to Release
          </DialogTitle>
          {/* Nút X đóng dialog, dùng absolute hoặc custom */}
        </DialogHeader>

        {/* Tabs & Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="existing" className="w-full flex flex-col h-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-b rounded-none h-auto p-0">
                <TabsTrigger
                  value="new"
                  disabled
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#005F9E] data-[state=active]:text-[#005F9E] data-[state=active]:shadow-none py-2 text-gray-500 font-normal"
                >
                  Create new Release
                </TabsTrigger>
                <TabsTrigger
                  value="existing"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#005F9E] data-[state=active]:text-[#005F9E] data-[state=active]:shadow-none py-2 text-gray-500 font-normal"
                >
                  Add to existing Release
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="existing"
              className="flex-1 overflow-hidden flex flex-col mt-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="flex-1">
                <div className="px-6 py-4 space-y-1">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : releases.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No active draft releases found.
                    </p>
                  ) : (
                    releases.map((release) => {
                      const isExisting = existingReleaseIds.has(release._id);
                      const isSelected = selectedReleaseIds.has(release._id);

                      return (
                        <div
                          key={release._id}
                          className={cn(
                            "flex items-center space-x-3 py-3 px-2 rounded cursor-pointer group transition-colors",
                            isExisting
                              ? "opacity-60 cursor-not-allowed bg-gray-50"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() =>
                            handleToggleRelease(release._id, isExisting)
                          }
                        >
                          <Checkbox
                            id={release._id}
                            // Checked nếu user chọn HOẶC đã có sẵn trong release
                            checked={isSelected || isExisting}
                            // Disabled nếu đã có sẵn
                            disabled={isExisting}
                            onCheckedChange={() =>
                              handleToggleRelease(release._id, isExisting)
                            }
                            className="border-gray-400 data-[state=checked]:bg-[#005F9E] data-[state=checked]:border-[#005F9E]"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#72A544]" />
                            <label
                              htmlFor={release._id}
                              className={cn(
                                "text-sm font-normal text-gray-700 select-none flex-1 truncate",
                                !isExisting &&
                                  "cursor-pointer group-hover:text-gray-900"
                              )}
                            >
                              {release.name}
                              {/* Optional: Hiển thị thêm text báo đã tồn tại */}
                              {isExisting && (
                                <span className="ml-2 text-xs text-gray-400 italic">
                                  (Item already added)
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Selected Items Accordion */}
        <div className="bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <span>Selected items ({filesToAdd.length})</span>
            {isItemsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>

          {isItemsExpanded && (
            <div className="px-6 pb-3 max-h-[150px] overflow-y-auto border-t border-gray-200 bg-white">
              {filesToAdd.map((file) => (
                <div
                  key={file._id}
                  className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                </div>
              ))}
              {filesToAdd.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">
                  No files selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-normal"
            disabled={processing}
          >
            Cancel
          </Button>
          {/* User yêu cầu bỏ nút Send Release, chỉ giữ Save */}
          <Button
            onClick={handleSave}
            disabled={processing}
            className="bg-[#005F9E] hover:bg-[#004B7D] text-white font-medium min-w-[80px] rounded-sm"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
