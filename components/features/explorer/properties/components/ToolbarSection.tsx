"use client";

import {
  Key,
  Download,
  FolderInput,
  Trash2,
  MoreVertical,
  Share2,
  History,
  QrCode,
  Archive,
  CheckSquare,
  Eye,
  FileDown,
  Tags,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IFile, IFolder } from "@/types/explorer";
import { AddToReleaseDialog } from "../../dialogs/AddToReleaseDialog";
import { useState } from "react";

interface Props {
  item: IFile | IFolder;
  projectId: string;
  onDownload: () => void;
  onOpenMove: () => void;
  onDelete: () => void;
  onOpenShare: () => void;
  onNavigate: () => void;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  onAddTags: () => void;
}

export default function ToolbarSection({
  item,
  projectId,
  onDownload,
  onOpenMove,
  onDelete,
  onOpenShare,
  onNavigate,
  onToggleLock,
  onAddTags,
}: Props) {
  const isFile = "mimeType" in item;
  const [isAddToReleaseOpen, setIsAddToReleaseOpen] = useState(false);

  const renderAddToReleaseDialog = () => (
    <AddToReleaseDialog
      open={isAddToReleaseOpen}
      onOpenChange={setIsAddToReleaseOpen}
      projectId={projectId}
      itemsToAdd={[item]}
    />
  );
  // --- LOGIC 1: ITEM FOLDER ---
  if (!isFile) {
    return (
      <div className="flex items-center justify-between px-4 py-2">
        {/* 1. Permissions */}
        <TooltipAction
          icon={<Key size={18} />}
          label="Permissions"
          onClick={() => {}}
        />

        {/* 2. Download */}
        <TooltipAction
          icon={<Download size={18} />}
          label="Download"
          onClick={onDownload}
        />

        {/* 3. Move */}
        <TooltipAction
          icon={<FolderInput size={18} />}
          label="Move to..."
          onClick={onOpenMove}
        />

        {/* 4. Delete */}
        <TooltipAction
          icon={<Trash2 size={18} />}
          label="Delete"
          onClick={onDelete}
        />

        {/* 5. More Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-gray-100 h-9 w-9 data-[state=open]:bg-gray-100"
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer">
              <History className="mr-2 h-4 w-4 text-slate-500" />
              <span>See activity</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onToggleLock("LOCK")}
              className="cursor-pointer"
            >
              <Lock className="mr-2 h-4 w-4 text-slate-500" />
              <span>Checkin files</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleLock("UNLOCK")}
              className="cursor-pointer"
            >
              <Unlock className="mr-2 h-4 w-4 text-slate-500" />
              <span>Checkout files</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer">
              <FileDown className="mr-2 h-4 w-4 text-slate-500" />
              <span>Export to Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onAddTags}>
              <Tags className="mr-2 h-4 w-4 text-slate-500" />
              <span>Add tags</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // --- LOGIC 2: ITEM FILE ---
  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* 1. View Button */}
      <Button
        onClick={onNavigate}
        className="bg-slate-800 hover:bg-slate-700 text-white h-9 px-4 text-sm font-medium mr-auto"
      >
        <Eye className="mr-2 h-4 w-4" />
        View
      </Button>

      {/* 2. Permissions */}
      <TooltipAction
        icon={<Key size={18} />}
        label="Permissions"
        onClick={() => {}}
      />

      {/* 3. Share */}
      <TooltipAction
        icon={<Share2 size={18} />}
        label="Share"
        onClick={onOpenShare}
      />

      {/* 4. More Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-gray-100 h-9 w-9 data-[state=open]:bg-gray-100"
          >
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-60 max-h-[400px] overflow-y-auto"
        >
          {/* GR 1 */}
          <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4 text-slate-500" />
            <span>Download</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenMove} className="cursor-pointer">
            <FolderInput className="mr-2 h-4 w-4 text-slate-500" />
            <span>Move to...</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* GR 2: Activity & QR */}
          <DropdownMenuItem className="cursor-pointer">
            <History className="mr-2 h-4 w-4 text-slate-500" />
            <span>See activity</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <QrCode className="mr-2 h-4 w-4 text-slate-500" />
            <span>Generate QR Code</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* GR 3: Management */}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsAddToReleaseOpen(true)}
          >
            <Archive className="mr-2 h-4 w-4 text-slate-500" />
            <span>Add to Release</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <CheckSquare className="mr-2 h-4 w-4 text-slate-500" />
            <span>Add to ToDo</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* GR 4: Checkin/out */}
          <DropdownMenuItem
            onClick={() => onToggleLock("LOCK")}
            className="cursor-pointer"
          >
            <Lock className="mr-2 h-4 w-4 text-slate-500" />
            <span>Checkin file(s)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onToggleLock("UNLOCK")}
            className="cursor-pointer"
          >
            <Unlock className="mr-2 h-4 w-4 text-slate-500" />
            <span>Checkout file(s)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* G5 5: Misc */}
          <DropdownMenuItem className="cursor-pointer">
            <FileDown className="mr-2 h-4 w-4 text-slate-500" />
            <span>Export to Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={onAddTags}>
            <Tags className="mr-2 h-4 w-4 text-slate-500" />
            <span>Add tags</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {renderAddToReleaseDialog()}
    </div>
  );
}

// Helper Component
function TooltipAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-gray-100 h-9 w-9"
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
