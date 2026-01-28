"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { explorerService } from "@/services/explorer.service";
import type { ViewItem, TodoItem, PageItem } from "@/types/explorer"; // Hoặc @/types/explorer tùy project của bạn
import { ITag } from "@/types/tag";
import {motion,  AnimatePresence } from 'framer-motion';
import { AnimatedPanel } from "@/components/ui/amination";
import { CreateViewDTO } from "@/types/view";
import LeftPanelTool from "./leftPanelTool";
import LeftPanelBody from "./leftPanelBody";
import ViewDetailPanel from "./tabView2D/properties2DView/viewProperties";
import TodoDetailPanel from "./tabView2D/properties2DView/todoProperties";
import CreateViewPanel from "./createModel/createView";
import CreateTodoPanel from "./createModel/createTodo";
import FileViewport from "./viewPort";
import { IFile, IFileVersion } from "@/types/explorer";
import { view2DService } from "@/services/view2d.service";
import { todoService2D } from "@/services/todo2d.service";

import html2canvas from "html2canvas";
import { toast } from "sonner";
type PdfjsInstance = typeof import("react-pdf").pdfjs;
const pdfjsRef: { current: PdfjsInstance | null } = { current: null };
const ensurePdfjs = async (): Promise<PdfjsInstance | null> => {
  if (pdfjsRef.current) {
    return pdfjsRef.current;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  pdfjsRef.current = pdfjs;
  return pdfjs;
};

// --- IMPORT TYPES ---


type RightPanelState =
  | { type: "viewDetail"; data: ViewItem }
  | { type: "todoDetail"; data: TodoItem }
  | { type: "createView" }
  | { type: "createTodo" }
  | null;

type ActiveTool = "filedetail" | "page" | "view" | "todo";

export default function DetailView2D({
  mode = "view",
  fileId,
  onLoaded,
  shareToken,
  onRegisterOpenViewPanel,
  onRegisterOpenTodoPanel
}: {
  mode?: "view" | "file" | "share";
  fileId?: string;
  onLoaded?: (file: IFile) => void;
  shareToken?: string;
  onRegisterOpenViewPanel?: (open: () => void) => void;
  onRegisterOpenTodoPanel?: (open: () => void) => void;
}) {
  const params = useParams() as { projectId?: string; viewId?: string };
  const searchParams = useSearchParams();
  const activeShareToken = shareToken ?? searchParams.get("shareToken") ?? undefined;

  const hasCalledOnLoaded = useRef(false);
  const loadedFileIdRef = useRef<string | null>(null);

  const [file, setFile] = useState<IFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);

  const [views, setViews] = useState<ViewItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]); // State chứa danh sách Todos
  const [pages, setPages] = useState<PageItem[]>([]);

  const [selectedView, setSelectedView] = useState<ViewItem | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(1);

  const [activeTool, setActiveTool] = useState<ActiveTool>(
    mode === "file" || mode === "share" ? "page" : "view"
  );

  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

  const isShareMode = !!activeShareToken;
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);

  const userPermission = file?.permission || "DOWNLOAD"; 
  const allowedTools: ActiveTool[] = (isShareMode && userPermission === "VIEW")
    ? ["page"] 
    : ["page", "view", "todo", "filedetail"];
  // --- LOGIC VIEW ---
  const handleCreateView2D = async (data: { name: string; description: string; createdBy?: string }) => {
    console.log("Check Token trước khi gửi:", localStorage.getItem('accessToken'));
    const targetFileId = fileId || params.viewId;
    const targetProjectId = params.projectId;
    
    if (!targetFileId || !targetProjectId) {
      alert("Thiếu thông tin File hoặc Project!");
      return;
    }

    try {
      const elementToCapture = document.querySelector('.react-pdf__Page') as HTMLElement || document.querySelector('.viewport-container') as HTMLElement;
      let snapshotUrl = "";
      if (elementToCapture) {
        try {
          const canvas = await html2canvas(elementToCapture, {
            scale: 0.5, useCORS: true, logging: false,
          });
          snapshotUrl = canvas.toDataURL("image/jpeg", 0.7); 
        } catch (captureErr) {
          console.warn("Không thể chụp màn hình:", captureErr);
          snapshotUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
        }
      }

      const newView = await view2DService.createView({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        projectId: targetProjectId,
        fileId: targetFileId,
        pageIndex: pageIndex, 
        scale: zoom, 
        rotation: pageRotations[pageIndex] || 0,
        previewSrc: snapshotUrl
      });

      setViews((prev) => [newView, ...prev]);
      setRightPanel(null);
      setActiveTool("view");
    } catch (error) {
      console.error("Lỗi khi tạo View:", error);
      alert("Đã có lỗi xảy ra khi lưu View.");
    }
  };

  const handleDeleteView = async (viewId: string) => {
    try {
      await view2DService.deleteView(viewId);
      setViews((prev) => prev.filter((v) => v._id !== viewId));
      if (rightPanel?.type === "viewDetail" && rightPanel.data._id === viewId) {
        setRightPanel(null);
        setSelectedView(null);
      }
    } catch (error) {
      console.error("Lỗi xóa view:", error);
      alert("Không thể xóa view này.");
    }
  };

  const handleSelectView = (v: ViewItem) => {
    setIsViewLoading(true);
    setSelectedView(v);
    setSelectedTodo(null);
    setRightPanel({ type: "viewDetail", data: v });

    if (v.pageIndex && v.pageIndex > 0) setPageIndex(v.pageIndex);
    const rotationToRestore = v.rotation ?? 0;
    if (v.pageIndex) {
        setPageRotations((prev) => ({ ...prev, [v.pageIndex!]: rotationToRestore }));
    }
  };

  // --- 👇 [ADD] LOGIC TODO ---
  const handleCreateTodo = async (data: any) => {
    const targetFileId = fileId || params.viewId;
    if (!targetFileId) return;

    try {
      const newTodo = await todoService2D.createTodo({
        ...data,
        fileId: targetFileId,
        projectId: params.projectId,
        position: { pageIndex: pageIndex, x: 0, y: 0 }
      });
      setTodos((prev) => [newTodo, ...prev]);
      setRightPanel(null);
      setActiveTool("todo");
    } catch (error) {
      console.error("Lỗi tạo Todo:", error);
      alert("Lỗi khi tạo Todo.");
    }
  };
  const handleDeleteTodo = async (todoId: string) => {
    try {
        await todoService2D.deleteTodo(todoId);

        setTodos((prev) => prev.filter((t) => t._id !== todoId));

        if (rightPanel?.type === "todoDetail" && rightPanel.data._id === todoId) {
            setRightPanel(null);
            setSelectedTodo(null);
        }
      } catch (error) {
          console.error("Lỗi xóa Todo:", error);
          alert("Không thể xóa ToDo này (Lỗi kết nối hoặc Server).");
      }
  };

  // Helper PDF
  const getPdfTotalPages = async (url: string) => {
    try {
      const pdfjs = await ensurePdfjs();
      if (!pdfjs) return 1;
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      return 1;
    }
  };
  // [NEW] Hàm giả lập lấy state từ Viewer 2D
  // Trong thực tế, bạn sẽ lấy thông tin này từ component <FileViewport /> thông qua ref hoặc context
  const get2DViewerState = () => {
    return {
      camera: {
        position: { x: 0, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        projection: "ORTHO" as const, // 2D bắt buộc là ORTHO
        zoom: zoom, // Lấy state zoom hiện tại của component
      },
      markupData: {
        pageIndex: pageIndex, // Lưu lại đang xem trang nào
        rotate: rotate, // Lưu lại góc xoay
      },
    };
  };

  // Rotate Logic
  const rotateCurrentPage = (delta: number) => {
    setPageRotations(prev => ({
      ...prev,
      [pageIndex]: ((prev[pageIndex] ?? 0) + delta) % 360,
    }));
  };

  // Effects
  // [NEW] Hàm xử lý tạo View
 
  /* ===== sync active tool ===== */
  useEffect(() => {
    onRegisterOpenViewPanel?.(() => setRightPanel({ type: "createView" }));
  }, [onRegisterOpenViewPanel]);

  useEffect(() => {
    onRegisterOpenTodoPanel?.(() => setRightPanel({ type: "createTodo" }));
  }, [onRegisterOpenTodoPanel]);

  useEffect(() => {
    setActiveTool(mode === "file" || mode === "share" ? "page" : "view");
  }, [mode]);

  // Load File Detail
  useEffect(() => {
    async function load() {
      const targetId = fileId ?? params.viewId;
      if (!targetId) return;

      if (!isShareMode) {
        if (loadedFileIdRef.current === targetId) return;
        loadedFileIdRef.current = targetId;
      }

      try {
        setLoading(true);
        setError(null);

        const raw: IFile = activeShareToken
          ? await explorerService.getFileDetailPublic(targetId, activeShareToken)
          : await explorerService.getFileDetail(targetId);

        const hasVersions = Array.isArray(raw.versions) && raw.versions.length > 0;
        const currentVer: IFileVersion | undefined = hasVersions
          ? raw.versions!.find((v: IFileVersion) => v.version === raw.currentVersion) ?? raw.versions![0]
          : undefined;

        let personName = "Unknown";
        if (currentVer && currentVer.uploadedBy) {
          personName = typeof currentVer.uploadedBy === "object" 
            ? (currentVer.uploadedBy as any).fullName 
            : (raw.createdBy || "Unknown");
        }

        let finalUrl = raw.fileUrl || currentVer?.location || "";
        finalUrl = finalUrl.replace(/ /g, "%20");

        if (!finalUrl && !isShareMode) throw new Error("Không có URL file để hiển thị");

        const finalMimeType = raw.mimeType || currentVer?.mimeType || "application/pdf";
        const isPdf = finalMimeType.includes("pdf") || finalUrl.toLowerCase().includes(".pdf");

        const file: IFile = {
          ...raw,
          fileUrl: finalUrl,
          previewSrc: raw.previewSrc || finalUrl,
          size: currentVer?.size ?? raw.size ?? 0,
          mimeType: finalMimeType,
          fileType: isPdf ? "PDF" : "IMAGE",
          createdBy: raw.createdBy || personName,
          modifiedBy: raw.modifiedBy || personName,
          location: raw.location,
          projectName: raw.projectName,
          permission: raw.permission as "VIEW" | "DOWNLOAD" | undefined,
        };

        setFile(file);
        setSelectedFile(file);
        setCurrentSrc(file.fileUrl);

        if (onLoaded && !hasCalledOnLoaded.current) {
          hasCalledOnLoaded.current = true;
          onLoaded(file);
        }

        let derivedPages: PageItem[] = [];
        if (file.fileType === "PDF") {
          const total = await getPdfTotalPages(file.fileUrl);
          derivedPages = Array.from({ length: total }).map((_, i) => ({
            _id: `${file._id}-page-${i + 1}`,
            index: i + 1,
            pageNumber: i + 1,
            fileId: file._id,
            source: "pdf",
          }));
        } else {
          derivedPages = [{
            _id: file._id,
            index: 1,
            imageSrc: file.previewSrc ?? file.fileUrl,
            fileId: file._id,
            source: "file",
          }];
        }

        setPages(derivedPages);
        setPageIndex(1);

      } catch (e) {
        console.error("Load detail failed:", e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fileId, params.viewId, activeShareToken, isShareMode]);

  // Load View & Todo
  useEffect(() => {
    const fetchMetadata = async () => {
      const targetId = fileId || params.viewId;
      if (!targetId) return;

      try {
        // Load Views
        const viewsData = await view2DService.getViewsByFile(targetId);
        if (Array.isArray(viewsData)) setViews(viewsData);

        const todosData = await todoService2D.getTodosByFile(targetId);
        if (Array.isArray(todosData)) {
            setTodos(todosData);
        } else if ((todosData as any).data) {
            setTodos((todosData as any).data);
        }

      } catch (error) {
        console.error("Lỗi tải metadata (view/todo):", error);
      }
    };
    fetchMetadata();
  }, [fileId, params.viewId]);

  
  // Logic reload pages
  useEffect(() => {
    if (activeTool !== "page") return;
    if (selectedView?.previewSrc) return;
    if (!selectedFile) return;

    async function reLoadPagesForPageTab() {
      if (selectedFile?.fileType !== "PDF" && !selectedFile?.fileUrl?.toLocaleLowerCase().endsWith(".pdf")) {
        setPages([{
            _id: selectedFile?._id || "",
            index: 1,
            imageSrc: currentSrc ?? "",
            fileId: selectedFile?._id || "",
          }]);
        setPageIndex(1);
        return;
      }
      const total = await getPdfTotalPages(selectedFile.fileUrl!);
      const derivedPages: PageItem[] = Array.from({ length: total }).map((_, i) => ({
          _id: `${selectedFile._id}-page-${i + 1}`,
          index: i + 1,
          pageNumber: i + 1,
          fileId: selectedFile._id,
        }));
      setPages(derivedPages);
      setPageIndex((prev) => Math.min(prev, derivedPages.length));
    }
    reLoadPagesForPageTab();
  }, [activeTool, selectedFile, selectedView, currentSrc]);


  useEffect(() => {
    if (!allowedTools.includes(activeTool)) {
       setActiveTool("page");
       // Đóng panel phải nếu đang mở tính năng bị cấm
       setRightPanel(null);
    }
  }, [allowedTools, activeTool]);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading 2D Management...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex w-full h-full min-h-0 overflow-hidden">
      {/* ===== LEFT TOOL ===== */}
      <LeftPanelTool
        activeKey={activeTool}
        viewCount={views.length}
        onClick={(key) => {
          const tool = key as ActiveTool;
          if (tool === activeTool) setIsLeftPanelOpen((prev) => !prev);
          else { setActiveTool(tool); setIsLeftPanelOpen(true); }
          setRightPanel(null);
        }}
      />

      {/* ===== LEFT PANEL ===== */}
      <AnimatePresence>
        {isLeftPanelOpen && (
          <motion.div
            // key={activeTool}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-72 shrink-0 h-full border-r border-gray-300 bg-white overflow-auto"
          >
              <LeftPanelBody
              activeTool={activeTool}
              allowedKeys={allowedTools} 
              todoCount={todos.length}
              data={{
                file: selectedFile || file,
                view: selectedView,
                pages,
                pageIndex,
                views,
                todos, 
              }}
              onSelectPage={(item) => {
                setPageIndex(item.pageNumber ?? item.index);
                setCurrentSrc(item.imageSrc ?? null);
              }}
              onSelectView={handleSelectView}
              onDeleteView={handleDeleteView}
              onDeleteTodo={handleDeleteTodo}
              onSelectTodo={(t) => {
                setSelectedTodo(t);
                setSelectedView(null);
                setRightPanel({ type: "todoDetail", data: t });
              }}
              onCreateView={() => setRightPanel({ type: "createView" })}
              onCreateTodo={() => setRightPanel({ type: "createTodo" })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CENTER VIEWPORT ===== */}
      <div className="flex-1 min-w-0 min-h-0 relative bg-neutral-800">
        <FileViewport
          // key={`${file?._id}-${currentSrc}`}
          file={selectedFile || file}
          currentSrc={currentSrc}
          pageIndex={pageIndex}
          zoom={zoom}
          pageRotation={pageRotations[pageIndex] ?? 0}
          onRotatePage={rotateCurrentPage}
          onZoom={(d) => setZoom((z) => Math.max(0.2, Math.min(3, z + d)))}
          onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
          onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
          onRendered={() => setIsViewLoading(false)}
        />
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <AnimatePresence>
        {rightPanel && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="w-80 shrink-0 h-full border-l border-gray-300 bg-white"
          >
            {rightPanel.type === "viewDetail" && (
              <AnimatedPanel animationKey={`view-${rightPanel.data._id}`}>
                <ViewDetailPanel
                  view={rightPanel.data}
                  onClose={() => setRightPanel(null)}
                  onUpdateSuccess={(updatedView) => {
                    setViews(prev => prev.map(v => v._id === updatedView._id ? updatedView : v));
                    setRightPanel({ type: "viewDetail", data: updatedView });
                    
                  }}
                />
              </AnimatedPanel>
            )}

            {rightPanel.type === "todoDetail" && (
              <AnimatedPanel animationKey={`todo-${rightPanel.data._id}`}>
                <TodoDetailPanel
                  todo={rightPanel.data}
                  onClose={() => setRightPanel(null)}
                />
              </AnimatedPanel>
            )}
          {/* {rightPanel?.type === "createView" && (
            <CreateViewPanel
              onClose={() => setRightPanel(null)}
              onSave={handleCreateView}
            />
          )} */}

            {rightPanel.type === "createView" && (
              <AnimatedPanel animationKey="create-view">
                <CreateViewPanel
                  onClose={() => setRightPanel(null)}
                  onSave={handleCreateView2D}
                />
              </AnimatedPanel>
            )}

            {rightPanel.type === "createTodo" && (
              <AnimatedPanel animationKey="create-todo">
                <CreateTodoPanel
                  onClose={() => setRightPanel(null)}
                  onSave={handleCreateTodo}
                />
              </AnimatedPanel>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// // bimcde-fe\components\features\view2DManagement\viewHome.tsx