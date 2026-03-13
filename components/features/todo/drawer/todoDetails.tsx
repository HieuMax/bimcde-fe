import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, EllipsisVertical, Tag, Trash } from "lucide-react";

export default function TodoDetails({
  data,
  statusLabel,
  onDelete,
}: {
  data: any;
  statusLabel: string;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="flex items-center py-2 px-3 gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className=" h-full px-4 py-3 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 ">
              Export
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer py-3">
              Export to BCF
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-3">
              Export to Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="bg-transparent py-3 px-3 shadow-none text-gray-500 hover:bg-gray-200 rounded-full">
          <Tag className="w-5 h-5" />
        </Button>
        <Button
          onClick={() => onDelete()}
          className="bg-transparent py-3 px-3 shadow-none text-gray-500 hover:bg-gray-200 rounded-full ">
          <Trash className="w-5 h-5" />
        </Button>
        <Button className="bg-transparent py-3 px-3 shadow-none text-gray-500 hover:bg-gray-200  ">
          <EllipsisVertical className="w-5 h-5" />
        </Button>
      </div>

      <div>
        <div className="">
          <div className="flex items-center nowrap border-t border-t-[#d0d0d7] pl-4 pr-2">
            <h5 className=" my-2 overflow-hidden whitespace-nowrap text-ellipsis">
              Details
            </h5>
          </div>

          <div className=" pl-4 pr-2 flex flex-col flex-nowrap space-y-2">
            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Description
              </label>
              <div className=" overflow-hidden text-ellipsis whitespace-nowrap">
                {data.description}
              </div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Due date:
              </label>
              <div className="">{data.dueDate || "--"}</div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Type:
              </label>
              <div className="">{data.typeTopic?.name || "--"}</div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Priority
              </label>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    backgroundColor: data.priority?.color,
                  }}></div>
                <div className="">{data.priority?.name || "--"}</div>
              </div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Status:
              </label>
              <div className="">{statusLabel}</div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Completion %:
              </label>
              <div className="">{data.completion || "--"}</div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Assigned To :
              </label>
              <div className="flex  flex-wrap gap-2">
                {data.assignees && data.assignees.length > 0
                  ? data.assignees.map(
                      (assignee: { name: string }, index: number) => (
                        <span
                          className="bg-gray-200 px-1 rounded-full  py-1"
                          key={index}>
                          {assignee.name}
                        </span>
                      ),
                    )
                  : "--"}
              </div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Created:
              </label>
              <div className="">
                {data.createOn
                  ? new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }).format(new Date(data.createOn))
                  : "--"}
              </div>
            </div>

            <div className="min-h-12 flex flex-col relative text-sm">
              <label className="flex flex-end flex-nowrap text-muted-foreground font-normal mb-0 min-h-6">
                Modified:
              </label>
              <div className="">
                {data.modifiedOn
                  ? new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }).format(new Date(data.modifiedOn))
                  : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
