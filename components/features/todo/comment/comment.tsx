import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { EllipsisVertical, Paperclip } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface commentProps {
  data: any[];
  onCommentChange?: (data: any) => void;
  onDeleteComment?: (data: any) => void;
}
export default function CommentComponent({
  data,
  onCommentChange,
  onDeleteComment,
}: commentProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const onEditComment = (id: string) => {
    setEditingId(id);
  };

  const onValueChange = () => {
    if (!editingId) return;

    const dataItem = data.find((item: any) => item._id === editingId);
    if (!dataItem) return;

    const updateData = { ...dataItem, description: value };

    onCommentChange?.(updateData);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget && onDeleteComment) {
      onDeleteComment(deleteTarget);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div>
        <div className="pl-4 pr-2 border-t border-t-[#d0d0d7] items-center flex nowrap min-h-10 mt-2">
          <h5 className="overflow-hidden text-ellipsis whitespace-nowrap">
            Comments
          </h5>
        </div>
        {data.map((data: any, index: number) => (
          <div
            key={data._id ?? index}
            className="px-0 py-4 border-b border-b-[#d0d0d7]">
            <div className="px-4">
              <div className="p-0 text-sm min-h-10">
                <div className="flex items-center nowrap min-h-10 w-full">
                  <div className="  mr-2">
                    <Avatar>
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                        className="grayscale"
                      />
                      <AvatarFallback>#</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="overflow-hidden text-ellipsis nowrap w-full">
                    <div className="text-ellipsis nowrap whitespace-nowrap ">
                      {data.createdBy?.fullName}
                    </div>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {new Date(data?.createdOn).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="focus-visible:ring-0">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onEditComment(data._id)}
                        className="cursor-pointer">
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setDeleteTarget(data)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2">
                  <p className="whitespace-nowrap text-inherit break-words ">
                    {data.description}
                  </p>
                  {editingId === data._id && (
                    <>
                      <Textarea
                        className="focus-visible:ring-0 mb-2"
                        rows={2}
                        defaultValue={data.description}
                        onChange={(e) => setValue(e.target.value)}></Textarea>
                      <div className="flex items-center justify-between mt-3">
                        <Button className="text-gray-500 bg-transparent hover:bg-gray-200 px-3 py-2 rounded-md shadow-none">
                          <Paperclip></Paperclip>
                        </Button>

                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                            }}
                            className="bg-transparent text-gray-600 shadow-none hover:bg-gray-200 px-4">
                            Cancel
                          </Button>

                          <Button
                            onClick={onValueChange}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 px-5 text-white">
                            Save
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
