import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// Define the structure of the project member
interface ProjectMember {
  name: string;
  employer: string;
  role: string;
  status: "Active" | "Removed";
  lastAccessed: string | null; // Can be a string or null if no date is available
  email: String;
}

export const columnsTable: ColumnDef<any>[] = [
  {
    id: "select",

    cell: ({ row }) => (
      <div className="relative h-12 w-10 bg-[url('https://resources.connect.trimble.com/thumb/user.png')]  bg-cover group-hover:bg-none  data-[state=checked:bg-none has-[button[data-state=checked]]:bg-none">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="absolute inset-0 m-auto border-2 border-slate-400 bg-white p-2 opacity-0 shadow-sm group-hover:opacity-100 data-[state=checked]:opacity-100"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="capitalize">
        <span className="font-semibold">{row.getValue("title")}</span>
      </div>
    ),
  },

  {
    accessorKey: "assignees",
    header: "Assignee",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-ellipsis">
        {(() => {
          const list = row?.original?.assignees || [];
          if (!list || list.length === 0) return <div>Unassigned</div>;
          const namesArr = list
            .map((assignee: any) => assignee?.name || assignee?.label || "")
            .filter((n: string) => n && n.trim().length > 0);
          const max = 2;
          const display = namesArr.length > max ? `${namesArr.slice(0, max).join(", ")}, ...` : namesArr.join(", ");
          return <div className="truncate">{display}</div>;
        })()}
      </div>
    ),
  },

  {
    accessorKey: "createOn",
    header: "Created on",
    cell: ({ row }) => (
      <div className="">
        {row?.original?.createdAt
          ? new Date(row.original.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          : ""}
      </div>
    ),
  },

  {
    accessorKey: "Modified on",
    header: "Modified on",
    cell: ({ row }) => (
      <div className="">
        {row?.original?.updatedAt
          ? new Date(row.original.updatedAt).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          : ""}
      </div>
    ),
  },

  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <div className="capitalize">
        <span className="flex items-center gap-2 ">
          {row?.original?.priority?.color && (
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: row.original.priority.color,
              }}></div>
          )}

          {row?.original?.priority?.name}
        </span>
      </div>
    ),
  },
];
