"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import IfcViewer from "@/app/components/ifcs/IfcViewer";
import {
  Box,
  Layers,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Camera,
  FolderTree,
  Sheet,
  BadgeInfo,
  BookText,
  Loader2,
} from "lucide-react";
import {
  ActiveToolType,
  CameraMode,
  Navbar,
  SelectionMode,
  ViewOptionType,
} from "@/components/layout/navbar/Navbar";
import { NewTodoDrawer } from "@/components/todos/NewTodoDrawer";
import { viewService3D as viewService } from "@/services/view3d.service";
import { toast } from "sonner";
import { ViewDrawer } from "@/components/views/ViewDrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NewClashDrawer } from "@/components/_3d/clash_sets/NewClashDrawer";
import { CreateClashSetDto } from "@/types/clash";
import { clashService } from "@/services/clash.service";
import { ITodo } from "@/types/todo3d";
import { IView } from "@/types/view";

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
  viewState?: any;
}

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

// export type MeasureType = 'perpendicular' | 'single-point' | 'angle' | 'slope' | null;

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams();
  const searchParams = useSearchParams();

  const [state, setState] = React.useState("models");
  const [ifcUrls, setIfcUrls] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // --- VIEW OPTION STATE ---
  const [activeView, setActiveView] = useState<ViewOptionType>("axon");

  // --- SELECTION STATE ---
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");

  // --- CAMERA STATE ---
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");

  const handleCameraModeChange = (mode: CameraMode) => {
    setCameraMode(mode);
    if (viewerActions.current?.setCameraMode) {
      viewerActions.current.setCameraMode(mode);
    }
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] =
    useState<NewTodoInitialData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const STORAGE_TAB_KEY = `bimcde_viewer_tab_${projectId}`;
  const STORAGE_PENDING_CLASH = `bimcde_pending_clash_${projectId}`;
  const STORAGE_PENDING_TODO = `bimcde_pending_todo_${projectId}`;

  const [pendingTodo, setPendingTodo] = useState<{
    todo: ITodo | IView | any;
    mode: "view" | "edit" | "create";
    type?: "todo" | "view";
  } | null>(null);

  const queryClient = useQueryClient();

  const viewerActions = React.useRef<{
    capture: () => any;
    restore: (state: any, items: any[]) => void;
    getContext: () => any[];
    runClashTest: (
      modelIDs: any[],
      tolerance: number,
      onProgress: (p: number, t: string) => void,
    ) => Promise<any[]>;
    setCameraMode: (mode: CameraMode) => void;
    setView: (view: ViewOptionType) => void;
    saveClipping: () => void;
    cancelClipping: () => void;
  } | null>(null);


  // quản lý visibility control
  const [ viewOptions, setViewOptions ] = useState({
    annotations: true,
    clipPlanes: true,
    grids: true,
    ifcTypes: true,
    objectAttachments: true

  })

  // const handleToggleViewOption = (key: keyof typeof viewOptions) => {
  //   setViewOptions(prev => ({
  //     ...prev,
  //     [key]: !prev[key]
  //   }));
  // }
  const [todoToEdit, setTodoToEdit] = useState<any>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "view" | "edit">(
    "create",
  );

  // const [measureType, setMeasureType] = useState<MeasureType>(null);
  // const [measureColor, setMeasureColor] = useState('#D81B60');
  // const [isMeasureActive, setIsMeasureActive] = useState(false);

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewToEdit, setViewToEdit] = useState<any>(null);
  const [viewDrawerMode, setViewDrawerMode] = useState<
    "create" | "view" | "edit"
  >("create");
  const [viewInitialData, setViewInitialData] = useState<any>(null);

  // --- DATA TABLE ---
  const isDataTableMode = state === "data-table";

  const [modelOpacity, setModelOpacity] = useState(1);

  // const [baseSelectionMode, setBaseSelectionMode] = useState<'single' | 'area'>('single');
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);

  const [activeTool, setActiveTool] = useState<ActiveToolType>(null);

  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `bimcde_view_options_${projectId}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setViewOptions(prev => ({
        annotations: parsed.annotations ?? prev.annotations,
        clipPlanes: parsed.clipPlanes ?? prev.clipPlanes,
        grids: parsed.grids ?? prev.grids,
        ifcTypes: parsed.ifcTypes ?? prev.ifcTypes,
        objectAttachments: parsed.objectAttachments ?? prev.objectAttachments,
      }));
    } catch (e) {
      console.warn("Failed to restore viewOptions from storage", e);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `bimcde_view_options_${projectId}`;
      window.localStorage.setItem(key, JSON.stringify(viewOptions));
    } catch (e) {
      console.warn("Failed to persist viewOptions to storage", e);
    }
  }, [projectId, viewOptions]);

  const handleClipSave = () => {
    if (viewerActions.current?.saveClipping) {
      viewerActions.current.saveClipping();
    }
    setActiveTool(null);
    toast.success("Clipping plane saved");
  };

  const handleClipCancel = () => {
    if (viewerActions.current?.cancelClipping) {
      viewerActions.current.cancelClipping();
    }
    setActiveTool(null);
  };

  const handleToolSelect = (tool: ActiveToolType) => {
    if (activeTool === tool) {
      setActiveTool(null);
      if (tool === "todo") setIsDrawerOpen(false);
      if (tool === "view") setIsViewDrawerOpen(false);
      if (tool === "clipping") {
      }
      return;
    }

    setActiveTool(tool);

    switch (tool) {
      case "todo":
        setIsDrawerOpen(true);
        setIsViewDrawerOpen(false);
        break;
      case "view":
        setIsViewDrawerOpen(true);
        setIsDrawerOpen(false);
        break;
      case "clipping":
      case "measurement":
        setIsDrawerOpen(false);
        setIsViewDrawerOpen(false);
        break;
      default:
        setIsDrawerOpen(false);
        setIsViewDrawerOpen(false);
        break;
    }
  };

  const handleDrawerClose = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
    if (!isOpen && activeTool === "todo") setActiveTool(null);
  };

  const handleViewDrawerClose = (isOpen: boolean) => {
    setIsViewDrawerOpen(isOpen);
    if (!isOpen && activeTool === "view") setActiveTool(null);
  };

  // --- STATE CLASH DRAWER ---
  const [isClashDrawerOpen, setIsClashDrawerOpen] = useState(false);
  const [clashResults, setClashResults] = useState<any[]>([]);
  const [isRunningClash, setIsRunningClash] = useState(false);
  const [clashProgress, setClashProgress] = useState(0);
  const [clashStatusText, setClashStatusText] = useState("");
  const [pendingClashSetId, setPendingClashSetId] = useState<string | null>(
    null,
  );

  const availableModelsForClash = useMemo(() => {
    return ifcUrls.map((url, idx) => ({
      id: idx,
      name: url.split("/").pop() || `Model ${idx}`,
      fileUrl: url,
    }));
  }, [ifcUrls]);

  const handleViewChange = (view: ViewOptionType) => {
    setActiveView(view);
    if (viewerActions.current?.setView) {
      viewerActions.current.setView(view);
    }
  };

  const saveClashMutation = useMutation({
    mutationFn: (data: CreateClashSetDto) => clashService.create(data),
    onSuccess: (newSet) => {
      toast.success("Clash set saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["clash-sets", projectId] });

      setClashResults((prev) => [newSet, ...prev]);

      setState("clash-sets");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to save clash set to database.");
    },
  });

  const runAnalysis = async (setupData: any) => {
    if (!viewerActions.current?.runClashTest) return;
    setIsRunningClash(true);
    setClashProgress(0);

    try {
      const { models, tolerance, name, type, ignoreSameType } = setupData;
      const modelIDs = models.map((m: any) => m.modelId);

      const detectedClashes = await viewerActions.current.runClashTest(
        modelIDs,
        tolerance,
        (percent, text) => {
          setClashProgress(percent);
          setClashStatusText(text);
        },
      );

      const modelsWithUrl = models.map((m: any) => ({
        modelId: m.modelId,
        version: m.version,
        fileUrl: ifcUrls[m.modelId as number],
      }));

      const payload: CreateClashSetDto = {
        projectId: projectId as string,
        name: name,
        type: type || "clash",
        tolerance: tolerance,
        ignoreSameType: ignoreSameType || false,
        models: modelsWithUrl,
        items: detectedClashes,
      };

      saveClashMutation.mutate(payload);
    } catch (error) {
      console.error(error);
      toast.error("Error during clash detection");
    } finally {
      setIsRunningClash(false);
    }
  };

  const handleRestoreClashSet = (clashSet: any) => {
    const targetUrls = clashSet.models
      .map((m: any) => m.fileUrl)
      .filter(Boolean);
    if (targetUrls.length === 0) {
      console.warn("Clash set missing file URLs");
      return;
    }

    const isContextMatch = areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      setPendingClashSetId(clashSet._id);
    } else {
      console.log("Context mismatch. Switching models for Clash...");
      switchContextAndReload(targetUrls, clashSet._id, "clash");
    }
  };

  useEffect(() => {
    const savedTab = sessionStorage.getItem(STORAGE_TAB_KEY);
    if (savedTab) setState(savedTab);

    const savedTodoStr = sessionStorage.getItem(STORAGE_PENDING_TODO);
    if (savedTodoStr) {
      try {
        const parsedTodo = JSON.parse(savedTodoStr);
        setPendingTodo(parsedTodo);
        sessionStorage.removeItem(STORAGE_PENDING_TODO);
      } catch (e) {
        console.error("Failed to parse pending todo", e);
      }
    }

    const savedClashId = sessionStorage.getItem(STORAGE_PENDING_CLASH);
    if (savedClashId) {
      setPendingClashSetId(savedClashId);
      sessionStorage.removeItem(STORAGE_PENDING_CLASH);
    }
  }, [projectId, STORAGE_PENDING_CLASH, STORAGE_PENDING_TODO, STORAGE_TAB_KEY]);

  useEffect(() => {
    if (state) sessionStorage.setItem(STORAGE_TAB_KEY, state);
  }, [state, projectId, STORAGE_TAB_KEY]);

  const handleOpenTodoDrawer = (
    todo: any,
    mode: "view" | "edit" | "create",
  ) => {
    if (mode === "create") {
      onAddTodo();
      return;
    }

    let targetUrls: string[] = [];
    if (todo.items && todo.items.length > 0) {
      targetUrls = Array.from(
        new Set(todo.items.map((i: any) => i.fileUrl) as string[]),
      );
    }

    const isContextMatch =
      targetUrls.length === 0 || areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      setTodoToEdit(todo);
      setDrawerMode(mode);
      setDrawerInitialData(null);
      setIsDrawerOpen(true);

      if (todo.viewState && viewerActions.current?.restore) {
        viewerActions.current.restore(todo.viewState, todo.items ?? []);
      }
    } else {
      setIsDrawerOpen(false);
      setPendingTodo({ todo, mode, type: 'todo' });

      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(
        `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`,
      );
    }
  };

  const ctaBtn = [
    { icon: <Box />, label: "models" },
    { icon: <Layers />, label: "layers" },
    { icon: <ClipboardCheck />, label: "todos" },
    { icon: <Camera />, label: "views" },
    { icon: <FolderTree />, label: "organizer" },
    { icon: <Sheet />, label: "data-table" },
    { icon: <BookText />, label: "topics" },
    { icon: <BadgeInfo />, label: "clash-sets" },
  ];

  const handleRegisterActions = (actions: any) => {
    viewerActions.current = actions;
  };

  useEffect(() => {
    const rawParams = searchParams.get("urls");
    const storageKey = `bimcde_active_models_${projectId}`;

    if (rawParams) {
      try {
        let decoded = rawParams;
        try {
          decoded = decodeURIComponent(rawParams);
        } catch {
          // rawParams might already be decoded; keep as-is
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(decoded);
        } catch {
          // Fallback: treat as a single URL string
          parsed = [decoded];
        }

        const urls = (Array.isArray(parsed) ? parsed : [parsed])
          .map((u) => String(u))
          .filter(Boolean);

        if (urls.length > 0) {
          setIfcUrls(urls);
          console.log("Parsed IFC URLs from params:", urls);
          sessionStorage.setItem(storageKey, JSON.stringify(urls));
          router.replace(`/projects/${projectId}/viewer3d`);
          // if (searchParams.get("urls")) {
          //   router.replace(`/projects/${projectId}/viewer3d`);
          // }
        } else {
          console.error("URLs param parsed but empty:", { rawParams, decoded, parsed });
        }
      } catch (e) {
        console.error("Error parsing URLs from params", e, { rawParams });
      }
    } else {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("Parsed IFC URLs from params F5:", parsed);

          setIfcUrls((prev) => (areArraysEqual(prev, parsed) ? prev : parsed));
      }catch { }
    }
  } 
  }, [searchParams, projectId]);

  const handleBack = () => {
    sessionStorage.removeItem(STORAGE_TAB_KEY);
    sessionStorage.removeItem(STORAGE_PENDING_CLASH);
    sessionStorage.removeItem(STORAGE_PENDING_TODO);
    window.location.href = `/projects/${projectId}/data`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const onAddTodo = () => {
    if (isDrawerOpen && activeTool === "todo") {
      setIsDrawerOpen(false);
      setActiveTool(null);
      return;
    }
    setTodoToEdit(null);
    setDrawerMode("create");

    let viewState = null;
    if (viewerActions.current?.capture) {
      viewState = viewerActions.current.capture();
    }

    console.log("Captured viewState:", viewState);
    console.log(
      "viewerActions.current?.capture:",
      viewerActions.current?.capture,
    );
    let items: any[] = [];
    let title = undefined;

    if (selectedItems.length > 0) {
      const grouped = new Map();
      selectedItems.forEach((item) => {
        const key = `${item.fileUrl}-${item.modelID}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            fileUrl: item.fileUrl || "",
            modelId: String(item.modelID || ""),
            expressId: [],
          });
        }
        grouped.get(key).expressId.push(String(item.expressID || ""));
      });
      items = Array.from(grouped.values());
      title = `Issue on ${selectedItems.length > 1 ? `${selectedItems.length} items` : `#${items[0]?.expressId[0] || ""}`}`;
    } else {
      if (viewerActions.current?.getContext) {
        items = viewerActions.current.getContext();
        title = "View Snapshot";
      } else console.log("ifcUrls: ", ifcUrls);
      if (ifcUrls.length > 0) {
        items = ifcUrls.map((url: any) => ({
          fileUrl: url,
          modelId: "",
          expressId: [],
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
    setIsViewDrawerOpen(false);
    setActiveTool("todo");
  };

  const handleSelectTodo = (todo: ITodo | any) => {
    let targetUrls: string[] = [];
    if (todo.items && todo.items.length > 0) {
      targetUrls = Array.from(
        new Set(todo.items.map((i: any) => i.fileUrl) as string[]),
      );
    }

    const isContextMatch =
      targetUrls.length === 0 || areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      setPendingClashSetId(null);
      sessionStorage.removeItem(STORAGE_PENDING_CLASH);

      if (viewerActions.current?.restore && todo.viewState) {
        viewerActions.current.restore(todo.viewState, todo.items ?? []);
      }
    } else {
      switchContextAndReload(
        targetUrls,
        { todo, mode: "view", type: "todo" },
        "view_todo",
      );
    }
  };

  const handleViewerLoaded = () => {
    if (pendingTodo) {
      setTimeout(() => {
        const { todo, mode, type } = pendingTodo;

        if (viewerActions.current?.restore && todo.viewState) {
          viewerActions.current.restore(todo.viewState, todo.items || []);
        }

        if (type === "view") {
          setViewToEdit(todo);
          setViewDrawerMode(mode);
          setIsViewDrawerOpen(true);
          setIsDrawerOpen(false);
          if (state !== "views") setState("views");
        } else {
          const t = todo as ITodo;
          setTodoToEdit(t);
          setDrawerMode(mode);
          setIsDrawerOpen(true);
          setIsViewDrawerOpen(false);
          if (state !== "todos") setState("todos");
        }

        setPendingTodo(null);
      }, 800);
      return;
    }

    if (pendingClashSetId) {
      console.log("Processing pending clash set:", pendingClashSetId);
      if (state !== "clash-sets") setState("clash-sets");
    }
  };

  // ==============================================================================================
  // CONTEXT SWITCHING
  // ==============================================================================================

  const switchContextAndReload = (
    targetUrls: string[],
    pendingData: any,
    type: "clash" | "view_todo",
  ) => {
    sessionStorage.removeItem(STORAGE_PENDING_CLASH);
    sessionStorage.removeItem(STORAGE_PENDING_TODO);

    if (type === "clash") {
      sessionStorage.setItem(STORAGE_PENDING_CLASH, pendingData);
    } else {
      sessionStorage.setItem(STORAGE_PENDING_TODO, JSON.stringify(pendingData));
    }

    const newUrlsParams = JSON.stringify(targetUrls);
    console.log("Switching context via Hard Reload...", targetUrls);
    window.location.href = `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 350);
    return () => clearTimeout(timer);
  }, [isDrawerOpen, isViewDrawerOpen]);

  useEffect(() => {
    setModelOpacity(1);
  }, [ifcUrls]);

  // --- 1. OPEN DRAWER (ViewList or Create New) ---
  const handleOpenViewDrawer = (
    view: any,
    mode: "view" | "edit" | "create",
  ) => {
    if (mode === "create") {
      let viewState = null;
      let contextItems: ContextItem[] = [];

      if (viewerActions.current) {
        if (viewerActions.current.capture) {
          const captured = viewerActions.current.capture() as any;
          viewState = {
            ...captured,
            viewOptions 
          };
        }

        if (viewerActions.current.getContext) {
          contextItems = viewerActions.current.getContext();
        }
      }

      if (contextItems.length === 0) {
        contextItems = ifcUrls.map((url) => ({
          fileUrl: url,
          modelId: "0",
          expressId: [],
        }));
      }

      setViewInitialData({
        viewState,
        items: contextItems,
      });

      setViewToEdit(null);
      setViewDrawerMode("create");
      setIsViewDrawerOpen(true);

    } else {
      setViewToEdit(view);
      setViewDrawerMode(mode);
      setViewInitialData(null);
      setIsViewDrawerOpen(true);
    }
  };

  const onAddView = () => {
    if (isViewDrawerOpen && activeTool === "view") {
      setIsViewDrawerOpen(false);
      setActiveTool(null);
      return;
    }

    handleOpenViewDrawer(null, "create");

    setIsDrawerOpen(false);
    setActiveTool("view");
  };

  const handleUpdateSnapshot = async (view: IView | any) => {
    if (!viewerActions.current?.capture) return;

    try {
      const captured = viewerActions.current.capture() as any;
      const newViewState = {
        ...captured,
        viewOptions 
      };

      let currentContextItems: ContextItem[] = [];

      if (viewerActions.current?.getContext) {
        currentContextItems = viewerActions.current.getContext();
      } else {
        currentContextItems = ifcUrls.map((url: string) => ({
          fileUrl: url,
          modelId: "0", // Fallback
          expressId: [],
        }));
      }

      await viewService.updateSnapshot(view._id, {
        viewState: newViewState,
        items: currentContextItems,
      });

      toast.success("Snapshot updated to current view!");
      queryClient.invalidateQueries({ queryKey: ["views", projectId] });
      // ----------------------------------------------------
    } catch (error) {
      console.error(error);
      toast.error("Failed to update snapshot");
    }
  };

  const handleRestoreView = (view: IView | any) => {
    // if (!view.items || !view.viewState) return;
    // const options = (view.viewState as any)?.viewOptions;
    // if (options) {
    //   setViewOptions({
    //     annotations: options.annotations ?? true,
    //     clipPlanes: options.clipPlanes ?? true,
    //     grids: options.grids ?? true,
    //     ifcTypes: option.ifcTypes ?? true,
    //     objectAttachments: options.objectAttachments ?? true
    //   });
    // }
    
    const targetUrls = Array.from(
      new Set(view.items.map((i: any) => i.fileUrl) as string[]),
    );

    if (targetUrls.length === 0) {
      if (viewerActions.current?.restore)
        viewerActions.current.restore(view.viewState, []);
      return;
    }

    const isContextMatch = areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      setPendingClashSetId(null);
      sessionStorage.removeItem(STORAGE_PENDING_CLASH);

      if (viewerActions.current?.restore) {
        viewerActions.current.restore(view.viewState, []);
      }
    } else {
      switchContextAndReload(
        targetUrls,
        { todo: view, mode: "view", type: "view" },
        "view_todo",
      );
    }
  };


  const safeState = !viewOptions.ifcTypes && state === 'layers' ? 'models' : state;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAddTodo={onAddTodo}
        modelOpacity={modelOpacity}
        onOpacityChange={setModelOpacity}
        
        onOpenViewDrawer={handleOpenViewDrawer}
        onAddView={onAddView}
        activeTool={activeTool}
        
        cameraMode={cameraMode}
        onCameraModeChange={handleCameraModeChange}
        
        // selectionMode={baseSelectionMode}
        // onChangeSelectionMode={(mode) => setBaseSelectionMode(mode)}
        multiSelectEnabled={multiSelectEnabled}
        onToggleMultiSelect={() => setMultiSelectEnabled(v => !v)}
        
        activeView={activeView}
        onViewChange={handleViewChange}
        onToolSelect={handleToolSelect}
        
        onClipSave={handleClipSave}
        onClipCancel={handleClipCancel}
        // onToolChange={(tool) => setActiveTool(tool)}

        // Measurement (USER)
        // measureType={measureType}
        // onMeasureTypeChange={setMeasureType}
        // measureColor={measureColor}
        // onMeasureColorChange={setMeasureColor}
        // isMeasureActive={isMeasureActive}
        // onMeasureActiveChange={setIsMeasureActive}
        // onClearAllMeasurements={() => {
        //   setMeasureType(null);
        //   setIsMeasureActive(false);
        //   if (clearMeasureRef.current) {
        //     clearMeasureRef.current(() => {}); 
        //   }
        // }}

        // Visibility control (USER)
        // viewOptions={viewOptions}
        // onToggleViewOption={handleToggleViewOption}

      />
      <div className="flex flex-1 relative overflow-hidden">
        <div className="w-10 min-h-full bg-gray-200 z-10">
          <div className="mt-[150]">
            <span
              className={`flex justify-center cursor-pointer py-3 mb-2 text-black hover:bg-slate-600 hover:text-white`}
            >
              {isCollapsed ? (
                <ChevronRight
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsCollapsed(false)}
                />
              ) : (
                <ChevronLeft
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsCollapsed(true)}
                />
              )}
            </span>

            {ctaBtn.map((item, index) => {
              const isActive = safeState == item.label;
              // const isDisabled = item.label === 'layers' && !viewOptions.ifcTypes;

              return (
                <span
                  key={index}
                  className={`flex justify-center cursor-pointer py-3 mb-2 p-3 ${
                    isActive
                      ? "bg-slate-600 text-white"
                      : "text-black hover:bg-slate-600 hover:text-white"
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
              width:
                isDrawerOpen || isViewDrawerOpen
                  ? "calc(100% - 400px)"
                  : "100%",
              flexShrink: 0,
            }}
          >
            {/* PROGRESS OVERLAY */}
            {isRunningClash && (
              <div className="absolute top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border w-80 animate-in slide-in-from-right-10">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="font-semibold text-sm">
                    Running Clash Detection...
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${clashProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{clashStatusText}</span>
                  <span>{clashProgress}%</span>
                </div>
              </div>
            )}

            <IfcViewer
              setSelectdItemsForNavbar={setSelectedItems}
              isCollapsed={isCollapsed}
              ifcUrls={ifcUrls}
              state={state}
              projectId={projectId as string}
              onRegisterCapture={handleRegisterActions}
              onLoaded={handleViewerLoaded}
              onSelectTodo={handleSelectTodo}
              onOpenTodoDrawer={handleOpenTodoDrawer}
              onOpenViewDrawer={handleOpenViewDrawer}
              onRestoreView={handleRestoreView}
              onUpdateSnapshot={handleUpdateSnapshot}
              modelOpacity={modelOpacity}
              onOpacityChange={setModelOpacity}

              // Custom user selection
              selectionMode={multiSelectEnabled ? 'multi' : 'single'}
              // areaSelectEnabled={baseSelectionMode === 'area'}

              // Measurement (USER)
              // @ts-expect-error JSX component props not typed in JS file
              // measureType={measureType}
              // measureColor={measureColor}
              // isMeasureActive={isMeasureActive}
              // @ts-expect-error JSX component props not typed in JS file
              // onClearMeasurements={handleRegisterMeasurementClear}
              
              // Visibility control (USER)
              // viewOptions={viewOptions}

              //  features
              onOpenNewClashDrawer={() => setIsClashDrawerOpen(true)}
              clashResults={clashResults}
              onRestoreClashSet={handleRestoreClashSet}
              autoExpandedClashSetId={pendingClashSetId}
              cameraMode={cameraMode}
              activeTool={activeTool}
              onToolChange={(tool: ActiveToolType) => setActiveTool(tool)}
            />

            {/* --- DATA TABLE DRAWER (BOTTOM) --- */}
            {isDataTableMode && (
              <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-10 duration-300"></div>
            )}
          </div>
        </div>
      </div>

      <NewTodoDrawer
        open={isDrawerOpen}
        onOpenChange={handleDrawerClose}
        projectId={projectId as string}
        mode={drawerMode}
        todoToEdit={todoToEdit as ITodo}
        initialData={drawerInitialData}
        currentSelection={selectedItems}
      />

      <ViewDrawer
        open={isViewDrawerOpen}
        onOpenChange={handleViewDrawerClose}
        projectId={projectId as string}
        mode={viewDrawerMode}
        viewToEdit={viewToEdit as IView}
        initialData={viewInitialData}
        onRestoreView={(viewState) => {
          if (viewerActions.current?.restore) {
            viewerActions.current.restore(viewState, []);
          }
        }}
      />

      {/* --- RENDER CLASH DRAWER --- */}
      <NewClashDrawer
        open={isClashDrawerOpen}
        onOpenChange={setIsClashDrawerOpen}
        availableModels={availableModelsForClash}
        onRunTest={runAnalysis}
        projectId={projectId as string}
        onClashSetCreated={() => {}}
      />
    </div>
  );
}