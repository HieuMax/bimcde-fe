import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Row shape for project-wide or single-group member table */
export interface TeamMemberRow {
  fullName?: string;
  email?: string;
  /** Project-level role: admin | user */
  role?: string;
  userId?: string;
  lastAccessed?: string | Date | null;
  /** Present when listing members of one group (ISO CDE) */
  groupMemberRole?: "GROUP_LEADER" | "GROUP_MEMBER";
  projectId?: string;
}

const teamBaseColumns: ColumnDef<TeamMemberRow>[] = [
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
    header: "Role (project)",
    cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
  },
  {
    accessorKey: "lastAccessed",
    header: ({ column }) => {
      return (
        <Button
          className="px-0 hidden lg:block"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Accessed
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className=" hidden lg:block">
        {row.original.lastAccessed
          ? new Date(row.original.lastAccessed as string | Date).toLocaleString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              },
            )
          : ""}
      </div>
    ),
  },
];

export type GroupMemberRoleOption = "GROUP_LEADER" | "GROUP_MEMBER";

export function getTeamTableColumns(options: {
  showGroupMemberRole: boolean;
  projectAdmin: boolean;
  onGroupMemberRoleChange?: (
    userId: string,
    role: GroupMemberRoleOption,
  ) => Promise<void>;
  updatingUserId?: string | null;
}): ColumnDef<TeamMemberRow>[] {
  if (!options.showGroupMemberRole) {
    return [...teamBaseColumns];
  }

  const groupCol: ColumnDef<TeamMemberRow> = {
    id: "groupMemberRole",
    header: "In group (ISO)",
    cell: ({ row }) => {
      const gr = row.original.groupMemberRole;
      const uid = row.original.userId ? String(row.original.userId) : "";
      if (!gr) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const label = gr === "GROUP_LEADER" ? "Group Leader" : "Group Member";
      if (!options.projectAdmin || !options.onGroupMemberRoleChange) {
        return <div className="text-sm">{label}</div>;
      }
      const busy = options.updatingUserId === uid;
      return (
        <div onClick={(e) => e.stopPropagation()} className="min-w-[160px]">
          <Select
            value={gr}
            disabled={busy}
            onValueChange={(v) =>
              options.onGroupMemberRoleChange!(uid, v as GroupMemberRoleOption)
            }>
            <SelectTrigger className="h-9 w-full border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GROUP_LEADER">Group Leader</SelectItem>
              <SelectItem value="GROUP_MEMBER">Group Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    },
  };

  const cols = [...teamBaseColumns];
  cols.splice(3, 0, groupCol);
  return cols;
}

/** Default columns (all project members view — no group role column). */
export const columnsTable: ColumnDef<TeamMemberRow>[] = getTeamTableColumns({
  showGroupMemberRole: false,
  projectAdmin: false,
});
