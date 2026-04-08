"use client";
import React from "react";
import {
  Download,
  Maximize,
  Hand,
  MousePointer,
  MoveRight,
  ALargeSmall,
  Cloud,
  Pentagon,
  RectangleHorizontal,
  Circle,
  Pencil,
  ChevronDown,
  Ruler,
  Eye,
  EyeOff,
  LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToolType } from "@/types/view2d";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#3b82f6",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#000000",
];

interface DetailToolbarProps {
  activeTool: ToolType;
  onToolSelect: (t: ToolType) => void;
  onDownload: () => void;
  showAnnotation: boolean;
  onToggleAnnotation: () => void;
  activeColor: string;
  onChangeColor: (color: string) => void;
}

interface ToolBtnProps {
  tool: ToolType;
  icon: LucideIcon;
  title: string;
  activeTool: ToolType;
  onToolSelect: (t: ToolType) => void;
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

const ColorPickerButton = ({
  activeColor,
  onChangeColor,
}: {
  activeColor: string;
  onChangeColor: (c: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded hover:bg-gray-100 border border-gray-300 bg-white"
        title="Change color"
      >
        <span
          className="block w-4 h-4 rounded-full"
          style={{ backgroundColor: activeColor }}
        />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-2 flex flex-col gap-2 z-50">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChangeColor(c);
                setOpen(false);
              }}
              className={`w-6 h-6 rounded-full border ${c === activeColor ? "ring-2 ring-blue-500" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT
export default function DrawingToolBar({
  activeTool,
  activeColor,
  showAnnotation,
  onChangeColor,
  onToolSelect,
  onDownload,
  onToggleAnnotation,
}: DetailToolbarProps) {
  return (
    <header className="w-full h-14 px-4 bg-white border-b border-slate-300 flex items-center justify-between shadow-sm z-50">
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
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
        <ToolBtn
          tool="measure"
          icon={Ruler}
          title="Measure Distance"
          activeTool={activeTool}
          onToolSelect={onToolSelect}
        />
        <ToolBtn
          tool="text"
          icon={ALargeSmall}
          title="Text Box"
          activeTool={activeTool}
          onToolSelect={onToolSelect}
        />
        <ColorPickerButton
          activeColor={activeColor}
          onChangeColor={onChangeColor}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-1 p-2 rounded transition ${["pentagon", "cloud", "rectangle", "circle"].includes(activeTool) ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
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

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAnnotation}
          className={`p-2 rounded transition ${!showAnnotation ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-700"}`}
          title={showAnnotation ? "Hide Annotations" : "Show Annotations"}
        >
          {showAnnotation ? <Eye size={20} /> : <EyeOff size={20} />}
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
