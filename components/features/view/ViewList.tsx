"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { viewService } from "@/services/view.service";
import { IView } from "@/types/view";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Box,
  FileText,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Mock Filter Button component cho giống giao diện
const FilterButton = ({ label }: { label: string }) => (
  <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-700">
    {label}
    <span className="text-[10px]">▼</span>
  </div>
);

export const ViewList = () => {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  const [views, setViews] = useState<IView[]>([]);
  const [loading, setLoading] = useState(true);

  // State quản lý Tab (3D hoặc 2D)
  const [activeTab, setActiveTab] = useState<"3D" | "2D">("3D");

  const fetchViews = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API với filter type theo Tab hiện tại
      const data = await viewService.getViews(projectId, {
        type: activeTab,
      });
      setViews(data);
    } catch (error) {
      console.error("Failed to fetch views", error);
      toast.error("Failed to load views");
    } finally {
      setLoading(false);
    }
  }, [projectId, activeTab]);

  useEffect(() => {
    if (projectId) {
      fetchViews();
    }
  }, [fetchViews]);

  const handleDelete = async (view: IView) => {
    if (!confirm("Are you sure you want to delete this view?")) return;
    try {
      await viewService.deleteView(view._id);
      toast.success("View deleted");
      setViews(views.filter((v) => v._id !== view._id));
    } catch (error) {
      toast.error("Failed to delete view");
    }
  };

  const handleEdit = (view: IView) => {
    // Logic edit: Có thể mở modal edit (bạn cần giữ lại Modal nếu muốn sửa tên/mô tả)
    // Hoặc điều hướng tới trang Viewer để sửa
    toast.info("Edit functionality coming soon");
  };

  const handleViewClick = (view: IView) => {
    router.push(`/projects/${projectId}/viewer?viewId=${view._id}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Header & Tabs */}
      <div className="px-6 pt-6 pb-0 border-b border-gray-200">
        <h2 className="text-xl font-normal text-gray-800 mb-4">Views</h2>

        <Tabs
          defaultValue="3D"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "3D" | "2D")}
          className="w-full"
        >
          <TabsList className="bg-transparent p-0 h-auto space-x-6">
            <TabsTrigger
              value="3D"
              className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-[#005F9E] data-[state=active]:text-[#005F9E] data-[state=active]:shadow-none text-gray-500 font-medium"
            >
              3D Views
            </TabsTrigger>
            <TabsTrigger
              value="2D"
              className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-[#005F9E] data-[state=active]:text-[#005F9E] data-[state=active]:shadow-none text-gray-500 font-medium"
            >
              2D Views
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2. Filter Bar & Count */}
      <div className="px-6 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-50/50">
        <div className="flex gap-4">
          <FilterButton label="Owner" />
          <FilterButton label="Users" />
          <FilterButton label="Groups" />
          <FilterButton label="Date modified" />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {views.length} of {views.length}
        </div>
      </div>

      {/* 3. Table Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : views.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <p>No {activeTab} views found</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-none border-b border-gray-200">
                {/* Cột Name chứa cả Thumbnail */}
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[40%]">
                  Name
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[25%]">
                  Description
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[15%]">
                  Shared with me
                </TableHead>
                <TableHead className="text-gray-500 font-semibold text-xs h-10 w-[15%] cursor-pointer flex items-center gap-1">
                  Modified <span>↓</span>
                </TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {views.map((view) => (
                <TableRow
                  key={view._id}
                  className="group hover:bg-gray-50 border-b border-gray-100 h-16 cursor-pointer"
                  onClick={() => handleViewClick(view)}
                >
                  {/* Name & Thumbnail */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail Box */}
                      <div className="w-12 h-9 bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden rounded-[2px]">
                        {view.thumbnailUrl ? (
                          <img
                            src={view.thumbnailUrl}
                            alt="thumb"
                            className="w-full h-full object-cover"
                          />
                        ) : view.type === "3D" ? (
                          <Box className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        {view.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="text-gray-600 text-sm py-2">
                    {view.description || (
                      <span className="text-gray-400 italic">--</span>
                    )}
                  </TableCell>

                  {/* Shared with me */}
                  <TableCell className="text-gray-600 text-sm py-2">
                    {view.sharedWith?.isPublic ? "Public" : "--"}
                  </TableCell>

                  {/* Modified Date */}
                  <TableCell className="text-gray-600 text-sm py-2">
                    {format(new Date(view.updatedAt), "MMM dd, yyyy")}
                  </TableCell>

                  {/* Actions */}
                  <TableCell
                    className="py-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(view)}>
                          <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewClick(view)}>
                          <Box className="mr-2 h-4 w-4" /> Open in Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(view)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
