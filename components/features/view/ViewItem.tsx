import { IView } from "@/types/view";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Eye, Pencil, Trash2, Box, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface ViewItemProps {
  view: IView;
  onEdit: (view: IView) => void;
  onDelete: (view: IView) => void;
  onClick: (view: IView) => void;
}

export const ViewItem = ({
  view,
  onEdit,
  onDelete,
  onClick,
}: ViewItemProps) => {
  // Hỗ trợ cả thumbnailUrl (3D) và previewSrc (2D)
  const imageUrl = view.thumbnailUrl || (view as any).previewSrc;

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={() => onClick(view)}
    >
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={view.name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            {view.type === "3D" ? (
              <Box className="w-12 h-12 mb-2" />
            ) : (
              <FileText className="w-12 h-12 mb-2" />
            )}
            <span className="text-xs uppercase font-semibold">
              No Thumbnail
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {/* <Badge variant={view.type === "3D" ? "default" : "secondary"} className="shadow-sm">
            {view.type}
           </Badge> */}
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle
            className="text-base font-semibold leading-tight line-clamp-2"
            title={view.name}
          >
            {view.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(view);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(view);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {view.description || "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t bg-muted/20 mt-auto flex items-center justify-between text-xs text-muted-foreground h-12">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={`https://avatar.vercel.sh/${view.createdBy?.email || "user"}`}
            />
            <AvatarFallback>
              {view.createdBy?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[100px]">
            {view.createdBy?.fullName || "Unknown"}
          </span>
        </div>
        <span title={new Date(view.updatedAt || new Date()).toLocaleString()}>
          {formatDistanceToNow(new Date(view.updatedAt || new Date()), {
            addSuffix: true,
          })}
        </span>
      </CardFooter>
    </Card>
  );
};
