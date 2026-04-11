"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { viewService } from "@/services/view.service";
import { viewService3D } from "@/services/view3d.service";
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
import { UserFilter } from "../activity/UserFilter";
import { GroupFilter } from "../activity/GroupFilter";
import { DateFilter } from "../activity/DateFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewPropertiesPanel } from "./properties/ViewPropertiesPanel";
import { ViewBulkPanel } from "./properties/ViewBulkPanel";

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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [views, setViews] = useState<IView[]>([]);
  const [loading, setLoading] = useState(true);

  // State quản lý Tab (3D hoặc 2D) - init from URL
  const initialTab = (searchParams.get("type") as "3D" | "2D") || "3D";
  const [activeTab, setActiveTab] = useState<"3D" | "2D">(initialTab);

  // Filter States
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editIntent, setEditIntent] = useState(false);

  const handleTabChange = (val: "3D" | "2D") => {
    setActiveTab(val);
    // Keep filters when switching tabs so they apply consistently.
    // Reset selection/edit state to avoid stale panel state.
    setSelectedIds(new Set());
    setEditIntent(false);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("type", val);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const fetchViews = useCallback(async () => {
    try {
      setLoading(true);
      let data: IView[] = [];

      const filterParams = {
        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      if (activeTab === "3D") {
        const res = await viewService3D.getAll(projectId, filterParams);
        // Map data from view3d service to IView interface
        data = res.map((v: any) => ({
          _id: v._id,
          projectId: v.projectId,
          name: v.title, // Map title to name
          description: v.description,
          thumbnailUrl: v.viewState?.thumbnail,
          type: "3D",
          createdBy: v.createdBy,
          sharedWith: {
            isPublic: false,
            users: v.shareWith || [],
          },
          tags: Array.isArray(v.tags) ? v.tags : [],
          viewState: v.viewState,
          // Keep original items so we can open correct 3D context
          items: v.items || [],
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        })) as IView[];
      } else {
        // Gọi API với filter type theo Tab hiện tại (cho 2D)
        data = await viewService.getViews(projectId, {
          type: activeTab,
          ...filterParams
        });
      }
      
      setViews(data);
    } catch (error) {
      console.error("Failed to fetch views", error);
      toast.error("Failed to load views");
    } finally {
      setLoading(false);
    }
  }, [projectId, activeTab, selectedUserIds, selectedGroupIds, dateRange]);

  useEffect(() => {
    if (projectId) {
      fetchViews();
    }
  }, [fetchViews]);

  // --- SELECTION HANDLERS ---
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
    if (selectedIds.size === views.length && views.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(views.map((v) => v._id)));
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
    setEditIntent(false);
  };

  const handleDeselectItem = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  // --- ACTIONS ---
  const handleDelete = async (view: IView) => {
    if (!confirm("Are you sure you want to delete this view?")) return;
    try {
      if (view.type === "3D") {
         await viewService3D.delete(view._id);
      } else {
         await viewService.deleteView(view._id);
      }
      toast.success("View deleted");
      
      // Update local state
      setViews(views.filter((v) => v._id !== view._id));
      
      // Remove from selection if it was selected
      if (selectedIds.has(view._id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(view._id);
        setSelectedIds(newSet);
      }
    } catch (error) {
      toast.error("Failed to delete view");
    }
  };

  const handleBulkDelete = async (selectedViews: IView[]) => {
      if (!confirm(`Are you sure you want to delete ${selectedViews.length} views?`)) return;
      
      try {
          // Promise.all to delete concurrently
          await Promise.all(selectedViews.map(async (view) => {
             if (view.type === "3D") {
                await viewService3D.delete(view._id);
             } else {
                await viewService.deleteView(view._id);
             }
          }));

          toast.success("Views deleted");
          setViews(views.filter(v => !selectedIds.has(v._id)));
          handleClearSelection();
      } catch (error) {
          toast.error("Failed to delete some views");
          // Refresh to sync state
          fetchViews();
      }
  };

  const handleViewUpdate = async (
    view: IView,
    payload: { name: string; description: string; tagIds: string[] },
  ) => {
    if (view.type === "3D") {
      const res = await viewService3D.updateInfo(view._id, {
        title: payload.name,
        description: payload.description || undefined,
        tags: payload.tagIds,
      });
      setViews((prev) =>
        prev.map((v) =>
          v._id === view._id
            ? {
                ...v,
                name: res.title,
                description: res.description ?? "",
                tags: Array.isArray(res.tags) ? res.tags : [],
                updatedAt: res.updatedAt,
              }
            : v,
        ),
      );
      return;
    }

    const res = (await viewService.updateView(view._id, {
      name: payload.name,
      description: payload.description,
      tags: payload.tagIds,
    })) as IView;

    setViews((prev) =>
      prev.map((v) =>
        v._id === view._id
          ? {
              ...v,
              name: res.name,
              description: res.description ?? "",
              tags: res.tags ?? [],
              updatedAt: res.updatedAt,
            }
          : v,
      ),
    );
  };

  const handleEdit = (view: IView) => {
    setSelectedIds(new Set([view._id]));
    setEditIntent(true);
  };

  /**
   * Open a saved 3D view from Data → Views: same contract as ViewerClient.switchContextAndReload
   * and explorer IFC open (viewer3d?urls=encodeURIComponent(JSON.stringify([...]))).
   * Backend exposes GET /views3d?projectId=… only (no GET by id); list rows already include items + viewState.
   */
  const handleViewClick = (view: IView) => {
    if (view.type === "3D") {
      const row = view as IView & {
        items?: { fileUrl?: string; modelId?: string; expressId?: string[] }[];
      };
      const items = row.items ?? [];

      const targetUrls = Array.from(
        new Set(
          items
            .map((i) => i?.fileUrl)
            .filter(Boolean) as string[],
        ),
      );

      if (targetUrls.length === 0) {
        toast.error("This 3D view has no model context (missing file URLs).");
        return;
      }

      if (!view.viewState) {
        toast.error("This 3D view has no saved camera/state.");
        return;
      }

      const todoForViewer = {
        _id: view._id,
        title: view.name,
        projectId: view.projectId,
        items,
        viewState: view.viewState,
        createdBy: view.createdBy,
      };

      const pendingKey = `bimcde_pending_todo_${projectId}`;
      const clashKey = `bimcde_pending_clash_${projectId}`;
      sessionStorage.removeItem(clashKey);
      sessionStorage.removeItem(pendingKey);
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({
          todo: todoForViewer,
          mode: "view",
          type: "view",
        }),
      );

      const newUrlsParams = JSON.stringify(targetUrls);
      window.location.href = `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(
        newUrlsParams,
      )}`;
    } else {
      router.push(`/projects/${projectId}/viewer/${view._id}`);
    }
  };

  // Derived State for Panels
  const selectedCount = selectedIds.size;
  const isPanelOpen = selectedCount > 0;
  const selectedViews = views.filter(v => selectedIds.has(v._id));
  const singleView = selectedCount === 1 ? selectedViews[0] : null;

  return (
    <div className="flex min-h-[93.9vh] relative overflow-hidden bg-white">
      {/* MAIN CONTENT */}
      <div
        className={`flex flex-col h-full flex-1 transition-all duration-300 ${
          isPanelOpen ? "mr-0 sm:mr-80" : "mr-0"
        }`}
      >
      {/* 1. Header & Tabs */}
      <div className="px-6 pt-6 pb-0 border-b border-gray-200">
        <h2 className="text-xl font-normal text-gray-800 mb-4">Views</h2>

        <Tabs
          defaultValue="3D"
          value={activeTab}
          onValueChange={(val) => handleTabChange(val as "3D" | "2D")}
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
        <div className="flex gap-1 items-center">
          <FilterButton label="Owner" />
          
          <span className="text-gray-300 mx-2">|</span>
          
          <UserFilter 
            projectId={projectId}
            selectedUserIds={selectedUserIds}
            onChange={setSelectedUserIds}
          />

          <span className="text-gray-300 mx-2">|</span>

          <GroupFilter 
             projectId={projectId}
             selectedGroupIds={selectedGroupIds}
             onChange={setSelectedGroupIds}
          />

          <span className="text-gray-300 mx-2">|</span>

          <DateFilter 
            onFilterChange={(range) => setDateRange({
              startDate: range.startDate?.toISOString(),
              endDate: range.endDate?.toISOString()
            })}
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {views.length} of {views.length}
        </div>
      </div>

      {/* 3. Table Content */}
      <div className="flex-1 overflow-auto px-6 py-4" onClick={() => handleClearSelection()}>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : views.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <p>No {activeTab} views found</p>
          </div>
        ) : (
          <Table onClick={(e) => e.stopPropagation()}>
            <TableHeader className="bg-white sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-none border-b border-gray-200">
                <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={selectedIds.size === views.length && views.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                </TableHead>
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
              {views.map((view) => {
                const isSelected = selectedIds.has(view._id);
                return (
                <TableRow
                  key={view._id}
                  className={`group cursor-pointer border-b border-gray-100 h-16 ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  onClick={() => handleRowClick(view._id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(view._id)}
                    />
                  </TableCell>
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
                          <Pencil className="mr-2 h-4 w-4" /> Edit
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
              )})}
            </TableBody>
          </Table>
        )}
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
        {selectedCount === 1 && singleView ? (
          <ViewPropertiesPanel
            view={singleView}
            projectId={projectId}
            editIntent={editIntent}
            onEditIntentHandled={() => setEditIntent(false)}
            onClose={handleClearSelection}
            onUpdate={handleViewUpdate}
            onDelete={handleDelete}
            onOpen={handleViewClick}
          />
        ) : selectedCount > 1 ? (
            <ViewBulkPanel 
                selectedViews={selectedViews}
                onClose={handleClearSelection}
                onDeselect={handleDeselectItem}
                onDelete={handleBulkDelete}
            />
        ) : null}
      </aside>
    </div>
  );
};
