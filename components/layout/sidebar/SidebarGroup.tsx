"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarGroupProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasActiveChild?: boolean;
}

export default function SidebarGroup({
  icon,
  label,
  isCollapsed,
  isExpanded,
  onToggle,
  children,
  hasActiveChild = false,
}: SidebarGroupProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownTop, setDropdownTop] = useState(0);

  useEffect(() => {
    if (isCollapsed) {
      if (isExpanded) {
        if (triggerRef.current) {
          setDropdownTop(triggerRef.current.getBoundingClientRect().top);
          setShowDropdown(true);
        }
      }
    } else {
      setShowDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);

  if (!isCollapsed && showDropdown) {
    setShowDropdown(false);
  }

  const handleClick = () => {
    if (isCollapsed) {
      if (triggerRef.current) {
        setDropdownTop(triggerRef.current.getBoundingClientRect().top);
      }
      setShowDropdown(!showDropdown);
    } else {
      onToggle();
    }
  };

  const isParentActive = hasActiveChild && (!isExpanded || isCollapsed);

  return (
    <div className="w-full">
      {/* Header */}
      <div
        ref={triggerRef}
        onClick={handleClick}
        className={cn(
          "flex items-center h-10 cursor-pointer transition-colors border-l-4 border-transparent pr-2 select-none",
          "text-[#0F2332] hover:bg-[#1D3F52]/5 hover:text-[#1D3F52]",
          isCollapsed ? "pr-0" : "",
          isParentActive
            ? "bg-[#1D3F52]/10 text-[#1D3F52] font-semibold border-l-[#1D3F52]"
            : "text-[#0F2332] hover:bg-[#1D3F52]/5 hover:text-[#1D3F52] font-normal border-transparent"
        )}
        role="button"
        title={label}
      >
        <div className="w-[60px] h-full flex items-center justify-center flex-shrink-0 relative">
          {icon}
          {isCollapsed && (
            <ChevronDown
              size={10}
              className="absolute right-2 bottom-2 text-white/70"
            />
          )}
        </div>

        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between overflow-hidden animate-in fade-in duration-300">
            <span>{label}</span>
            {isExpanded ? (
              <ChevronUp className="mr-2" size={16} />
            ) : (
              <ChevronDown className="mr-2" size={16} />
            )}
          </div>
        )}
      </div>

      {/* Content Logic */}
      {isCollapsed ? (
        showDropdown && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setShowDropdown(false)}
            />
            <div
              style={{ top: dropdownTop }}
              className="fixed left-[70px] w-56 bg-white border border-gray-200 shadow-xl rounded-r-md z-[70] flex flex-col animate-in slide-in-from-left-2 duration-200"
            >
              <div className="px-4 py-3 text-xs font-semibold text-[#1D3F52]/70 uppercase tracking-wider border-b border-gray-100">
                {label}
              </div>
              {children}
            </div>
          </>
        )
      ) : (
        <div
          className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
