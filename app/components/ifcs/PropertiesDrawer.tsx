"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, Copy } from "lucide-react";
import { toast } from "sonner";

interface PropertiesDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: {
        title: string;
        groups: Record<string, Record<string, any>>;
        count?: number;
    } | null;
    loading?: boolean;
}

export function PropertiesDrawer({ open, onOpenChange, data, loading }: PropertiesDrawerProps) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Reset expanded state
    useEffect(() => {
        if (data && data.groups) {
            const initial: Record<string, boolean> = {};
            Object.keys(data.groups).forEach(g => initial[g] = true);
            setExpandedGroups(initial);
        }
    }, [data]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const expandAll = () => {
        if (!data) return;
        const all: Record<string, boolean> = {};
        Object.keys(data.groups).forEach(g => all[g] = true);
        setExpandedGroups(all);
    };

    const collapseAll = () => {
        setExpandedGroups({});
    };

    const copyValue = (val: any) => {
        navigator.clipboard.writeText(String(val));
        toast.success("Copied to clipboard");
    };

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
            <SheetContent
                side="right"
                className="w-[400px] p-0 flex flex-col h-full border-l shadow-xl bg-background"
                onInteractOutside={(e) => e.preventDefault()}
                style={{ pointerEvents: "auto" }}
            >
                {/* HEADER */}
                <SheetHeader className="px-6 py-4 border-b bg-muted/20 flex-shrink-0">
                    <SheetTitle className="text-lg font-bold truncate pr-4" title={data?.title}>
                        {loading ? "Loading..." : data?.title || "Properties"}
                    </SheetTitle>
                    {data?.count && (
                        <p className="text-xs text-muted-foreground">{data.count} items selected</p>
                    )}
                </SheetHeader>

                {/* TOOLBAR */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Data
                    </span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={expandAll}>
                            <ChevronsDown className="w-3 h-3 mr-1" /> Expand
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={collapseAll}>
                            <ChevronsUp className="w-3 h-3 mr-1" /> Collapse
                        </Button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">Extracting properties...</div>
                    ) : !data || Object.keys(data.groups).length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No properties found.</div>
                    ) : (
                        <div className="pb-10">
                            {Object.entries(data.groups).map(([groupName, props]) => {
                                const isExpanded = expandedGroups[groupName];
                                const isEmpty = Object.keys(props).length === 0;

                                if (isEmpty) return null;

                                return (
                                    <div key={groupName} className="border-b border-border/50">
                                        {/* Group Header */}
                                        <button
                                            onClick={() => toggleGroup(groupName)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                                        >
                                            <span className="font-semibold text-sm text-foreground">{groupName}</span>
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                        </button>

                                        {/* Group Content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-3 space-y-3 bg-muted/5 animate-in slide-in-from-top-1 duration-200">
                                                {Object.entries(props).map(([key, value]) => (
                                                    <div key={key} className="group/row">
                                                        <div className="text-xs text-muted-foreground mb-0.5">{key}</div>
                                                        <div className="text-sm font-medium text-foreground break-words flex items-start justify-between gap-2">
                                                            <span>{String(value)}</span>
                                                            {String(value) !== "Varies" && (
                                                                <Copy
                                                                    className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-pointer opacity-0 group-hover/row:opacity-100 transition-opacity mt-1"
                                                                    onClick={() => copyValue(value)}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}