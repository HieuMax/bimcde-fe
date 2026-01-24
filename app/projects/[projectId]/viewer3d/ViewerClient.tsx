'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { Box, Layers, ClipboardCheck, ChevronRight, ChevronLeft, Camera, FolderTree, Sheet, BadgeInfo, BookText } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar/Navbar';
import { NewTodoDrawer } from '@/components/todos/NewTodoDrawer';

interface SelectedItem {
  modelID?: string;
  fileUrl?: string;
  expressID?: string;
}

interface NewTodoInitialData {
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  title?: string;
}

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams()
  const searchParams = useSearchParams();

  const [state, setState] = React.useState('models');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<NewTodoInitialData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const captureViewRef = React.useRef<() => any>(null);
  const ctaBtn = [
    { icon: <Box />, label: 'models' },
    { icon: <Layers />, label: 'layers' },
    { icon: <ClipboardCheck />, label: 'todos' },
    { icon: <Camera />, label: 'views' },
    { icon: <FolderTree />, label: 'organizer' },
    { icon: <Sheet />, label: 'data-table' },
    { icon: <BookText />, label: 'topics' },
    { icon: <BadgeInfo />, label: 'clash-sets' },
  ];

  const handleRegisterCapture = (captureFn: () => any) => {
    captureViewRef.current = captureFn;
  };

  const ifcUrls = useMemo(() => {
    const raw = searchParams.get('urls');
    if (!raw) return [];

    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return [];
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push(`/projects/${projectId}/data`);
  };

  const handleRefresh = () => {
    console.log("Refresh Action Clicked");
  };

  const onAddTodo = () => {
    let viewState = null;
    if (captureViewRef.current) {
      viewState = captureViewRef.current(); // Lấy view hiện tại
    }
    if (selectedItems.length > 0) {
      // console.log('Selected items:', selectedItems);
      const grouped = new Map();
      selectedItems.forEach(item => {
        const key = `${item.fileUrl}-${item.modelID}`;
        if (!grouped.has(key)) {
          grouped.set(key, { fileUrl: item.fileUrl || '', modelId: String(item.modelID || ''), expressId: [] });
        }
        grouped.get(key).expressId.push(String(item.expressID || ''));
      });
      const items = Array.from(grouped.values());
      // console.log('Grouped items:', items);
      const initialData = {
        items,
        title: `Issue on ${selectedItems.length > 1 ? `${selectedItems.length} items` : `#${items[0]?.expressId[0] || ''}`}`,
        viewState: viewState
      };
      setDrawerInitialData(initialData);
      setIsDrawerOpen(true);

      // alert(`Selected ${selectedItems.length} item(s)`);
    } else {
      setIsDrawerOpen(true);
    }
  };

  useEffect(() => {
    if (!ifcUrls.length) return;

    router.replace(`/projects/${projectId}/viewer3d`, { scroll: false });
  }, [ifcUrls, router]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAddTodo={onAddTodo}
      />
      {/* handle navbar and extend when click item can create todo related to it */}
      <div className="flex flex-1">
        <div className="w-10 min-h-full bg-gray-200">
          <div className="mt-[150]">
            <span
              className={`flex justify-center cursor-pointer py-3 mb-2 text-black hover:bg-slate-600 hover:text-white`}
            >
              {isCollapsed ? (
                <ChevronRight
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsCollapsed(false)}
                />
              ) : (
                <ChevronLeft style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)} />
              )}
            </span>

            {ctaBtn.map((item, index) => {
              const isActive = state == item.label;

              return (
                <span
                  key={index}
                  className={`flex justify-center cursor-pointer py-3 mb-2 ${isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-black hover:bg-slate-600 hover:text-white'
                    }`}
                  onClick={() => setState(item.label)}
                >
                  {item.icon}
                </span>
              );
            })}
          </div>
        </div>
        <div className="w-full h-full overflow-hidden">
          <IfcViewer
            setSelectdItemsForNavbar={setSelectedItems}
            isCollapsed={isCollapsed}
            ifcUrls={ifcUrls}
            state={state}
            projectId={projectId}
            onRegisterCapture={handleRegisterCapture}
          />
        </div>
      </div>

      <NewTodoDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        projectId={projectId as string}
        mode="create"
        initialData={drawerInitialData}
      />
    </div>
  );
}
