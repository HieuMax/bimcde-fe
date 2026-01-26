"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allColumns: string[];
    visibleColumns: string[];
    onSave: (newVisibleColumns: string[]) => void;
}

export function ColumnPicker({ open, onOpenChange, allColumns, visibleColumns, onSave }: Props) {
    const [leftList, setLeftList] = useState<string[]>([]);
    const [rightList, setRightList] = useState<string[]>([]);
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");
    const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set());
    const [selectedRight, setSelectedRight] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            const visibleSet = new Set(visibleColumns);
            const available = allColumns.filter(c => !visibleSet.has(c));
            setLeftList(available);
            setRightList([...visibleColumns]);
            setSelectedLeft(new Set());
            setSelectedRight(new Set());
        }
    }, [open, allColumns, visibleColumns]);

    const moveToRight = () => {
        const itemsToMove = Array.from(selectedLeft);
        if (itemsToMove.length === 0) return;
        setRightList(prev => [...prev, ...itemsToMove]);
        setLeftList(prev => prev.filter(i => !selectedLeft.has(i)));
        setSelectedLeft(new Set());
    };

    const moveToLeft = () => {
        const itemsToMove = Array.from(selectedRight);
        if (itemsToMove.length === 0) return;
        setLeftList(prev => [...prev, ...itemsToMove].sort());
        setRightList(prev => prev.filter(i => !selectedRight.has(i)));
        setSelectedRight(new Set());
    };

    const handleSave = () => {
        onSave(rightList);
        onOpenChange(false);
    };

    const renderList = (items: string[], search: string, selected: Set<string>, onSelect: (val: string) => void) => {
        const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="flex-1 border rounded-md bg-white overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-1">
                    {filtered.length === 0 && <div className="text-xs text-muted-foreground p-2 text-center">No columns found</div>}
                    {filtered.map(item => (
                        <div
                            key={item}
                            className={`text-sm px-2 py-1.5 cursor-pointer rounded-sm hover:bg-slate-100 truncate ${selected.has(item) ? 'bg-blue-100 text-blue-700' : ''}`}
                            onClick={() => onSelect(item)}
                            title={item}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>Customize Columns</DialogTitle>
                </DialogHeader>

                {/* min-h-0 is crucial for nested flex scrolling */}
                <div className="flex-1 min-h-0 p-6 grid grid-cols-[1fr,auto,1fr] gap-4">

                    {/* LEFT LIST */}
                    <div className="flex flex-col gap-2 h-full min-h-0 min-w-0">
                        <span className="font-medium text-sm text-slate-600">Available ({leftList.length})</span>
                        <div className="relative shrink-0">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input className="pl-8 h-8 text-xs" placeholder="Search..." value={searchLeft} onChange={e => setSearchLeft(e.target.value)} />
                        </div>
                        {renderList(leftList, searchLeft, selectedLeft, (val) => {
                            const next = new Set(selectedLeft);
                            next.has(val) ? next.delete(val) : next.add(val);
                            setSelectedLeft(next);
                        })}
                    </div>

                    {/* BUTTONS */}
                    <div className="flex flex-col justify-center gap-2 shrink-0">
                        <Button variant="outline" size="icon" onClick={moveToRight} disabled={selectedLeft.size === 0}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={moveToLeft} disabled={selectedRight.size === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* RIGHT LIST */}
                    <div className="flex flex-col gap-2 h-full min-h-0 min-w-0">
                        <span className="font-medium text-sm text-slate-600">Visible ({rightList.length})</span>
                        <div className="relative shrink-0">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input className="pl-8 h-8 text-xs" placeholder="Search..." value={searchRight} onChange={e => setSearchRight(e.target.value)} />
                        </div>
                        {renderList(rightList, searchRight, selectedRight, (val) => {
                            const next = new Set(selectedRight);
                            next.has(val) ? next.delete(val) : next.add(val);
                            setSelectedRight(next);
                        })}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Apply</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}