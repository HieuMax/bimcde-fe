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
  email: string;
}

export const columnsTable: ColumnDef<ProjectMember>[] = [
  {
    id: "select",

    cell: ({ row }) => (
      <div className="relative h-12 w-10 bg-[url('https://resources.connect.trimble.com/thumb/user.png')]  bg-cover group-hover:bg-none  data-[state=checked:bg-none has-[button[data-state=checked]]:bg-none">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="absolute inset-0 m-auto opacity-0 border-2 p-2 border-gray-400 group-hover:opacity-100 data-[state=checked]:bg-[#005a92] data-[state=checked]:opacity-100 "
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: "Name",
    cell: ({ row }) => (
      <div className="">
        {/* Hiển thị tên */}
        <span className="font-semibold">{row.getValue("fullName")}</span>
        <div>
          {/* Hiển thị email */}
          <a
            href={`mailto:${row.original.email}`}
            className="text-sm text-[#005f9e] hover:underline">
            {row.original.email}
          </a>
        </div>
      </div>
    ),
  },

  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
  },

  {
    accessorKey: "lastAccessed",
    header: ({ column }) => {
      return (
        <Button
          className="px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Accessed
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="">
        {row.original.lastAccessed
          ? new Date(row.original.lastAccessed).toLocaleString("en-US", {
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
];
