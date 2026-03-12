"use client";

import React, { useState } from "react";
import { Search, HelpCircle, Grid, User, Menu, BotMessageSquare } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/app/context/SidebarProvider";
import Image from "next/image";
import LogoImage from "@/public/images/system/logo-cde.webp";
import ChatbotPanel from "@/components/chatbot/ChatbotPanel";

export default function Header() {
  const { toggleSidebar, isCollapsed } = useSidebar();
  const projectName = "The Building";
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm flex-shrink-0">
        
        {/* LEFT */}
        <div className="flex items-center gap-4">

          <div className="w-[46px] border-r border-gray-300 flex justify-start items-center ml-2">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Menu size={20} />
            </button>
          </div>

          <Link href="/projects" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src={LogoImage}
                alt="CDE Logo"
                fill
                className="object-contain"
              />
            </div>

            <span className="text-[#0D062D] font-bold text-lg hidden sm:block">
              CDE
            </span>
          </Link>

          <div className="h-6 w-[1px] bg-gray-300"></div>

          <h1 className="text-gray-600 font-medium text-base">
            {projectName}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1">

          <HeaderIconBtn icon={<Search size={20} />} label="Search" />
          <HeaderIconBtn icon={<HelpCircle size={20} />} label="Help" />

          <HeaderIconBtn
            icon={<BotMessageSquare size={20} />}
            label="Chatbot"
            onClick={() => setIsChatOpen(!isChatOpen)}
            isActive={isChatOpen}
          />

          <HeaderIconBtn icon={<Grid size={20} />} label="Apps" />

          <button className="ml-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={18} />
          </button>
        </div>
      </header>

      {/* CHATBOT PANEL */}
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
  onClick,
  isActive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md ${
        isActive
          ? "text-[#004B7D] bg-gray-100"
          : "text-gray-500 hover:text-[#004B7D] hover:bg-gray-100"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}