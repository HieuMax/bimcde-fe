import { cn } from "@/lib/utils";

/** Nút trigger filter — đồng bộ với ActivityTypeFilter */
export function activityFilterTriggerClassName(isActive: boolean) {
  return cn(
    "flex h-8 w-auto items-center gap-2 rounded-md border-0 px-2 font-medium text-sm shadow-none transition-colors focus:ring-0 data-[state=open]:bg-gray-100",
    isActive ? "font-semibold text-[#005F9E]" : "text-gray-600 hover:text-black",
  );
}

export const activityFilterCountBadgeClassName =
  "ml-1 flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-[#E6F4FF] px-1.5 text-[10px] font-bold text-[#005F9E]";

export const activityFilterChevronDownClassName =
  "ml-1 h-3 w-3 shrink-0 opacity-50";

/** Nội dung Popover filter */
export const activityFilterPopoverContentClassName =
  "w-[280px] border-0 bg-white p-0";

export const activityFilterPopoverScrollClassName =
  "max-h-[400px] overflow-y-auto py-2";

export const activityFilterClearRowButtonClassName =
  "h-8 w-full justify-start px-2 text-xs font-normal text-gray-500 hover:text-black";
