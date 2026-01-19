"use client";
import React from "react";
import {
  ArrowLeft,
  Download,
  Maximize,
  Hand,
  MousePointer,
  MoveRight,
  Cloud,
  Pentagon,
  RectangleHorizontal,
  Circle,
  Pencil,
  ChevronDown,
  LucideIcon, // Import thêm type LucideIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToolType } from "@/types/explorer";

interface DetailToolbarProps {
  name: string;
  activeTool: ToolType;
  onToolSelect: (t: ToolType) => void;
  onBack: () => void;
  onDownload: () => void;
  onToggleFullscreen?: () => void;
}

// --- 1. DI CHUYỂN COMPONENT NÀY RA NGOÀI ---
interface ToolBtnProps {
  tool: ToolType;
  icon: LucideIcon;
  title: string;
  activeTool: ToolType; // Phải truyền activeTool vào
  onToolSelect: (t: ToolType) => void; // Phải truyền hàm select vào
}

const ToolBtn = ({
  tool,
  icon: Icon,
  title,
  activeTool,
  onToolSelect,
}: ToolBtnProps) => (
  <button
    onClick={() => onToolSelect(tool)}
    title={title}
    className={`p-2 rounded transition ${
      activeTool === tool
        ? "bg-blue-100 text-blue-600"
        : "hover:bg-gray-100 text-gray-700"
    }`}
  >
    <Icon size={20} />
  </button>
);

// --- MAIN COMPONENT ---
export default function DetailToolbar({
  name,
  activeTool,
  onToolSelect,
  onBack,
  onDownload,
  onToggleFullscreen,
}: DetailToolbarProps) {
  return (
    <header className="w-full h-14 px-4 bg-white border-b border-slate-300 flex items-center justify-between shadow-sm z-50">
      {/* LEFT: Back & Name */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="font-semibold text-gray-700 truncate max-w-[200px]">
          {name}
        </div>
      </div>

      {/* CENTER: Drawing Tools */}
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          {/* Truyền props activeTool và onToolSelect vào component con */}
          <ToolBtn
            tool="hand"
            icon={Hand}
            title="Pan Tool (Hand)"
            activeTool={activeTool}
            onToolSelect={onToolSelect}
          />
          <ToolBtn
            tool="cursor"
            icon={MousePointer}
            title="Select Tool (Cursor)"
            activeTool={activeTool}
            onToolSelect={onToolSelect}
          />
        </div>

        <ToolBtn
          tool="pencil"
          icon={Pencil}
          title="Free Draw"
          activeTool={activeTool}
          onToolSelect={onToolSelect}
        />
        <ToolBtn
          tool="arrow"
          icon={MoveRight}
          title="Arrow"
          activeTool={activeTool}
          onToolSelect={onToolSelect}
        />

        {/* Shapes Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-1 p-2 rounded transition ${
                ["pentagon", "cloud", "rectangle", "circle"].includes(
                  activeTool
                )
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Cloud size={20} />
              <ChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onToolSelect("cloud")}>
              <Cloud className="w-4 h-4 mr-2" /> Cloud
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToolSelect("pentagon")}>
              <Pentagon className="w-4 h-4 mr-2" /> Pentagon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToolSelect("rectangle")}>
              <RectangleHorizontal className="w-4 h-4 mr-2" /> Rectangle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToolSelect("circle")}>
              <Circle className="w-4 h-4 mr-2" /> Circle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
        >
          <Maximize size={20} />
        </button>
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-100 rounded text-gray-700"
        >
          <Download size={20} />
        </button>
      </div>
    </header>
  );
}
