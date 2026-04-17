"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isDrawer: boolean;
  onRowSelectionChange: (selection: Record<string, unknown>) => void;
  /** When the drawer opens from a deep link (?openTodoId=), sync visual row highlight */
  selectedTodoId?: string | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isDrawer,
  onRowSelectionChange,
  selectedTodoId = null,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => String((row as { _id?: string })._id ?? ""),
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    if (!isDrawer) {
      setRowSelection({});
      onRowSelectionChange({});
      return;
    }
    if (selectedTodoId) {
      setRowSelection({ [selectedTodoId]: true });
    }
  }, [isDrawer, selectedTodoId, onRowSelectionChange, data]);

  const handleRowClick = (row: any) => {
    const isRowSelected = row.getIsSelected();

    if (isRowSelected) {
      setRowSelection({});
      onRowSelectionChange({});
      return;
    }

    const newSelection = { [row.id]: true };

    setRowSelection(newSelection);
    onRowSelectionChange(row);
  };

  return (
    <div className="w-full ">
      <div className=" rounded-md border">
        <ScrollArea className="w-full h-[70vh]">
          <Table>
            <TableHeader className="h-14 bg-gray-100 sticky top-0 cursor-default text-left">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="h-16 group
                  cursor-pointer
                  hover:bg-gray-200 
                  data-[state=selected]:text-[#005f9e]
                  data-[state=selected]:bg-[#e5f0f8]"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => handleRowClick(row)}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
