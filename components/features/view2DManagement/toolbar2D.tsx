'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
} from 'lucide-react';

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
}

export default function DetailToolbar({
  onToggleFullscreen,
  isFullscreen = false,
  onShare,
  onOpenTodoPanel,
  onOpenViewPanel,
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
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNavMenu]);

  const navigationItems = [
    { id: 'explorer', label: 'Explorer', icon: FolderSearch, path: `/projects/${projectId}/data/folder` },
    { id: 'views', label: 'Views', icon: View, path: `/projects/${projectId}/data/views` },
    { id: 'todo', label: 'ToDo', icon: CircleCheckBig, path: `/projects/${projectId}/todo` },
    { id: 'releases', label: 'Releases', icon: Package, path: `/projects/${projectId}/data/releases` },
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
          <ToolButton icon={<HandMetal size={18} />} />
          <ToolButton icon={<MousePointer size={18} />} />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-2" />

        <div className="flex items-center gap-1 z-10">
          <ToolButton icon={<Share size={18} />} />
          <ToolButton icon={<CircleCheckBig size={18} />} />
          <ToolButton icon={<View size={18} />} />
          <ToolButton icon={<Download size={18} />} />
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
          ${isFullscreen ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
        `}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={18} />}
      </button>
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
