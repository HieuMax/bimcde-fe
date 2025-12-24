// app/projects/[projectId]/ProjectHome.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import ProjectSidebar from '@/app/components/UI/sidebar';
import Explorer from '@/app/components/DataComponent/explorer/explorer';
import Views from '@/app/components/DataComponent/View/views';
import PropertiesPanel from '@/app/components/DataComponent/properties/data';
import ToDoPropertiesPanel from '@/app/components/DataComponent/properties/todo';
import { getProjectById } from '@/app/types/api';
import { Project } from '@/app/types/api';
import { ExplorerItem } from '@/app/types/api';

export default function ProjectHome() {
  // const params = useParams();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<'explorer' | 'views' | 'releases' | 'todo'>('explorer');
    
  type SelectedItem =
    | { type: 'todo'; data: unknown }
    | { type: 'file' | 'folder' | 'view' | 'release'; data: unknown }
    | null;
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const handleOpenExplorerItem = (item: ExplorerItem) => {
    setSelectedItem({
      type: item.type === 'folder' ? 'folder' : 'file',
      data: item,
    });
  };
  
  // ===== LOAD PROJECT =====
  useEffect(() => {
    if (!projectId) return;

    async function loadProject() {
      try {
        setLoading(true);
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (err: unknown) {
        setError('Failed to load project');
      }
       finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  // reset right panel when switching tab
  useEffect(() => {
    setSelectedItem(null);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        {error || 'Project not found'}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <div className="flex-none h-full">
        <ProjectSidebar
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as any)}
          projectName={project.name}
        />
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          {/* CENTER CONTENT */}
          <main className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full min-h-0 flex flex-col">
              {activeTab === 'explorer' && (
                <Explorer projectId={projectId} onOpenPanel={handleOpenExplorerItem} />
              )}
              {activeTab === 'views' && (
                <Views projectId={projectId} onOpenPanel={handleOpenExplorerItem} />
              )}
            </div>
          </main>

          {/* RIGHT PANEL */}
          {selectedItem && (
            <aside className="w-80 shrink-0 flex flex-col min-h-0 h-full bg-white panel-shadow">
              {selectedItem.type === 'todo' ? (
                <ToDoPropertiesPanel
                  selected={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  onEdit={() => {}}
                  onDownload={() => {}}
                />
              ) : (
                <PropertiesPanel
                  selected={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  onDownload={() => {}}
                  onPermission={() => {}}
                  onShare={() => {}}
                />
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
