'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { Box, Layers, ClipboardCheck, ChevronRight, ChevronLeft, Camera, FolderTree, Sheet, BadgeInfo, AtomIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar/Navbar';
import { NewTodoDrawer } from '@/components/todos/NewTodoDrawer';
import { viewService3D as viewService } from '@/services/view3d.service';
import { toast } from 'sonner';
import { ViewDrawer } from '@/components/views/ViewDrawer';
import { useQueryClient } from "@tanstack/react-query";
import type { ITodo } from "@/types/todo3d";
import type { IView } from "@/types/view3d";

interface SelectedItem {
  modelID?: string | number;
  fileUrl?: string;
  expressID?: string | number;
}

interface NewTodoInitialData {
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  title?: string;
}
// Context item structure
type ContextItem = {
  fileUrl: string;
  modelId: string;
  expressId: string[];
};

const areArraysEqual = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((value, index) => value === sorted2[index]);
};

export type ClipType = 'none' | 'plane' | 'vertical' | 'box'

export type HoverMode = 'both' | 'lines' | 'faces'


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

  const [pendingTodo, setPendingTodo] = useState<{
    todo: ITodo | IView;
    mode: "view" | "edit" | "create";
    type?: "todo" | "view";
  } | null>(null);

  const queryClient = useQueryClient();

  const viewerActions = React.useRef<{
    capture: () => unknown;
    restore: (state: unknown, items: unknown[]) => void;
    getContext: () => ContextItem[];
  } | null>(null);

  const [todoToEdit, setTodoToEdit] = useState<ITodo | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "view" | "edit">("create");

    // state clip plane
  const [clipMode, setClipMode] = useState<ClipType>('none');
  const [hoverMode, setHoverMode] = useState<HoverMode>('both');
  const [hasActiveVerticalClip, setHasActiveVerticalClip] = useState(false);

  // 
  const setClipModeSafe = useCallback((mode: ClipType) => {
    setClipMode(mode);
    if (mode === 'box') setHoverMode('both'); // box không hover
    if (mode === 'none') setHoverMode('both'); // reset hover when exiting clip
  }, []);

  // --- STATES VIEW ---
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewToEdit, setViewToEdit] = useState<IView | null>(null);
  const [viewDrawerMode, setViewDrawerMode] = useState<"create" | "view" | "edit">("create");
  const [viewInitialData, setViewInitialData] = useState<{ items?: ContextItem[]; viewState?: unknown } | null>(null);

  // --- DATA TABLE ---
  const isDataTableMode = state === 'data-table';
  // const currentSidebarWidth = isDataTableMode ? 0 : (isCollapsed ? 250 : 370);

  const [modelOpacity, setModelOpacity] = useState(1);

  // Selection tools:
  const [baseSelectionMode, setBaseSelectionMode] = useState<'single' | 'area'>('single');
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);

  const handleOpenTodoDrawer = (todo: ITodo, mode: "view" | "edit" | "create") => {
    if (mode === 'create') {
      onAddTodo();
      return;
    }

    let targetUrls: string[] = [];
    if (todo.items && todo.items.length > 0) {
      targetUrls = Array.from(new Set(todo.items.map((i) => i.fileUrl) as string[]));
    }

    const isContextMatch = targetUrls.length === 0 || areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      console.log("Context match, opening drawer...");
      setTodoToEdit(todo);
      setDrawerMode(mode);
      setDrawerInitialData(null);
      setIsDrawerOpen(true);

      if (todo.viewState && viewerActions.current?.restore) {
        viewerActions.current.restore(todo.viewState, todo.items ?? []);
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
    { icon: <AtomIcon />, label: 'topics' },
    { icon: <BadgeInfo />, label: 'clash-sets' },
  ];


  const handleRegisterActions = (actions: {
    capture: () => unknown;
    restore: (state: unknown, items: unknown[]) => void;
    getContext: () => ContextItem[];
  }) => {
    viewerActions.current = actions;
  };

  useEffect(() => {
    const rawParams = searchParams.get('urls');
    const storageKey = `bimcde_active_models_${projectId}`;

    if (rawParams) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawParams));

        // eslint-disable-next-line
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

    console.log("Captured viewState:", viewState);
    console.log("viewerActions.current?.capture:", viewerActions.current?.capture);
    let items: ContextItem[] = [];
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
      if (viewerActions.current?.getContext) {
        items = viewerActions.current.getContext();
        title = "View Snapshot";
      } else
        console.log("ifcUrls: ", ifcUrls);
      if (ifcUrls.length > 0) {
        items = ifcUrls.map((url: string) => ({
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


  const handleSelectTodo = (todo: ITodo) => {

    let targetUrls: string[] = [];

    if (todo.items && todo.items.length > 0) {

      targetUrls = Array.from(new Set(todo.items.map((i) => i.fileUrl) as string[]));
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
        viewerActions.current.restore(todo.viewState, todo.items ?? []);
      }
    } else {
      console.log("Context mismatch, switching models...", targetUrls);

      setPendingTodo({ todo, mode: "view", type: "todo" });

      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(`/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`);
    }
  };

  const handleViewerLoaded = () => {
    if (pendingTodo) {
      console.log("New model loaded, processing pending todo...");

      setTimeout(() => {
        const { todo, mode, type } = pendingTodo;

        if (type === 'view') {
          const view = todo as IView;
          if (viewerActions.current?.restore && view.viewState) {
            viewerActions.current.restore(view.viewState, view.items ?? []);
          }
          setViewToEdit(view);
          setViewDrawerMode(mode);
          setIsViewDrawerOpen(true);
          setIsDrawerOpen(false);
        } else {
          const t = todo as ITodo;
          if (viewerActions.current?.restore && t.viewState) {
            viewerActions.current.restore(t.viewState, t.items ?? []);
          }
          setTodoToEdit(t);
          setDrawerMode(mode);
          setIsDrawerOpen(true);
          setIsViewDrawerOpen(false);
        }

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

  // Model opacity is reset in the opacity UI; avoid cascading setState-in-effect lint


  // --- 1. OPEN DRAWER (ViewList or Create New) ---
  const handleOpenViewDrawer = (view: IView, mode: "view" | "edit" | "create") => {
    if (mode === 'create') {
      let viewState = null;
      let contextItems: ContextItem[] = [];

      if (viewerActions.current) {
        if (viewerActions.current.capture) {
          viewState = viewerActions.current.capture();
        }
        if (viewerActions.current.getContext) {
          contextItems = viewerActions.current.getContext();
        }
      }

      if (contextItems.length === 0) {
        contextItems = ifcUrls.map(url => ({ fileUrl: url, modelId: "0", expressId: [] }));
      }

      setViewInitialData({
        viewState,
        items: contextItems
      });
      setViewToEdit(null);
      setViewDrawerMode("create");
      setIsViewDrawerOpen(true);
    } else {
      // View/Edit mode
      setViewToEdit(view);
      setViewDrawerMode(mode);
      setViewInitialData(null);
      setIsViewDrawerOpen(true);
    }
  };

  // --- 2. UPDATE SNAPSHOT (...) ---
  const handleUpdateSnapshot = async (view: IView) => {
    if (!viewerActions.current?.capture) return;

    try {
      const newViewState = viewerActions.current.capture();

      let currentContextItems: ContextItem[] = [];
      if (viewerActions.current?.getContext) {
        currentContextItems = viewerActions.current.getContext();
      } else {
        currentContextItems = ifcUrls.map((url: string) => ({
          fileUrl: url,
          modelId: "0", // Fallback
          expressId: []
        }));
      }

      await viewService.updateSnapshot(view._id, {
        viewState: newViewState,
        items: currentContextItems
      });

      toast.success("Snapshot updated to current view!");

      queryClient.invalidateQueries({ queryKey: ["views", projectId] });
      // ----------------------------------------------------

    } catch (error) {
      console.error(error);
      toast.error("Failed to update snapshot");
    }
  };

  // --- 3. RESTORE VIEW (same as handleSelectTodo) ---
  const handleRestoreView = (view: IView) => {
    if (!view.items || !view.viewState) return;

    // Get unique URL
    const targetUrls = Array.from(new Set(view.items.map((i) => i.fileUrl) as string[]));

    // Compare Context
    const isContextMatch = targetUrls.length === 0 || areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      console.log("Context match, restoring view...");
      if (viewerActions.current?.restore) {
        viewerActions.current.restore(view.viewState, []);
      }
    } else {
      console.log("Context mismatch, switching models for view...");

      setIsViewDrawerOpen(false);
      setPendingTodo({ todo: view, mode: "view", type: 'view' });

      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(`/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`);
    }
  };
  
  const clearClipRef = useRef<null | (() => void)>(null);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAddTodo={onAddTodo}
        modelOpacity={modelOpacity}
        onOpacityChange={setModelOpacity}

        // selection tools
        selectionMode={baseSelectionMode}
        onChangeSelectionMode={(mode) => setBaseSelectionMode(mode)}
        multiSelectEnabled={multiSelectEnabled}
        onToggleMultiSelect={() => setMultiSelectEnabled(v => !v)}
        // clip plane
        clipType={clipMode}
        hoverMode={hoverMode}

       onChangeClipType={(mode) => {
        setClipModeSafe(mode);
        }}

        onChangeHoverMode={setHoverMode}
        hasActiveVerticalClip={hasActiveVerticalClip}
        setHasActiveVerticalClip={setHasActiveVerticalClip}
        onClearAllClips={() => {
            if (clearClipRef.current) {
                clearClipRef.current(); 
            }
        }}
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

        {/* CONTAINER VIEWER & DRAWER */}
        <div className="flex-1 relative flex h-full">

          <div
            className="h-full transition-all duration-300 ease-in-out relative flex flex-col"
            style={{
              width: isDrawerOpen || isViewDrawerOpen
                ? 'calc(100% - 400px)'
                : '100%',
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

              //
              onOpenViewDrawer={handleOpenViewDrawer}
              onRestoreView={handleRestoreView}
              onUpdateSnapshot={handleUpdateSnapshot}
              modelOpacity={modelOpacity}
              onOpacityChange={setModelOpacity}
              // sidebarWidth={currentSidebarWidth}

              // multiple selection
              selectionMode={multiSelectEnabled ? 'multi' : 'single'}
              areaSelectEnabled={baseSelectionMode === 'area'}
            

            // clip plane
              clipMode={clipMode}
              hoverMode={hoverMode}
              onVerticalClipCreated={() => setHasActiveVerticalClip(true)}
              onClearVerticalClips={(fn: () => void) => {
                clearClipRef.current = fn;
              }}
              onClipSelected={() => {}}
              onClipDeselected={() => {}}
            />


            {/* --- DATA TABLE DRAWER (BOTTOM) --- */}
            {isDataTableMode && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[400px] bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-10 duration-300"
              >
              </div>
            )}
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

      {/* RENDER VIEW DRAWER */}
      <ViewDrawer
        open={isViewDrawerOpen}
        onOpenChange={(v) => {
          setIsViewDrawerOpen(v);
          if (v) setIsDrawerOpen(false);
        }}
        projectId={projectId as string}
        mode={viewDrawerMode}
        viewToEdit={viewToEdit}
        initialData={viewInitialData}
        onRestoreView={(viewState) => {
          if (viewerActions.current?.restore) {
            viewerActions.current.restore(viewState, []);
          }
        }}
      />
    </div>
  );
}
