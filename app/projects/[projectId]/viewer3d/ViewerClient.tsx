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

const areArraysEqual = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((value, index) => value === sorted2[index]);
};

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams()
  const searchParams = useSearchParams();

  const [state, setState] = React.useState('models');
  const [ifcUrls, setIfcUrls] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<NewTodoInitialData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [pendingTodo, setPendingTodo] = useState<{ todo: any, mode: "view" | "edit" } | null>(null);  // const viewerActions = React.useRef<any>(null);
  const viewerActions = React.useRef<{ capture: () => any; restore: (state: any, items: any[]) => void } | null>(null);

  const [todoToEdit, setTodoToEdit] = useState<any>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "view" | "edit">("create");

  const handleOpenTodoDrawer = (todo: any, mode: "view" | "edit" | "create") => {
    if (mode === 'create') {
      onAddTodo();
      return;
    }

    let targetUrls: string[] = [];
    if (todo.items && todo.items.length > 0) {
      targetUrls = Array.from(new Set(todo.items.map((i: any) => i.fileUrl) as string[]));
    }

    const isContextMatch = targetUrls.length === 0 || areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      console.log("Context match, opening drawer...");
      setTodoToEdit(todo);
      setDrawerMode(mode);
      setDrawerInitialData(null);
      setIsDrawerOpen(true);

      if (todo.viewState && viewerActions.current?.restore) {
        viewerActions.current.restore(todo.viewState, todo.items);
      }
    } else {
      console.log("Context mismatch, switching models...", targetUrls);

      setIsDrawerOpen(false);

      setPendingTodo({ todo, mode });

      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(`/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`);
    }
  };
  // const captureViewRef = React.useRef<() => any>(null);
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

  const handleRegisterActions = (actions: any) => {
    viewerActions.current = actions;
  };

  useEffect(() => {
    const rawParams = searchParams.get('urls');
    const storageKey = `bimcde_active_models_${projectId}`;

    if (rawParams) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawParams));

        setIfcUrls(parsed);
        console.log("Parsed IFC URLs from params:", parsed);
        sessionStorage.setItem(storageKey, JSON.stringify(parsed));

        router.replace(`/projects/${projectId}/viewer3d`);
      } catch (e) {
        console.error("Error parsing URLs from params", e);
      }
    } else {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("Parsed IFC URLs from params F5:", parsed);

          setIfcUrls(prev => areArraysEqual(prev, parsed) ? prev : parsed);
        } catch (e) {
          console.error("Error parsing URLs from storage", e);
        }
      }
    }
  }, [searchParams, projectId, router]);

  const handleBack = () => {
    router.push(`/projects/${projectId}/data`);
  };

  const handleRefresh = () => {
    console.log("Refresh Action Clicked");
  };

  const onAddTodo = () => {
    setTodoToEdit(null);
    setDrawerMode("create");


    let viewState = null;
    if (viewerActions.current?.capture) {
      viewState = viewerActions.current.capture();
    }


    let items: any[] = [];
    let title = undefined;

    if (selectedItems.length > 0) {
      const grouped = new Map();
      selectedItems.forEach(item => {
        const key = `${item.fileUrl}-${item.modelID}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            fileUrl: item.fileUrl || '',
            modelId: String(item.modelID || ''),
            expressId: []
          });
        }
        grouped.get(key).expressId.push(String(item.expressID || ''));
      });
      items = Array.from(grouped.values());
      title = `Issue on ${selectedItems.length > 1 ? `${selectedItems.length} items` : `#${items[0]?.expressId[0] || ''}`}`;
    } else {

      console.log("ifcUrls: ", ifcUrls);
      if (ifcUrls.length > 0) {
        items = ifcUrls.map((url: any) => ({
          fileUrl: url,
          modelId: "",
          expressId: []
        }));
      }
    }


    const initialData = {
      items,
      title,
      viewState,
    };

    setDrawerInitialData(initialData);
    setIsDrawerOpen(true);
  };


  const handleSelectTodo = (todo: any) => {

    let targetUrls: string[] = [];

    if (todo.items && todo.items.length > 0) {

      targetUrls = Array.from(new Set(todo.items.map((i: any) => i.fileUrl) as string[]));
    }


    if (targetUrls.length === 0) {
      if (todo.viewState) {

        viewerActions.current?.restore(todo.viewState, []);
      }
      return;
    }


    const isContextMatch = areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      console.log("Context match, restoring view only...");
      if (viewerActions.current?.restore) {
        viewerActions.current.restore(todo.viewState, todo.items);
      }
    } else {
      console.log("Context mismatch, switching models...", targetUrls);

      setPendingTodo(todo);

      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(`/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`);
    }
  };



  const handleViewerLoaded = () => {
    if (pendingTodo) {
      console.log("New model loaded, processing pending todo...");

      setTimeout(() => {
        const { todo, mode } = pendingTodo;

        if (viewerActions.current?.restore && todo.viewState) {
          viewerActions.current.restore(todo.viewState, todo.items);
        }

        setTodoToEdit(todo);
        setDrawerMode(mode);
        setIsDrawerOpen(true);

        setPendingTodo(null);
      }, 500);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350);
    return () => clearTimeout(timer);
  }, [isDrawerOpen]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAddTodo={onAddTodo}
      />
      {/* handle navbar and extend when click item can create todo related to it */}
      <div className="flex flex-1 relative overflow-hidden">

        <div className="w-10 min-h-full bg-gray-200 z-10">
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
                  className={`flex justify-center cursor-pointer py-3 mb-2 p-3 ${isActive
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

        {/* CONTAINER CHO VIEWER & DRAWER */}
        <div className="flex-1 relative flex h-full">

          <div
            className="h-full transition-all duration-300 ease-in-out"
            style={{
              width: isDrawerOpen ? 'calc(100% - 400px)' : '100%',
              flexShrink: 0
            }}
          >
            <IfcViewer
              setSelectdItemsForNavbar={setSelectedItems}
              isCollapsed={isCollapsed}
              ifcUrls={ifcUrls}
              state={state}
              projectId={projectId}
              onRegisterCapture={handleRegisterActions}
              onLoaded={handleViewerLoaded}
              onSelectTodo={handleSelectTodo}
              onOpenTodoDrawer={handleOpenTodoDrawer}
            />
          </div>
        </div>
      </div>

      <NewTodoDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        projectId={projectId as string}
        mode={drawerMode}
        todoToEdit={todoToEdit}
        initialData={drawerInitialData}
        currentSelection={selectedItems}
      />
    </div>
  );
}
