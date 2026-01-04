// components/features/sidebar/config.ts
import {
  History,
  MessageSquare,
  LifeBuoy,
  ClipboardCheck,
  Users,
  Library,
  LayoutTemplate,
  ShieldCheck,
  Bell,
  LayoutGrid,
  Ruler,
  Tag,
  Key,
  RefreshCw,
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
  {
    key: "shared-model",
    label: "Shared Model",
    icon: LifeBuoy,
    pathSegment: "shared-model",
  },
  { key: "todo", label: "ToDo", icon: ClipboardCheck, pathSegment: "todo" },
  { key: "team", label: "Team", icon: Users, pathSegment: "team" },
  {
    key: "libs",
    label: "Property Set Libraries",
    icon: Library,
    pathSegment: "property-set-libraries",
  },
];

export const SETTINGS_ITEMS: SidebarItemConfig[] = [
  {
    key: "details",
    label: "Project Details",
    icon: LayoutTemplate,
    pathSegment: "settings/details",
  },
  {
    key: "permissions-overview",
    label: "Permissions Overview",
    icon: ShieldCheck,
    pathSegment: "settings/permissions-overview",
  },
  {
    key: "topics",
    label: "BCF Topics",
    icon: MessageSquare,
    pathSegment: "settings/topics",
  },
  {
    key: "extensions",
    label: "Extensions",
    icon: LayoutGrid,
    pathSegment: "settings/extensions",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    pathSegment: "settings/notifications",
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
  },
  {
    key: "sync",
    label: "Sync",
    icon: RefreshCw,
    pathSegment: "settings/sync",
  },
];
