"use client";
import "./sidebar.css";
import { useState } from "react";
import {
  Home,
  View,
  Folder,
  Package,
  ClockFading,
  CircleCheck,
  Users,
  ReceiptText,
  ShieldCheck,
  CircuitBoard,
  Blocks,
  BellRing,
  DraftingCompass,
  Tag,
  KeyRound,
  Repeat,
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowLeftToLine,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const [openData, setOpenData] = useState(true);
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <div className="sidebar">
      {/* Menu */}
      <nav className="sidebar-menu">
        <SidebarItem
          name="Home"
          icon={<Home size={20} />}
          href="/dashboard/home"
        />
        <div>
          <button
            onClick={() => setOpenData(!openData)}
            className="sidebar-dropdown-btn-1"
          >
            <div className="sidebar-dropdown-left">
              <Folder size={20} />
              <span>Data</span>
            </div>
            {openData ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {openData && (
            <div className="sidebar-submenu">
              <SidebarItem
                name="Explorer"
                icon={<Folder size={18} />}
                href="/dashboard/data/explorer"
                small
              />
              <SidebarItem
                name="Views"
                icon={<View size={18} />}
                href="/dashboard/data/views"
                small
              />
              <SidebarItem
                name="Releases"
                icon={<Package size={18} />}
                href="/dashboard/data/releases"
                small
              />
            </div>
          )}
        </div>

        <SidebarItem
          name="Activity"
          icon={<ClockFading size={20} />}
          href="/dashboard/activity"
        />
        <SidebarItem
          name="ToDo"
          icon={<CircleCheck size={20} />}
          href="/dashboard/todo"
        />
        <SidebarItem
          name="Team"
          icon={<Users size={20} />}
          href="/dashboard/team"
        />

        <div>
          <button
            onClick={() => setOpenSettings(!openSettings)}
            className="sidebar-dropdown-btn-2"
          >
            <div className="sidebar-dropdown-left">
              <Settings size={20} />
              <span>Settings</span>
            </div>
            {openSettings ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          {openSettings && (
            <div className="sidebar-submenu">
              <SidebarItem
                name="Project Details"
                icon={<ReceiptText size={18} />}
                href="/dashboard/settings/project-details"
                small
              />
              <SidebarItem
                name="BCF Topics"
                icon={<CircuitBoard size={18} />}
                href="/dashboard/settings/bcf-topics"
                small
              />
              <SidebarItem
                name="Units"
                icon={<DraftingCompass size={18} />}
                href="/dashboard/settings/units"
                small
              />
              <SidebarItem
                name="Tags"
                icon={<Tag size={18} />}
                href="/dashboard/settings/tags"
                small
              />
              <SidebarItem
                name="Permissions"
                icon={<KeyRound size={18} />}
                href="/dashboard/settings/permissions"
                small
              />
              <SidebarItem
                name="Sync"
                icon={<Repeat size={18} />}
                href="/dashboard/settings/sync"
                small
              />
            </div>
          )}
        </div>
        <div className="logout">
          <a href="#">
            <img className="user-img" src="/" alt="img" />
          </a>
          <div className="name">
            <p className="full-name">Tommi Xiao</p>
            <p className="email">Tommixiao79</p>
          </div>
          <SidebarItem
            name=""
            icon={<ArrowLeftToLine size={20} />}
            href="/logout"
          />
        </div>
      </nav>
    </div>
  );
}

function SidebarItem({
  name,
  icon,
  href,
  small,
}: {
  name: string;
  icon: React.ReactNode;
  href: string;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`sidebar-item ${small ? "sidebar-item-small" : ""}`}
    >
      {icon}
      <span>{name}</span>
    </Link>
  );
}
