'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Activity, 
  MessageSquare, 
  Share2, 
  Users, 
  Layers, 
  Settings,
  ChevronDown,
  ChevronLeft,
  FolderOpen,
  FolderSearch,
  View,
  CircleCheckBig
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'data', 
    label: 'Data', 
    icon: FolderOpen,
    children: [
      { id: 'explorer', label: 'Explorer', icon: FolderSearch },
      { id: 'views', label: 'Views', icon: View },
      { id: 'releases', label: 'Releases', icon: Package },
    ]
  },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'bcf', label: 'BCF Topics', icon: MessageSquare },
  { id: 'shared', label: 'Shared Model', icon: Share2 },
  { id: 'todo', label: 'ToDo', icon: CircleCheckBig },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'properties', label: 'Property Set Libraries', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  projectName?: string;
}

export default function ProjectSidebar({ activeTab, onTabChange }: ProjectSidebarProps) {
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['data']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleAllProjects = () => {
    router.push('/');
  };

  return (
    <div className="w-64 h-full bg-[#00437b] text-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-white-700 space-y-2">
        <button
          onClick={handleAllProjects}
          className="flex items-center gap-2 w-full text-sm font-semibold hover:bg-blue-800 p-2 rounded-lg transition-colors text-white"
          title="Back to all projects"
        >
          <ChevronLeft size={18} />
          <span>All Projects</span>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isMenuExpanded = expandedMenus.includes(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.id);
                  } else {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white border-l-4 border-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {hasChildren && (
                  <ChevronDown
                    size={18}
                    className={`transition-transform shrink-0 ${
                      isMenuExpanded ? 'rotate-180' : '-rotate-90'
                    }`}
                  />
                )}
                {!hasChildren && <div className="w-6" />}
                <Icon size={18} />
                <span>{item.label}</span>
              </button>

              {hasChildren && isMenuExpanded && (
                <div>
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = activeTab === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.id)}
                        className={`w-full flex items-center gap-3 px-4 pl-14 py-2.5 text-sm font-medium transition-colors ${
                          isChildActive
                            ? 'bg-blue-700 text-white border-l-4 border-white'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <ChildIcon size={16} />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
