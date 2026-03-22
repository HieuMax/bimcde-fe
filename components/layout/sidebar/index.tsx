"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  ChevronRight,
  Camera,
  Box,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/app/context/SidebarProvider";

// Imports
import { MAIN_MENU_ITEMS, SETTINGS_ITEMS } from "./config";
import { useSidebarLogic } from "./useSidebarLogic";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import ExplorerView from "./ExplorerView";

type SidebarMode = "main" | "explorer";

export default function Sidebar() {
  const { isCollapsed } = useSidebar();
  const { projectId, basePath, pathname, checkIsActive } = useSidebarLogic();
  const searchParams = useSearchParams();

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("main");
  const [expandState, setExpandState] = useState({
    data: true,
    settings: false,
  });

  if (!projectId) return null;

  const dataPath = `${basePath}/data`;
  const sidebarWidthClass = isCollapsed
    ? "w-[70px]"
    : "fixed inset-x-0 bottom-0 top-14 z-40 w-full sm:relative sm:top-auto sm:inset-auto sm:w-64 sm:z-auto";

  // --- LOGIC ACTIVE CHILD ---
  const isExplorerActive = pathname === dataPath;
  const isViewsActive = pathname?.startsWith(`${dataPath}/views`);
  const isReleasesActive = pathname?.startsWith(`${dataPath}/releases`);
  const hasActiveDataChild =
    isExplorerActive || isViewsActive || isReleasesActive;

  const hasActiveSettingsChild = SETTINGS_ITEMS.some((item) =>
    checkIsActive(item.pathSegment),
  );

  // --- RENDER 1: EXPLORER MODE ---
  if (sidebarMode === "explorer" && !isCollapsed) {
    const isRootActive = pathname === dataPath && !searchParams.get("folderId");
    return (
      <ExplorerView
        projectId={projectId}
        widthClass={sidebarWidthClass}
        dataPath={dataPath}
        isRootActive={isRootActive}
        onClose={() => setSidebarMode("main")}
      />
    );
  }

  // --- RENDER 2: MAIN MODE ---
  return (
    <aside
      className={cn(
        "bg-[#F0F4F6] text-[#0F2332] flex flex-col h-full select-none font-sans text-sm border-r border-gray-300/70 transition-all duration-300 relative z-40",
        sidebarWidthClass,
      )}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 overflow-x-hidden">
        {/* HEADER: All Projects */}
        <div className="flex-none">
          <Link
            href="/projects"
            className={cn(
              "flex items-center gap-3 py-5 hover:bg-white/10 transition-all duration-300 border-l-4 border-transparent overflow-hidden whitespace-nowrap",
              isCollapsed ? "pl-[21px]" : "pl-4",
            )}
            title="All Projects"
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            <span
              className={cn(
                "font-medium text-[15px] transition-all duration-300",
                isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
              )}
            >
              All Projects
            </span>
          </Link>
        </div>

        <nav className="py-1 space-y-0.5 pb-20">
          {/* === DASHBOARD ITEM === */}
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            href={`${basePath}`}
            isActive={pathname === basePath}
            isCollapsed={isCollapsed}
          />
          {/* === GROUP: DATA === */}
          <SidebarGroup
            icon={<Folder size={18} />}
            label="Data"
            isCollapsed={isCollapsed}
            isExpanded={expandState.data}
            hasActiveChild={hasActiveDataChild}
            onToggle={() =>
              setExpandState((prev) => ({ ...prev, data: !prev.data }))
            }
          >
            {/* Explorer Item */}
            <SidebarItem
              icon={<FolderOpen size={18} />}
              label="Explorer"
              href={dataPath}
              isActive={pathname === dataPath}
              isCollapsed={false}
              indent={!isCollapsed}
              rightElement={
                !isCollapsed && (
                  <div
                    className={cn(
                      "flex items-center h-full ml-2 pl-1",
                      isExplorerActive
                        ? "border-l border-[#1D3F52]/30"
                        : "border-l border-[#1D3F52]/20",
                    )}
                  >
                    <div
                      className={cn(
                        "p-1 rounded cursor-pointer transition-colors flex items-center gap-0.5",
                        isExplorerActive
                          ? "text-[#1D3F52] hover:bg-[#1D3F52]/10"
                          : "text-[#0F2332] hover:text-[#1D3F52] hover:bg-[#1D3F52]/10",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        setSidebarMode("explorer");
                      }}
                      title="Open Folder Tree"
                    >
                      <Folder size={14} className="fill-current" />
                      <ChevronRight size={14} />
                    </div>
                  </div>
                )
              }
            />

            {/* Other Data Items */}
            <SidebarItem
              icon={<Camera size={18} />}
              label="Views"
              href={`${dataPath}/views`}
              isActive={pathname?.startsWith(`${dataPath}/views`)}
              isCollapsed={false}
              indent={!isCollapsed}
            />
            <SidebarItem
              icon={<Box size={18} />}
              label="Releases"
              href={`${dataPath}/releases`}
              isActive={pathname?.startsWith(`${dataPath}/releases`)}
              isCollapsed={false}
              indent={!isCollapsed}
            />
          </SidebarGroup>

          {/* === MAIN ITEMS LOOP === */}
          {MAIN_MENU_ITEMS.map((item) => (
            <SidebarItem
              key={item.key}
              icon={<item.icon size={18} />}
              label={item.label}
              href={`${basePath}/${item.pathSegment}`}
              isActive={checkIsActive(item.pathSegment)}
              isCollapsed={isCollapsed}
            />
          ))}

          {/* === GROUP: SETTINGS === */}
          <div className="pt-1">
            <SidebarGroup
              icon={<Settings size={18} />}
              label="Settings"
              isCollapsed={isCollapsed}
              isExpanded={expandState.settings}
              hasActiveChild={hasActiveSettingsChild}
              onToggle={() =>
                setExpandState((prev) => ({
                  ...prev,
                  settings: !prev.settings,
                }))
              }
            >
              {SETTINGS_ITEMS.map((item) => (
                <SidebarItem
                  key={item.key}
                  icon={<item.icon size={18} />}
                  label={item.label}
                  href={`${basePath}/${item.pathSegment}`}
                  isActive={checkIsActive(item.pathSegment)}
                  isCollapsed={false}
                  indent={!isCollapsed}
                />
              ))}
            </SidebarGroup>
          </div>
        </nav>
      </div>
    </aside>
  );
}
