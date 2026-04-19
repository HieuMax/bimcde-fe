// components/features/sidebar/config.ts
import {
  History,
  MessageSquare,
  ClipboardCheck,
  Users,
  LayoutTemplate,
  Ruler,
  Tag,
  Key,
} from "lucide-react";

export type SidebarItemConfig = {
  key: string;
  label: string;
  icon: React.ElementType;
  pathSegment: string;
};

export const MAIN_MENU_ITEMS: SidebarItemConfig[] = [
  {
    key: "activity",
    label: "Activity",
    icon: History,
    pathSegment: "activity",
  },
  {
    key: "topics",
    label: "BCF Topics",
    icon: MessageSquare,
    pathSegment: "topics",
  },
  { key: "todo", label: "ToDo", icon: ClipboardCheck, pathSegment: "todo" },
  { key: "team", label: "Team", icon: Users, pathSegment: "team" },
];

export const SETTINGS_ITEMS: SidebarItemConfig[] = [
  {
    key: "details",
    label: "Project Details",
    icon: LayoutTemplate,
    pathSegment: "settings/details",
  },
  {
    key: "topics",
    label: "BCF Topics",
    icon: MessageSquare,
    pathSegment: "settings/topics",
  },
  {
    key: "units",
    label: "Units",
    icon: Ruler,
    pathSegment: "settings/units",
  },
  {
    key: "tags",
    label: "Tags",
    icon: Tag,
    pathSegment: "settings/tags",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: Key,
    pathSegment: "settings/permissions",
  }
];
