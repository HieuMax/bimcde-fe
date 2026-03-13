"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

type DropdownItem = {
  label: string;
  checked?: boolean;
  className?: string;

  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
};

type DropdownProps = {
  label?: string;
  items: DropdownItem[];
  type: "checkbox" | "item";
  icon?: ReactNode;
};
const CustomDropdown = ({ label, items, type, icon }: DropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="focus-visible:ring-0">
          {label && label} {icon && icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuSeparator />
        {items.map((item, index) =>
          type === "checkbox" ? (
            <DropdownMenuCheckboxItem
              key={index}
              checked={item.checked}
              onCheckedChange={item.onCheckedChange}
              className={`cursor-pointer ${item.className}`}>
              {item.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={`cursor-pointer h-12 ${item.className}`}>
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomDropdown;
