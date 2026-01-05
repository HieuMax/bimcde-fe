"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Hand,
  MousePointer,
  MoveHorizontal,
  MoveVertical,
  MoveDownRight,
  Pencil,
  Type,
  Palette,
  Camera,
  FilePlus,
  Eye,
  Printer,
  Download,
  Play,
  MoreVertical,
  Maximize,
  Cloud,
  RectangleHorizontal,
  Circle,
  Pentagon,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToolType } from "@/types/tool";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

export default function FileViewerToolbar({
  activeTool,
  onToolSelect,
}: ToolbarProps) {
  const [SelectedIcon, setSelectedIcon] = useState<LucideIcon>(Cloud);

  const handleSelected = (icon: LucideIcon, tool: ToolType) => {
    setSelectedIcon(icon);
    onToolSelect(tool);
  };
  return (
    <div className=" w-full fixed z-50 h-12 flex items-center gap-1 border-b bg-background px-2 py-1">
      {/* Back */}
      <Button variant="ghost" size="icon">
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Navigation tools */}
      <Button
        variant={activeTool === "hand" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolSelect("hand")}
      >
        <Hand className="w-4 h-4" />
      </Button>
      <Button
        variant={activeTool === "cursor" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolSelect("cursor")}
      >
        <MousePointer className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Transform */}
      <Button
        variant={activeTool === "arrow" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolSelect("arrow")}
      >
        <MoveDownRight className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <MoveVertical className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={
              ["pentagon", "cloud", "rectangle", "circle"].includes(activeTool)
                ? "secondary"
                : "ghost"
            }
            className="flex items-center gap-1 h-9 px-2"
          >
            <SelectedIcon className="w-4 h-4 text-blue-600 transition-all duration-300" />
            <ChevronDown className="w-3 h-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-48 bg-white shadow-lg border z-50"
        >
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => handleSelected(Pentagon, "pentagon")}
          >
            <Pentagon className="w-4 h-4 text-blue-600" />
            <span>Pentagon(P)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => handleSelected(Cloud, "cloud")}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>Cloud(C)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => handleSelected(RectangleHorizontal, "rectangle")}
          >
            <RectangleHorizontal className="w-4 h-4 text-blue-600" />
            <span>Rectangle(R)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-1"
            onClick={() => handleSelected(Circle, "circle")}
          >
            <Circle className="w-4 h-4 text-blue-600" />
            <span> Oval(O)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant={activeTool === "pencil" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolSelect("pencil")}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Type className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Palette className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Utilities */}
      <Button variant="ghost" size="icon">
        <Camera className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <FilePlus className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Eye className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Printer className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Download className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Play className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* More */}
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>

      <div className="flex-1" />

      {/* Fullscreen */}
      <Button variant="ghost" size="icon">
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}
