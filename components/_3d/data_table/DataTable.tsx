"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2, Download } from "lucide-react";
import { ColumnPicker } from "./ColumnPicker";
import * as XLSX from 'xlsx';

interface DataTableProps {
    ifcManager: any;
}

export function DataTable({ ifcManager }: DataTableProps) {
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [allVisibleItems, setAllVisibleItems] = useState<any[]>([]);
    const [rows, setRows] = useState<any[]>([]);

    const PAGE_SIZE = 50;
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
    const [allPossibleColumns, setAllPossibleColumns] = useState<string[]>([]);

    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        "Reference Object.Name",
        "Presentation Layers.Layer",
        "Materials and Finishes.Material",
        "Other.Range Material",
        "Ifc Material Layer Set Usage.Material",
        "Calculated Geometry Values.Area",
        "Calculated Geometry Values.Volume",
        "Phasing.Phase Created"
    ]);

    // Các cột KHÔNG bao giờ tính tổng
    const NON_CALCULABLE_COLUMNS = [
        "Reference Object.Name",
        "Reference Object.GlobalId",
        "Reference Object.File Name",
        "Reference Object.Type",
        "Presentation Layers.Layer",
        "Ifc Material Layer Set Usage.Material",
        "Materials and Finishes.Material",
        "Other.Range Material",
        "Phasing.Phase Created",
        "Identity Data.Mark",
        "Identity Data.OmniClass Number"
    ];

    useEffect(() => {
        if (!ifcManager) return;
        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const items = await ifcManager.getAllVisibleItems();
                setAllVisibleItems(items);
                ifcManager.getAllUniquePropertyNames(items).then((cols: string[]) => {
                    setAllPossibleColumns(cols);
                });

                const firstPageIds = items.slice(0, PAGE_SIZE);
                const firstPageData = await ifcManager.getPropertiesBatch(firstPageIds);

                setRows(firstPageData);
                setCurrentPage(1);
                setHasMore(items.length > PAGE_SIZE);
            } catch (e) {
                console.error("Failed to init table", e);
            } finally {
                setLoading(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [ifcManager]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setTimeout(async () => {
            try {
                const nextStart = currentPage * PAGE_SIZE;
                const nextEnd = nextStart + PAGE_SIZE;
                const nextIds = allVisibleItems.slice(nextStart, nextEnd);

                if (nextIds.length === 0) {
                    setHasMore(false);
                    return;
                }
                const nextData = await ifcManager.getPropertiesBatch(nextIds);
                setRows(prev => [...prev, ...nextData]);
                setCurrentPage(prev => prev + 1);
                if (nextEnd >= allVisibleItems.length) setHasMore(false);
            } finally {
                setLoadingMore(false);
            }
        }, 50);
    };

    const handleExport = () => {
        setLoading(true);
        setTimeout(() => {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            XLSX.writeFile(wb, "BIM_Data.xlsx");
            setLoading(false);
        }, 100);
    };

    const totals = useMemo(() => {
        const result: Record<string, number> = {};
        const count: Record<string, number> = {};

        rows.forEach(row => {
            visibleColumns.forEach(col => {
                // Bỏ qua các cột định danh
                if (NON_CALCULABLE_COLUMNS.includes(col)) return;

                const val = row[col];
                if (typeof val === 'string') {
                    const num = parseFloat(val.replace(/[^\d.-]/g, ''));
                    if (!isNaN(num)) {
                        result[col] = (result[col] || 0) + num;
                        count[col] = (count[col] || 0) + 1;
                    }
                }
            });
        });

        const formatted: Record<string, string> = {};
        visibleColumns.forEach(col => {
            if (result[col] !== undefined && count[col] > 0) {
                const sample = rows.find(r => r[col])?.[col] || "";
                const unit = sample.replace(/[\d.-]/g, '').trim();
                formatted[col] = `${result[col].toFixed(2)} ${unit}`;
            }
        });
        return formatted;
    }, [rows, visibleColumns]);

    const getHeaderName = (col: string) => {
        if (col === "Presentation Layers.Layer") return "Class";
        if (col === "Reference Object.Name") return "Name";
        const parts = col.split('.');
        return parts.length > 1 ? parts[1] : col;
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-2xl">
            {/* TOOLBAR */}
            <div className="flex items-center justify-between p-2 border-b bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Data Table</span>
                    <span className="text-xs text-muted-foreground bg-slate-200 px-2 py-0.5 rounded-full">
                        {allVisibleItems.length} items
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setIsColumnPickerOpen(true)}>
                        <Settings2 className="w-3.5 h-3.5" /> Columns
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleExport}>
                        <Download className="w-3.5 h-3.5" /> Export
                    </Button>
                </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="flex-1 overflow-auto bg-white relative w-full scrollbar-thin scrollbar-thumb-gray-300">
                {loading ? (
                    <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading data...
                    </div>
                ) : (
                    <table className="w-full min-w-max text-sm text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 z-20 shadow-sm border-b border-slate-200">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 w-12 text-center border-r bg-slate-50 sticky left-0 z-30">#</th>
                                {visibleColumns.map(col => (
                                    <th key={col} className="p-3 font-semibold text-slate-700 min-w-[150px] border-r whitespace-nowrap bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-normal uppercase mb-0.5">
                                                {col.split('.')[0]}
                                            </span>
                                            <span>{getHeaderName(col)}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={row.id || idx} className="hover:bg-blue-50/50 border-b border-slate-100 last:border-0 group">
                                    <td className="p-2 text-slate-400 text-xs text-center border-r bg-white group-hover:bg-blue-50/50 sticky left-0 z-10">{idx + 1}</td>
                                    {visibleColumns.map(col => (
                                        <td key={col} className="p-2 truncate max-w-[300px] border-r text-slate-600" title={row[col]}>
                                            {row[col] || "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {/* TOTALS ROW */}
                        <tfoot className="sticky bottom-0 bg-slate-100 z-20 font-semibold text-slate-800 border-t-2 border-slate-300 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                            <tr>
                                <td className="p-3 text-center border-r bg-slate-100 sticky left-0 z-30">Total</td>
                                {visibleColumns.map(col => (
                                    <td key={col} className="p-3 border-r min-w-[150px] bg-slate-100 whitespace-nowrap">
                                        {totals[col] || ""}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {/* LOAD MORE */}
            {!loading && hasMore && (
                <div className="p-2 border-t bg-slate-50 flex justify-center shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 w-full max-w-xs"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Load more...
                    </Button>
                </div>
            )}

            {/* POPUP */}
            <ColumnPicker
                open={isColumnPickerOpen}
                onOpenChange={setIsColumnPickerOpen}
                allColumns={allPossibleColumns}
                visibleColumns={visibleColumns}
                onSave={setVisibleColumns}
            />
        </div>
    );
}