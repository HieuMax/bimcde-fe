"use client";

import { Search, HelpCircle, Grid, User, Menu } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/app/context/SidebarProvider";
import Image from "next/image";
import LogoImage from "@/public/images/system/logo-cde.webp";

export default function Header() {
  const { toggleSidebar, isCollapsed } = useSidebar();
  const projectName = "The Building";
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* --- TOGGLE SIDEBAR --- */}
        <div className="w-[46px] border-r border-gray-300 flex justify-start items-center ml-2">
          <button
            onClick={toggleSidebar}
            className=" text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* LOGO & NAME */}
        <Link href="/projects" className="flex items-center gap-2 group">
          {/* Logo image */}
          <div className="relative w-8 h-8">
            <Image
              src={LogoImage}
              alt="CDE Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* Name */}
          <span className="text-[#0D062D] font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            CDE
          </span>
        </Link>

        <div className="h-6 w-[1px] bg-gray-300 mx-1 hidden sm:block"></div>

        <h1
          className="text-gray-600 font-medium text-base truncate max-w-[200px] sm:max-w-[300px]"
          title={projectName}
        >
          {projectName}
        </h1>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-1">
        <HeaderIconBtn icon={<Search size={20} />} label="Search" />
        <HeaderIconBtn icon={<HelpCircle size={20} />} label="Help" />
        <HeaderIconBtn icon={<Grid size={20} />} label="Apps" />
        <button className="ml-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}

function HeaderIconBtn({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="p-2 text-gray-500 hover:text-[#004B7D] hover:bg-gray-100 rounded-md transition-colors"
      title={label}
    >
      {icon}
    </button>
  );
}
