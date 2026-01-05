"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  History,
  Layers,
  ListTree,
  ListTodo,
  Eye,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SidebarView() {
  const pathname = usePathname();

  // Danh sách menu mới
  const menuItems = [
    { icon: AlertCircle, label: "File detail", href: "#detail" },
    { icon: History, label: "Revision", href: "#revision" },
    { icon: Layers, label: "Pages", href: "#pages" },
    { icon: ListTree, label: "Outline", href: "#outline" },
    { icon: ListTodo, label: "Todo", href: "#todo" },
    { icon: Eye, label: "Views", href: "#views" },
    { icon: Search, label: "Search", href: "#search" },
  ];

  return (
    <div className="flex h-full w-16 flex-col items-center justify-between border-r bg-white py-4 shadow-sm z-30">
      {/* Top Section: Logo & Menu */}
      <div className="flex w-full flex-col items-center gap-6">
        {/* Logo nhỏ */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md">
          B
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-2 w-full px-2">
          <TooltipProvider delayDuration={0}>
            {menuItems.map((item, index) => {
              // Logic active tạm thời: nếu href trùng hash hoặc bạn có logic khác
              const isActive = false;

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      // Chuyển từ Link sang button vì đây giống các tab chức năng hơn
                      onClick={() => console.log("Clicked:", item.label)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <item.icon size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4 items-center w-full px-2">
        <div className="h-[1px] w-8 bg-gray-200" />

        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
          <Settings size={20} />
        </button>

        <button className="group flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}
