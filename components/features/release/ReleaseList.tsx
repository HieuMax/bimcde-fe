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
import { Loader2, Package, MoreVertical, FilterX } from "lucide-react";
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
import { GroupFilter } from "../activity/GroupFilter";

interface ReleaseListProps {
  projectId: string;
  onCreateRelease: () => void;
}

export const ReleaseList: React.FC<ReleaseListProps> = ({
  projectId,
  onCreateRelease,
}) => {
  const [releases, setReleases] = useState<IRelease[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- FILTER STATE ---
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [recipientIds, setRecipientIds] = useState<string[]>([]); // User Filter (Recipients)
  const [groupIds, setGroupIds] = useState<string[]>([]); // Group IDs
  const [dueFilter, setDueFilter] = useState<{ start?: Date; end?: Date }>({}); // Due Date Filter

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await releaseService.getReleases({
        projectId,
        status: statusFilter,
        userIds: recipientIds,
        groupIds: groupIds,
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
  }, [projectId, statusFilter, recipientIds, groupIds, dueFilter]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Handler thay đổi Group Filter
  const handleGroupFilterChange = (ids: string[]) => {
    setGroupIds(ids);
  };
  // Handler thay đổi User Filter
  const handleUserFilterChange = (userIds: string[]) => {
    setRecipientIds(userIds);
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
    setSelectedIds(new Set([id]));
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
  return (
    <div className="flex min-h-[93.9vh] relative overflow-hidden bg-white">
      {/* MAIN CONTENT */}
      <div
        className={`flex flex-col h-full flex-1 transition-all duration-300 ${
          isPanelOpen ? "mr-0 sm:mr-80" : "mr-0"
        }`}
      >
        {/* Header Title & New Button */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-normal text-gray-800">Releases</h1>
          <Button
            onClick={onCreateRelease}
            className="bg-[#005F9E] hover:bg-[#004B7D] text-white rounded-sm font-medium px-6"
          >
            New
          </Button>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="px-6 py-2 flex items-center gap-2 border-b border-gray-200 bg-gray-50/50 min-h-[48px]">
          {/* 1. Users Filter */}
          <UserFilter
            projectId={projectId}
            selectedUserIds={recipientIds}
            onChange={handleUserFilterChange}
          />

          <span className="text-gray-300">|</span>

          {/* 2. Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm text-gray-600 hover:text-black px-2 h-8">
              <span>Status</span>
              {statusFilter !== "ALL" && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#005F9E]" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-gray-300">|</span>

          {/* 2. [NEW] Group Filter */}
          <GroupFilter
            projectId={projectId}
            selectedGroupIds={groupIds}
            onChange={handleGroupFilterChange}
          />

          {/* 3. Due Date Filter */}
          {/* Dùng DateFilter, truyền label "Due date" và ẩn Custom Date */}
          <DateFilter
            label="Due date"
            hideCustom={true}
            onFilterChange={handleDueDateChange}
          />

          {/* Clear Button */}
          {(recipientIds.length > 0 ||
            statusFilter !== "ALL" ||
            dueFilter.start) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-gray-500 hover:text-red-600"
              onClick={() => {
                setStatusFilter("ALL");
                setRecipientIds([]);
                setDueFilter({});
              }}
            >
              <FilterX className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Table Content */}
        <div
          className="flex-1 overflow-auto px-6 py-4"
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
                      Recipients
                    </TableHead>,
                    <TableHead
                      key="h7"
                      className="text-gray-500 font-semibold uppercase text-xs"
                    >
                      Status
                    </TableHead>,
                    <TableHead key="h8" className="w-[50px]" />,
                  ]}
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((release) => {
                  const isSelected = selectedIds.has(release._id);
                  return (
                    <TableRow
                      key={release._id}
                      className={`group cursor-pointer border-b border-gray-100 h-14 ${
                        isSelected
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
                      <TableCell className="text-gray-600 max-w-[200px] truncate">
                        {release.recipients && release.recipients.length > 0 ? (
                          // Chỉ hiện tối đa 3 người để tránh vỡ layout, còn lại hiện +N
                          <>
                            {release.recipients
                              .slice(0, 3)
                              .map((r: any, i: number) => (
                                <div
                                  key={i}
                                  className="inline-flex items-center bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700 whitespace-nowrap"
                                  title={r.type === "GROUP" ? "Group" : "User"}
                                >
                                  {/* Hiển thị tên (ưu tiên fullName, fallback name) */}
                                  <span className="truncate max-w-[80px]">
                                    {r.fullName || r.name || "Unknown"}
                                  </span>
                                </div>
                              ))}

                            {release.recipients.length > 3 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                +{release.recipients.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ReleaseStatusBadge status={release.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open context menu or something
                          }}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
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
        {selectedCount === 1 && singleRelease ? (
          <ReleasePanel
            release={singleRelease}
            onClose={handleClearSelection}
            onRename={handleRenameRelease}
            onUpdate={fetchReleases}
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
