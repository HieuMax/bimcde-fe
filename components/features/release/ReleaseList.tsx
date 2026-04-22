"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { releaseService } from "@/services/release.service";
import { IRelease } from "@/types/release";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Package,
  MoreVertical,
  FilterX,
  CircleCheck,
  Download,
  Trash2,
} from "lucide-react";
import { ReleaseStatusBadge } from "./ReleaseStatusBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ReleasePanel } from "./ReleasePanel";
import { ReleaseBulkPanel } from "./ReleaseBulkPanel";
import { UserFilter } from "@/components/features/activity/UserFilter";
import { DateFilter } from "@/components/features/activity/DateFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { activityFilterTriggerClassName } from "@/components/features/activity/activity-filter-ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/authContext";
import {
  canMutateReleaseDraft,
  type ProjectReleaseContext,
} from "./releaseProjectContext";
import { GroupFilter } from "../activity/GroupFilter";

interface ReleaseListProps {
  projectId: string;
  projectReleaseContext: ProjectReleaseContext | null;
  canCreateRelease: boolean;
  onCreateRelease: () => void;
}

export const ReleaseList: React.FC<ReleaseListProps> = ({
  projectId,
  projectReleaseContext,
  canCreateRelease,
  onCreateRelease,
}) => {
  const { user } = useAuth();
  const [releases, setReleases] = useState<IRelease[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- FILTER STATE ---
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [createdByUserIds, setCreatedByUserIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [dueFilter, setDueFilter] = useState<{ start?: Date; end?: Date }>({}); // Due Date Filter
  const [dateFilterResetKey, setDateFilterResetKey] = useState(0);

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await releaseService.getReleases({
        projectId,
        status: statusFilter,
        userIds: createdByUserIds,
        groupIds,
        dueStartDate: dueFilter.start?.toISOString(),
        dueEndDate: dueFilter.end?.toISOString(),
      });
      setReleases(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, createdByUserIds, groupIds, dueFilter]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleCreatedByFilterChange = (userIds: string[]) => {
    setCreatedByUserIds(userIds);
  };

  const handleGroupFilterChange = (ids: string[]) => {
    setGroupIds(ids);
  };

  // Handler thay đổi Date Filter
  const handleDueDateChange = (range: { startDate?: Date; endDate?: Date }) => {
    setDueFilter({ start: range.startDate, end: range.endDate });
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
    if (selectedIds.size === releases.length && releases.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(releases.map((r) => r._id)));
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
  const selectedReleases = releases.filter((r) => selectedIds.has(r._id));
  const singleRelease = selectedCount === 1 ? selectedReleases[0] : null;

  const handleRenameRelease = async (newName: string) => {
    if (!singleRelease) return;
    try {
      await releaseService.updateRelease(singleRelease._id, { name: newName });
      toast.success("Release renamed successfully");
      fetchReleases();
    } catch (error) {
      console.error(error);
      toast.error("Failed to rename release");
    }
  };

  const handleFinalizeRelease = async (
    e: React.MouseEvent,
    release: IRelease,
  ) => {
    e.stopPropagation();
    if (
      !confirm(
        `Release "${release.name}"? After this it cannot be edited or deleted.`,
      )
    )
      return;
    try {
      await releaseService.finalizeRelease(release._id);
      toast.success("Release completed");
      fetchReleases();
    } catch (error) {
      console.error(error);
      toast.error("Failed to release");
    }
  };

  const handleDownloadRelease = async (e: React.MouseEvent, release: IRelease) => {
    e.stopPropagation();
    try {
      toast.info("Download started...");
      await releaseService.downloadRelease(release._id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download release");
    }
  };

  const handleDeleteRelease = async (e: React.MouseEvent, release: IRelease) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete release "${release.name}"?`)) return;
    try {
      await releaseService.deleteRelease(release._id);
      toast.success("Release deleted successfully");
      // Deselect if it was selected
      if (selectedIds.has(release._id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(release._id);
        setSelectedIds(newSet);
      }
      fetchReleases();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete release");
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-row overflow-hidden bg-white shadow-sm">
      {/* MAIN CONTENT */}
      <div
        className={`flex flex-col h-full flex-1 transition-all duration-300 ${isPanelOpen ? "mr-0 sm:mr-80" : "mr-0"
          }`}
      >
        <div className="flex shrink-0 items-center justify-between rounded-t-md border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="text-lg font-medium text-gray-800">Releases</h2>
          <Button
            onClick={onCreateRelease}
            disabled={!canCreateRelease}
            title={
              !canCreateRelease
                ? "Only project administrators and group leaders can create releases in ISO projects."
                : undefined
            }
            className="bg-[#406D87] hover:bg-[#345a70] px-6 py-4 rounded text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            New
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <UserFilter
              projectId={projectId}
              selectedUserIds={createdByUserIds}
              onChange={handleCreatedByFilterChange}
              triggerLabel="Created by"
            />

            <span className="text-gray-300">|</span>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "w-auto min-w-0 justify-start",
                  activityFilterTriggerClassName(statusFilter !== "ALL"),
                )}
              >
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-gray-300">|</span>

            <GroupFilter
              projectId={projectId}
              selectedGroupIds={groupIds}
              onChange={handleGroupFilterChange}
            />

            <span className="text-gray-300">|</span>

            <DateFilter
              key={dateFilterResetKey}
              label="Due date"
              onFilterChange={handleDueDateChange}
            />
          </div>

          {(createdByUserIds.length > 0 ||
            statusFilter !== "ALL" ||
            groupIds.length > 0 ||
            dueFilter.start) && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-gray-500 hover:text-red-600"
                onClick={() => {
                  setStatusFilter("ALL");
                  setGroupIds([]);
                  setCreatedByUserIds([]);
                  setDueFilter({});
                  setDateFilterResetKey((k) => k + 1);
                }}
              >
                <FilterX className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto px-4 py-4"
          onClick={() => handleClearSelection()}
        >
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              No releases found
            </div>
          ) : (
            <Table onClick={(e) => e.stopPropagation()}>
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-none">
                  {[
                    <TableHead key="h1" className="w-[40px]">
                      <Checkbox
                        checked={
                          selectedIds.size === releases.length &&
                          releases.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>,
                    <TableHead key="h2" className="w-[50px]" />,
                    <TableHead
                      key="h3"
                      className="text-gray-500 font-semibold uppercase text-xs"
                    >
                      Name
                    </TableHead>,
                    <TableHead
                      key="h4"
                      className="text-gray-500 font-semibold uppercase text-xs w-[100px]"
                    >
                      Files
                    </TableHead>,
                    <TableHead
                      key="h5"
                      className="text-gray-500 font-semibold uppercase text-xs"
                    >
                      Due date
                    </TableHead>,
                    <TableHead
                      key="h6"
                      className="text-gray-500 font-semibold uppercase text-xs"
                    >
                      Status
                    </TableHead>,
                    <TableHead key="h7" className="w-[50px]" />,
                  ]}
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((release) => {
                  const isSelected = selectedIds.has(release._id);
                  const canMutate = canMutateReleaseDraft(
                    release,
                    projectReleaseContext,
                    user?._id,
                  );
                  return (
                    <TableRow
                      key={release._id}
                      className={`group cursor-pointer border-b border-gray-100 h-14 ${isSelected
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                        }`}
                      onClick={() => handleRowClick(release._id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectOne(release._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <Link
                          href={`/projects/${projectId}/data/releases/${release._id}`}
                          className="hover:underline hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {release.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {release.items.length}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {release.dueDate
                          ? format(new Date(release.dueDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <ReleaseStatusBadge status={release.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {release.status === "DRAFT" && canMutate && (
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleFinalizeRelease(e, release)
                                }
                              >
                                <CircleCheck className="mr-2 h-4 w-4" />
                                <span>Release</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => handleDownloadRelease(e, release)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                            {release.status === "DRAFT" && canMutate && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => handleDeleteRelease(e, release)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            ${isPanelOpen
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
          }
            sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-[320px] 
            sm:opacity-100 sm:visible sm:pointer-events-auto
            sm:transition-transform sm:duration-300
            ${isPanelOpen ? "sm:translate-x-0" : "sm:translate-x-full"}
          `}
      >
        {selectedCount === 1 && singleRelease ? (
          <ReleasePanel
            release={singleRelease}
            onClose={handleClearSelection}
            onRename={handleRenameRelease}
            onUpdate={fetchReleases}
            canMutateRelease={canMutateReleaseDraft(
              singleRelease,
              projectReleaseContext,
              user?._id,
            )}
          />
        ) : selectedCount > 1 ? (
          <ReleaseBulkPanel
            selectedReleases={selectedReleases}
            onClose={handleClearSelection}
            onDeselect={handleDeselectItem}
          />
        ) : null}
      </aside>
    </div>
  );
};
