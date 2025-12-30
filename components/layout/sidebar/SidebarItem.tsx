"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  indent?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  rightElement?: React.ReactNode;
}

const SidebarItem = ({
  icon,
  label,
  href,
  isActive,
  isCollapsed,
  indent,
  onClick,
  rightElement,
}: SidebarItemProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center h-10 text-sm transition-colors duration-200 ease-in-out border-l-4 overflow-hidden whitespace-nowrap group relative",
        isActive
          ? "bg-[#1D3F52]/10 text-[#1D3F52] font-semibold border-l-[#1D3F52]"
          : "border-transparent text-[#0F2332] hover:bg-[#1D3F52]/5 hover:text-[#1D3F52] hover:border-l-[#1D3F52]/30",
        !isCollapsed && indent ? "pl-6" : "pl-0"
      )}
    >
      {/* Icon Container */}
      <div className="w-[60px] h-full flex items-center justify-center flex-shrink-0">
        {icon}
      </div>

      {/* Label */}
      <div
        className={cn(
          "flex-1 flex items-center justify-between pr-1 transition-none min-w-0",
          isCollapsed
            ? "opacity-0 translate-x-[-10px] w-0"
            : "opacity-100 translate-x-0 w-auto"
        )}
      >
        <span className="truncate">{label}</span>
        {rightElement}
      </div>
    </Link>
  );
};

export default memo(SidebarItem);
