"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import LogoImage from "@/public/images/system/logo-cde.webp";
import { User, LogOut, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import { BellComponent } from "@/components/layout/navbar/notification-bell";

export default function ProjectsNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm flex-shrink-0 w-full">
      <div className="flex items-center gap-4">
        {/* LOGO & NAME */}
        <Link href="/projects" className="flex items-center gap-2 group ml-2">
          <div className="relative w-8 h-8">
            <Image
              src={LogoImage}
              alt="CDE Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[#0D062D] font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            BIMCDE
          </span>
        </Link>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-1 mt-auto mb-auto">
        <BellComponent />
        
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
  );
}
