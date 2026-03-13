'use client'

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Search, Plus, ChevronRight, AlertTriangle, CheckCircle2, Clock, Loader2, ChevronLeft, Trash2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clashService } from "@/services/clash.service"
import { IClashSet } from "@/types/clash"
import { toast } from "sonner"

type GroupByType = "none" | "status"

interface ClashSetsProps {
    onOpenNewClashDrawer: () => void;
    projectId: string;
    clashResults?: any[];
    onSelectClashItem?: (item1: any, item2: any) => void;
    onRestoreClashSet?: (clashSet: any) => void;
    autoExpandedSetId?: string | null
}

export function ClashSets({ onOpenNewClashDrawer, projectId, clashResults = [], onSelectClashItem, onRestoreClashSet,
    autoExpandedSetId
}: ClashSetsProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"date-created" | "name">("date-created")
    const [groupBy, setGroupBy] = useState<GroupByType>("none")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "Active": true, "Resolved": true })
    const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        if (autoExpandedSetId) {
            setSelectedSetId(autoExpandedSetId);
        }
    }, [autoExpandedSetId]);

    const { data: clashSets = [], isLoading: isLoadingList } = useQuery({
        queryKey: ['clash-sets', projectId],
        queryFn: () => clashService.getAll(projectId),
        enabled: !!projectId,
    });

    const { data: detailSet, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['clash-set-detail', selectedSetId],
        queryFn: () => clashService.getById(selectedSetId!),
        enabled: !!selectedSetId && !selectedSetId.startsWith('temp_'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => clashService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clash-sets', projectId] });
            toast.success("Clash set deleted");
            if (selectedSetId) setSelectedSetId(null);
        },
        onError: () => toast.error("Failed to delete clash set")
    });

    const activeSet = useMemo(() => {
        if (!selectedSetId) return null;

        const tempSet = clashResults.find(c => c._id === selectedSetId);
        if (tempSet) return tempSet;

        if (detailSet) return detailSet;

        return clashSets.find(c => c._id === selectedSetId);
    }, [selectedSetId, clashResults, detailSet, clashSets]);


    const processedData = useMemo(() => {
        let data = [...clashSets] as IClashSet[];

        // Search
        if (searchQuery) {
            data = data.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sort
        data.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Group
        if (groupBy === "none") return { "All": data };

        const groups: Record<string, IClashSet[]> = {};
        data.forEach(item => {
            const key = item.status || "Unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [clashSets, searchQuery, sortBy, groupBy]);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-red-100 text-red-700 border-red-200";
            case "Resolved": return "bg-green-100 text-green-700 border-green-200";
            default: return "bg-gray-100";
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this test?")) {
            deleteMutation.mutate(id);
        }
    };

    // --- VIEW: DETAIL ---
    if (selectedSetId && activeSet) {
        return (
            <div className="w-full h-full flex flex-col bg-background">
                <div className="p-4 border-b flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSetId(null)}>
                        <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-semibold truncate">{activeSet.name}</h3>
                        <span className="text-xs text-muted-foreground">{activeSet.clashCount} clashes</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingDetail ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Loading clash details...</span>
                        </div>
                    ) : (
                        activeSet.items?.map((clash: any, idx: number) => (
                            <div
                                key={idx}
                                className="p-3 border rounded hover:bg-slate-50 cursor-pointer flex flex-col gap-1 bg-white"
                                onClick={() => {
                                    if (onSelectClashItem) onSelectClashItem(clash.item1, clash.item2);
                                }}
                            >
                                <div className="flex justify-between font-medium text-sm">
                                    <span>{clash.name}</span>
                                    <span className="text-red-500 text-xs font-mono">{clash.distance}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                    <span>#{clash.item1.expressID}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>#{clash.item2.expressID}</span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Empty State */}
                    {!isLoadingDetail && (!activeSet.items || activeSet.items.length === 0) && (
                        <div className="p-8 text-center text-gray-400 text-sm">No clashes in this set.</div>
                    )}
                </div>
            </div>
        )
    }

    // --- VIEW: LIST ---
    return (
        <aside className="w-full bg-background flex flex-col min-h-full h-full">
            <div className="p-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Clash sets</h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={onOpenNewClashDrawer}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setGroupBy("status")}>Group by Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGroupBy("none")}>No Grouping</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {showSearch && (
                    <Input
                        placeholder="Search clash sets..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 text-sm"
                    />
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-2 space-y-2">
                {isLoadingList && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>}

                {!isLoadingList && Object.entries(processedData).map(([groupName, items]) => {
                    if (items.length === 0) return null;
                    const isExpanded = expandedGroups[groupName] ?? true;

                    return (
                        <div key={groupName} className="flex flex-col">
                            {groupBy !== "none" && (
                                <div
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 rounded-md mb-1"
                                    onClick={() => toggleGroup(groupName)}
                                >
                                    <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    {groupName}
                                    <span className="ml-auto bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{items.length}</span>
                                </div>
                            )}

                            {(isExpanded || groupBy === "none") && (
                                <div className="space-y-2 pl-1">
                                    {items.map(item => (
                                        <div
                                            key={item._id}
                                            className="group flex flex-col p-3 rounded-lg border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-blue-400"
                                            onClick={() => {
                                                setSelectedSetId(item._id);
                                                if (onRestoreClashSet) {
                                                    onRestoreClashSet(item);
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-sm text-slate-800 line-clamp-2">{item.name}</span>
                                                <div className="flex gap-2 items-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${getStatusColor(item.status)}`}>
                                                        {item.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                                                        {item.status === 'Active' && <AlertTriangle className="w-3 h-3" />}
                                                        {item.status}
                                                    </span>
                                                    <div className="">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(e, item._id)}>
                                                                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                <span className={item.clashCount > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                                    {item.clashCount} Clashes
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px]">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* {clashResults.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase">Recent Runs (Not Refresh)</div>
                        {clashResults.map(set => (
                            <div
                                key={set._id}
                                className="group flex flex-col p-3 rounded-lg border bg-white shadow-sm cursor-pointer mb-2 border-blue-200 bg-blue-50/50"
                                onClick={() => setSelectedSetId(set._id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm text-slate-800">{set.name} (New)</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Found {set.clashCount} clashes</div>
                            </div>
                        ))}
                    </div>
                )} */}
            </div>
        </aside>
    )
}