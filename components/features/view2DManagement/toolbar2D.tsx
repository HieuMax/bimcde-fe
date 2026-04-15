"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  MoreHorizontal,
  Maximize,
  Minimize,
  FolderSearch,
  View,
  CircleCheckBig,
  Package,
  Share,
  SendHorizonalIcon,
  CalendarPlus2,
  ImagePlus,
  MousePointer,
  HandMetal,
  Hand,
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
  name: string;
  onBack: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onShare?: () => void;
  canShare?: boolean;
  onOpenViewPanel?: () => void;
  onOpenTodoPanel?: () => void;
  canDownload?: boolean;
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

export default function DetailToolbar({
  onToggleFullscreen,
  isFullscreen = false,
  onShare,
  onOpenTodoPanel,
  onOpenViewPanel,
  activeTool,
  activeColor,
  showAnnotation,
  onChangeColor,
  onToolSelect,
  onDownload,
  onToggleAnnotation,
}: DetailToolbarProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;

  const [showNavMenu, setShowNavMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNavMenu(false);
      }
    }
    if (showNavMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNavMenu]);

  const navigationItems = [
    {
      id: "explorer",
      label: "Explorer",
      icon: FolderSearch,
      path: `/projects/${projectId}/data/folder`,
    },
    {
      id: "views",
      label: "Views",
      icon: View,
      path: `/projects/${projectId}/data/views`,
    },
    {
      id: "todo",
      label: "ToDo",
      icon: CircleCheckBig,
      path: `/projects/${projectId}/todo`,
    },
    {
      id: "releases",
      label: "Releases",
      icon: Package,
      path: `/projects/${projectId}/data/releases`,
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowNavMenu(false);
  };

  return (
    <header className="w-full h-12 bg-white border-b border-slate-300 flex items-center px-1">
      <div className="flex items-center h-full">
        {/* ===== BACK + MENU ===== */}
        <div className="relative h-full flex items-center" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowNavMenu(!showNavMenu)}
            className="h-10 px-3 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {showNavMenu && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-md shadow-lg z-50 py-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item.path)}
                    className="w-full px-3 py-2 flex items-center gap-3 text-sm hover:bg-blue-50"
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-300 mx-2" />

        {/* ===== TOOLS ===== */}
        <div className="flex items-center gap-1">
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

        <div className="w-px h-6 bg-slate-300 mx-2" />
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
        <div className="w-px h-6 bg-slate-300 mx-2" />

        <div className="flex items-center gap-1 z-10">
          <ToolButton icon={<Share size={18} />} />
          <ToolButton icon={<CircleCheckBig size={18} />} />
          <ToolButton icon={<View size={18} />} />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-2" />

        {/* ===== CREATE ===== */}
        <div className="flex items-center gap-1 z-10">
          <ToolButton
            icon={<ImagePlus size={18} />}
            onClick={() => onOpenViewPanel?.()}
          />
          <ToolButton
            icon={<CalendarPlus2 size={18} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenTodoPanel?.();
            }}
          />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-2" />

        {/* ===== SHARE ===== */}
        <div className="flex items-center gap-1">
          <ToolButton
            icon={<SendHorizonalIcon size={18} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare?.();
            }}
          />
          <ToolButton icon={<MoreHorizontal size={18} />} />
        </div>
      </div>

      {/* ===== FULLSCREEN ===== */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        className={`
          w-12 h-10 flex items-center justify-center
          rounded-lg transition text-gray-700
          ${isFullscreen ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}
        `}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={18} />}
      </button>

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

function ToolButton({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-9 h-9
        flex items-center justify-center
        rounded
        text-gray-600
        hover:bg-gray-100
        transition
        pointer-events-auto
      "
    >
      {icon}
    </button>
  );
}
