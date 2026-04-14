"use client";

import {
  Search,
  HelpCircle,
  Grid,
  User,
  Menu,
  ExternalLink,
  LogOut,
  BotMessageSquare
} from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import { useSidebar } from "@/app/context/SidebarProvider";
import Image from "next/image";
import LogoImage from "@/public/images/system/logo-cde.webp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import { BellComponent } from "./navbar/notification-bell";
import ChatbotPanel from "@/components/chatbot/ChatbotPanel";

export default function Header() {
  const { toggleSidebar, isCollapsed } = useSidebar();
  const projectName = "The Building";
  const [isChatOpen, setIsChatOpen] = useState(false);


  const { user, logout, loading, error: authError, clearError } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* --- TOGGLE SIDEBAR --- */}
        <div className="w-[46px] border-r border-gray-300 flex justify-start items-center ml-2">
          <button
            onClick={toggleSidebar}
            className=" text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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
          title={projectName}>
          {projectName}
        </h1>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-1">
        <BellComponent></BellComponent>
        <HeaderIconBtn
          icon={<BotMessageSquare size={20} />}
          label="Chatbot"
          onClick={() => setIsChatOpen(!isChatOpen)}
          isActive={isChatOpen}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors">
              <User size={18} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-0">
            {/* Profile */}
            <div className="flex flex-col items-center py-4 border-b">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mb-2">
                <User size={24} />
              </div>
              <p className="font-medium">{user?.fullName || "User"}</p>
              <p className="text-sm text-gray-500">{user?.email || ""}</p>
            </div>

            {/* Menu items */}
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex justify-between items-center w-full cursor-pointer">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Profile
                </div>
                <ExternalLink size={16} />
              </Link> 
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center gap-2 text-red-500 cursor-pointer"
              onClick={onLogout}>
              <LogOut size={16} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

      <ChatbotPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}

function HeaderIconBtn({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-500 hover:text-[#004B7D] hover:bg-gray-100 rounded-md transition-colors"
      title={label}>
      {icon}
    </button>
  );
}
