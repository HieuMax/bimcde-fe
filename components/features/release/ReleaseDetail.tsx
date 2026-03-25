import React, { useState } from "react";
import { IRelease, IReleaseItem } from "@/types/release";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";
import { FilePropertiesPanel } from "./FilePropertiesPanel";
import { FileBulkPanel } from "./FileBulkPanel";
import { UserFilter } from "@/components/features/activity/UserFilter";
import { DateFilter } from "@/components/features/activity/DateFilter";

interface ReleaseDetailProps {
  release: IRelease;
  onBack: () => void;
  onRefresh?: () => void;
}

// Helper format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const FilterButton = ({ label }: { label: string }) => (
  <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-700">
    {label}
    <span className="text-[10px]">▼</span>
  </div>
);

export const ReleaseDetail: React.FC<ReleaseDetailProps> = ({
  release,
  onBack,
  onRefresh,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({});
  const router = useRouter();

  // --- FILTER LOGIC ---
  const filteredItems = React.useMemo(() => {
    return release.items.filter((item) => {
      // 1. User Filter
      if (userFilter.length > 0) {
        // Cần đảm bảo item.modifiedById khớp với userFilter
        // Lưu ý: Nếu item cũ chưa có modifiedById thì có thể bỏ qua hoặc xử lý riêng
        if (!item.modifiedById || !userFilter.includes(item.modifiedById)) {
          return false;
        }
      }

      // 2. Date Filter
      if (dateFilter.startDate || dateFilter.endDate) {
        const itemDate = new Date(item.updatedAt);
        if (dateFilter.startDate && itemDate < dateFilter.startDate) return false;
        // endDate thường là cuối ngày, nên so sánh <=
        if (dateFilter.endDate && itemDate > dateFilter.endDate) return false;
      }

      return true;
    });
  }, [release.items, userFilter, dateFilter]);

  const handleDownload = async () => {
    try {
      // Thực tế sẽ trigger download file zip
      await releaseService.downloadRelease(release._id);
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleDownloadFile = async (
    e: React.MouseEvent,
    item: IReleaseItem,
  ) => {
    e.stopPropagation();
    try {
      await releaseService.downloadFile(item.fileId, item.version, item.name);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download file");
    }
  };

  // --- SELECTION LOGIC ---
  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (
      selectedIds.size === filteredItems.length &&
      filteredItems.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((r) => r.fileId)));
    }
  };

  const handleRowClick = (id: string) => {
    if (selectedIds.has(id) && selectedIds.size === 1) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };
  
  const handleDeselectItem = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  // Derived state for panel
  const selectedCount = selectedIds.size;
  const isPanelOpen = selectedCount > 0;

  // Get selected objects
  // Note: selectedIds might contain ids not in filteredItems if user filtered after selection
  // But usually selection should persist or clear. Let's keep existing logic but filter from ALL items to get details
  const selectedItems = release.items.filter((r) => selectedIds.has(r.fileId));
  const singleItem = selectedCount === 1 ? selectedItems[0] : null;

  const handleDownloadItem = async () => {
    if (!singleItem) return;
    try {
      await releaseService.downloadFile(
        singleItem.fileId,
        singleItem.version,
        singleItem.name,
      );
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleBulkDownload = async () => {
    // Bulk download currently just downloads the whole release or we can loop download individual files?
    // User requested "Download" function in Bulk Panel.
    // Usually bulk download means zip selected.
    // Since backend downloadRelease zips ALL files, let's just warn or implement a new partial download if needed.
    // For now, let's assume we can loop download or trigger release download if all selected.
    
    // If all selected, download release
    if (selectedCount === release.items.length) {
      await handleDownload();
      return;
    }
    
    // If partial, maybe warn or download one by one (bad UX)
    // Or we can implement a bulk download endpoint.
    // Given the context, let's just say "Download started for selected files" and maybe just download the release zip for now or alert.
    // The user said "Vẫn sẽ có chức năng download".
    // Let's loop download for now as it's simplest without new BE endpoint for partial zip.
    toast.info("Downloading selected files...");
    for (const item of selectedItems) {
       await releaseService.downloadFile(item.fileId, item.version, item.name);
    }
  };

  const handleDeleteItem = async () => {
    if (!singleItem) return;
    if (!confirm("Are you sure you want to remove this file from the release?"))
      return;

    try {
      await releaseService.removeFileFromRelease(
        release._id,
        singleItem.fileId,
      );
      toast.success("File removed from release");
      handleClearSelection();
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to remove file");
      console.error(error);
    }
  };
  
  const handleBulkRemove = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedCount} files from the release?`)) return;
    
    try {
      const fileIds = Array.from(selectedIds);
      await releaseService.removeFilesFromRelease(release._id, fileIds);
      toast.success(`${selectedCount} files removed from release`);
      handleClearSelection();
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
       toast.error("Failed to remove files");
       console.error(error);
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-white">
      {/* LEFT MAIN CONTENT */}
      <div
        className={`flex flex-col h-full flex-1 transition-all duration-300 ${
          isPanelOpen ? "mr-0 sm:mr-[320px]" : "mr-0"
        }`}
      >
        {/* Breadcrumb Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 text-xl text-gray-800">
            <span
              className="text-gray-500 hover:text-[#005F9E] cursor-pointer"
              onClick={onBack}
            >
              Releases
            </span>
            <span className="text-gray-400">›</span>
            <span className="font-normal">{release.name}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download Release"
            >
              <Download className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" title="Export Excel">
              <FileSpreadsheet className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 flex gap-4 border-b border-gray-200 bg-gray-50/50">
          <FilterButton label="Data type" />
          <UserFilter
            projectId={release.projectId}
            selectedUserIds={userFilter}
            onChange={setUserFilter}
          />
          <DateFilter onFilterChange={setDateFilter} />
        </div>

        {/* Detail Table (Files List) */}
        <div
          className="flex-1 overflow-auto px-6 py-4"
          onClick={() => handleClearSelection()}
        >
          <Table onClick={(e) => e.stopPropagation()}>
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent border-none border-b border-gray-200">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      selectedIds.size === filteredItems.length &&
                      filteredItems.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead> {/* Icon Column */}
                <TableHead className="text-gray-500 font-semibold text-xs h-10">
                  Name
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[100px]">
                  Version
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[120px]">
                  Size
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10">
                  Modified by
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10">
                  Date modified
                </TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, idx) => {
                const isSelected = selectedIds.has(item.fileId);
                return (
                  <TableRow
                    key={item.fileId}
                    className={`group cursor-pointer border-b border-gray-100 h-14 ${
                      isSelected
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleRowClick(item.fileId)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(item.fileId)}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow-sm">
                        {/* Icon giả định là PDF cho giống ảnh, thực tế check item type */}
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 py-2">
                      <Link
                        href={`/projects/6963fab7de281e63da904093/viewer/${item.fileId}`}
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
                        className="hover:underline hover:text-blue-600"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600 py-2">
                      {item.version}
                    </TableCell>
                    <TableCell className="text-gray-600 py-2">
                      {formatBytes(item.size)}
                    </TableCell>
                    <TableCell className="text-gray-600 py-2">
                      {item.modifiedBy}
                    </TableCell>
                    <TableCell className="text-gray-600 py-2">
                      {item.updatedAt
                        ? format(new Date(item.updatedAt), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logic cho info button nếu cần, hiện tại row click đã mở panel
                            handleRowClick(item.fileId);
                          }}
                          title="Properties"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleDownloadFile(e, item)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* RIGHT PANEL (PROPERTIES) */}
      <aside
        className={`
          bg-white shadow-lg border-l z-20 flex flex-col
          fixed inset-0 w-full h-full
          transition-opacity duration-200
          ${
            isPanelOpen
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none"
          }
          sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-[320px] 
          sm:opacity-100 sm:visible sm:pointer-events-auto
          sm:transition-transform sm:duration-300
          ${isPanelOpen ? "sm:translate-x-0" : "sm:translate-x-full"}
        `}
      >
        {selectedCount === 1 && singleItem ? (
          <FilePropertiesPanel
            item={singleItem}
            projectId={release.projectId}
            onClose={handleClearSelection}
            onDownload={handleDownloadItem}
            onDelete={release.status === "DRAFT" ? handleDeleteItem : undefined}
          />
        ) : selectedCount > 1 ? (
          <FileBulkPanel
             selectedItems={selectedItems}
             releaseStatus={release.status}
             onClose={handleClearSelection}
             onDeselect={handleDeselectItem}
             onDownload={handleBulkDownload}
             onRemove={handleBulkRemove}
          />
        ) : null}
      </aside>
    </div>
  );
};

