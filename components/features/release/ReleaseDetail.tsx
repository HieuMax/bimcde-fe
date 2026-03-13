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
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";
import { FilePropertiesPanel } from "./FilePropertiesPanel";

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
  const [selectedItem, setSelectedItem] = useState<IReleaseItem | null>(null);
  const router = useRouter();

  const handleDownload = async () => {
    try {
      // Thực tế sẽ trigger download file zip
      await releaseService.downloadRelease(release._id);
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleDownloadItem = async () => {
    if (!selectedItem) return;
    try {
      await releaseService.downloadFile(
        selectedItem.fileId,
        selectedItem.version,
        selectedItem.name,
      );
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!confirm("Are you sure you want to remove this file from the release?"))
      return;

    try {
      await releaseService.removeFileFromRelease(
        release._id,
        selectedItem.fileId,
      );
      toast.success("File removed from release");
      setSelectedItem(null);
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

  const isPanelOpen = !!selectedItem;

  console.log(release);
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
              title="Download"
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
          <FilterButton label="Users" />
          <FilterButton label="Date modified" />
        </div>

        {/* Detail Table (Files List) */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent border-none border-b border-gray-200">
                <TableHead className="w-[40px]"></TableHead> {/* Icon Column */}
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
              {release.items.map((item, idx) => (
                <TableRow
                  key={idx}
                  className={`group hover:bg-gray-50 border-b border-gray-100 h-12 ${
                    selectedItem?.fileId === item.fileId ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
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
                          setSelectedItem(item);
                        }}
                        title="Properties"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
        <FilePropertiesPanel
          item={selectedItem}
          projectId={release.projectId}
          onClose={() => setSelectedItem(null)}
          onDownload={handleDownloadItem}
          onDelete={release.status === "DRAFT" ? handleDeleteItem : undefined}
        />
      </aside>
    </div>
  );
};
