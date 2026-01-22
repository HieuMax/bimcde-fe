"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { explorerService } from "@/services/explorer.service";

import LeftPanelTool from "./leftPanelTool";
import LeftPanelBody from "./leftPanelBody";

import ViewDetailPanel from "./tabView2D/properties2DView/viewProperties";
import TodoDetailPanel from "./tabView2D/properties2DView/todoProperties";
import CreateViewPanel from "./createModel/createView";
import CreateTodoPanel from "./createModel/createTodo";
import FileViewport from "./viewPort";

import { IFile, IFileVersion } from "@/types/explorer";

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
import type { ViewItem, TodoItem, PageItem } from "@/types/view";
import { ITag } from "@/types/tag";

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
  // Lấy params từ URL: /projects/[projectId]/viewer/[viewId]
  // Lưu ý: viewId ở đây chính là ID của file cần lấy chi tiết
  const params = useParams() as { projectId?: string; viewId?: string };
  const searchParams = useSearchParams();
  const urlShareToken = searchParams.get("shareToken");
  
  const activeShareToken = shareToken || urlShareToken || undefined;

  const hasCalledOnLoaded = useRef(false);

  const [file, setFile] = useState<IFile | null>(null);
  const [fileDetail, setFileDetail] = useState<IFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);

  const [views, setViews] = useState<ViewItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);

  const [selectedView, setSelectedView] = useState<ViewItem | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(1);

  const [activeTool, setActiveTool] = useState<ActiveTool>(
    mode === "file" ? "page" : "view"
  );


  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

  const [zoom, setZoom] = useState<number>(1);

  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isShareMode = !!shareToken;
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(
    !isShareMode
  );
  
  // Helper: Đếm số trang PDF
  const getPdfTotalPages = async (url: string) => {
    try {
      const pdfjs = await ensurePdfjs();
      if (!pdfjs) {
        return 1;
      }

      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Lỗi đếm trang PDF:", error);
      return 1;
    }
  };

  type FileLike = {
    _id?: string;
    name?: string;
    folderId?: string | null;
    projectId?: string;
    projectName?: string;
    location?: string;

    currentVersion?: number;
    versions?: Array<{
      version: number;
      location?: string;
      size?: number;
      mimeType?: string;
    }>;

    size?: number;
    mimeType?: string;
    fileUrl?: string;
    previewSrc?: string;

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    modifiedBy?: string;

    isLocked?: boolean;
    lockedBy?: string;
    tags?: ITag[];
  };
  function toIFile(raw: FileLike): IFile {
    const ver =
      raw.versions?.find(v => v.version === raw.currentVersion) ??
      raw.versions?.[0];

    return {
      _id: raw._id!,
      name: raw.name!,
      folderId: raw.folderId ?? null,
      projectId: raw.projectId!,

      projectName: raw.projectName,

      currentVersion: raw.currentVersion ?? 1,
      versions: [], 

      size: ver?.size ?? raw.size ?? 0,
      mimeType: ver?.mimeType ?? raw.mimeType ?? "",
      fileUrl: raw.fileUrl ?? ver?.location ?? "",
      previewSrc: raw.previewSrc ?? ver?.location,

      location: raw.location  ?? "NO ROOT",
      updatedAt: raw.updatedAt ?? new Date().toISOString(),

      createdAt: raw.createdAt,
      createdBy: raw.createdBy,
      modifiedBy: raw.modifiedBy,

      isLocked: raw.isLocked ?? false,
      lockedBy: raw.lockedBy,
      tags: raw.tags ?? [],

      fileType:
        (ver?.mimeType ?? raw.mimeType)?.includes("pdf")
          ? "PDF"
          : "IMAGE",
    };
  }

  const rotateCurrentPage = (delta: number) => {
    setPageRotations(prev => ({
      ...prev,
      [pageIndex]: ((prev[pageIndex] ?? 0) + delta) % 360,
    }));
  };

  /* ===== REGISTER TOOLBAR HANDLERS ===== */
  useEffect(() => {
    onRegisterOpenViewPanel?.(() => {
      setRightPanel({ type: "createView" });
    });
  }, [onRegisterOpenViewPanel]);

  useEffect(() => {
    onRegisterOpenTodoPanel?.(() => {
      setRightPanel({ type: "createTodo" });
    });
  }, [onRegisterOpenTodoPanel]);

  /* ===== sync active tool ===== */
  useEffect(() => {
    setActiveTool(mode === "file" ? "page" : "view");
  }, [mode]);
  
  /* ===== LOAD DATA ===== */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        console.log("[DetailView2D] load() called", { fileId, params, shareToken });

        const isShareMode = !!shareToken;

        // const targetId = isShareMode ? (fileId ?? params.viewId) : (fileId ?? params.viewId);
        const targetId = fileId ?? params.viewId;

        if (!targetId) {
          setLoading(false);
          return;
        }

        // 1. GỌI API
        const raw: IFile = await explorerService.getFileDetail(targetId, activeShareToken);
        console.log("[DetailView2D] Raw Data received:", raw);

        // 2. XỬ LÝ DỮ LIỆU
        const hasVersions = Array.isArray(raw.versions) && raw.versions.length > 0;
        const currentVer: IFileVersion | undefined = hasVersions
          ? raw.versions!.find((v: IFileVersion) => v.version === raw.currentVersion) ?? raw.versions![0]
          : undefined;

        // [QUAN TRỌNG] Cho phép URL rỗng (để hiển thị Layout kể cả khi mất file)
        const finalUrl = raw.fileUrl || currentVer?.location || "";
        // Chuẩn hóa object File
        const file: IFile = {
          ...raw,
          size: currentVer?.size ?? raw.size ?? 0,
          mimeType: currentVer?.mimeType ?? raw.mimeType ?? "application/pdf",
          
          createdBy: hasVersions && currentVer?.uploadedBy && typeof currentVer.uploadedBy === "object"
            ? (currentVer.uploadedBy as any).fullName
            : raw.createdBy,

          modifiedBy: hasVersions && currentVer?.uploadedBy && typeof currentVer.uploadedBy === "object"
            ? (currentVer.uploadedBy as any).fullName
            : raw.modifiedBy,

          location: raw.location ?? "ROOT",
          projectName: raw.projectName,
          // Gán URL (có thể là rỗng)
          fileUrl: finalUrl,
          previewSrc: raw.previewSrc || finalUrl,

          fileType: 
            (currentVer?.mimeType ?? raw.mimeType ?? "").includes("pdf") ||
            finalUrl.toLowerCase().includes(".pdf")
              ? "PDF"
              : "IMAGE",
        };

        // Cập nhật State (Lúc này Toolbar sẽ hiển thị tên file)
        setFile(file);
        setSelectedFile(file);
        setCurrentSrc(file.fileUrl);

        if (isShareMode) {
          setViews([]);
          setTodos([]);
          setRightPanel(null);
        } else {
          setViews([]);
          setTodos([]);
        }

        if (onLoaded && !hasCalledOnLoaded.current) {
          hasCalledOnLoaded.current = true;
          onLoaded(file);
        }

        // 3. XỬ LÝ TRANG (FALLBACK NẾU URL RỖNG)
        let derivedPages: PageItem[] = [];

        if (file.fileType === "PDF") {
          try {
             // Nếu URL rỗng, tự ném lỗi để nhảy xuống catch -> hiện trang lỗi đẹp
             if (!file.fileUrl) throw new Error("URL rỗng (File giả)");

             const total = await getPdfTotalPages(file.fileUrl);
             derivedPages = Array.from({ length: total }).map((_, i) => ({
               _id: `${file._id}-page-${i + 1}`,
               index: i + 1,
               pageNumber: i + 1,
               fileId: file._id,
               source: "pdf",
             }));
          } catch (pdfErr) {
             console.warn("⚠️ Hiển thị Placeholder do không tải được PDF");
             // TẠO 1 TRANG GIẢ ĐỂ VIEWER HIỂN THỊ THÔNG BÁO LỖI
             derivedPages = [{
                _id: "error-page",
                index: 1,
                pageNumber: 1,
                fileId: file._id,
                source: "pdf" 
             }];
          }
        } else {
          // Logic Image
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
        // Chỉ hiện lỗi đỏ toàn màn hình nếu thực sự nghiêm trọng (VD: Mất mạng)
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fileId, activeShareToken, params.viewId, isShareMode, onLoaded]);
  
  // Logic reload pages khi chọn file từ danh sách (Sidebar)
  useEffect(() => {
    if (activeTool !== "page") return;
    if (selectedView?.previewSrc) return;
    if (!selectedFile) return;

    async function reLoadPagesForPageTab() {
      if (
        selectedFile?.fileType !== "PDF" &&
        !selectedFile?.fileUrl?.toLocaleLowerCase().endsWith(".pdf")
      ) {
        setPages([
          {
            _id: selectedFile?._id || "",
            index: 1,
            imageSrc: currentSrc ?? "",
            fileId: selectedFile?._id || "",
          },
        ]);
        setPageIndex(1);
        return;
      }
      const total = await getPdfTotalPages(selectedFile.fileUrl!);
      const derivedPages: PageItem[] = Array.from({ length: total }).map(
        (_, i) => ({
          _id: `${selectedFile._id}-page-${i + 1}`,
          index: i + 1,
          pageNumber: i + 1,
          fileId: selectedFile._id,
        })
      );

      setPages(derivedPages);
      setPageIndex((prev) => Math.min(prev, derivedPages.length));
    }
    reLoadPagesForPageTab();
  }, [activeTool, selectedFile, selectedView, currentSrc]);

  /* ===== RENDER STATES ===== */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading 2D Management...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  // /* ===== UI ===== */
  return (
  <div className="flex w-full h-full min-h-0 overflow-hidden">

    {/* ===== LEFT TOOL ===== */}
    <LeftPanelTool
      activeKey={activeTool}
      viewCount={views.length}
      onClick={(key) => {
        const tool = key as ActiveTool;
        if (tool === activeTool) {
          setIsLeftPanelOpen((prev) => !prev);
        } else {
          setActiveTool(tool);
          setIsLeftPanelOpen(true);
        }
        setRightPanel(null);
      }}
    />

    {/* ===== LEFT PANEL ===== */}
    {isLeftPanelOpen && (
      <div className="w-72 shrink-0 h-full border-r border-gray-300 bg-white overflow-auto">
        <LeftPanelBody
          activeTool={activeTool}
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
          onSelectView={async (v) => {
            setSelectedView(v);
            setSelectedTodo(null);
            setRightPanel({ type: "viewDetail", data: v });
          }}
          onSelectTodo={(t) => {
            setSelectedTodo(t);
            setSelectedView(null);
            setRightPanel({ type: "todoDetail", data: t });
          }}
          onCreateView={() => setRightPanel({ type: "createView" })}
          onCreateTodo={() => setRightPanel({ type: "createTodo" })}
        />
      </div>
    )}

    {/* ===== CENTER VIEWPORT CONTAINER ===== */}
    <div className="flex-1 min-w-0 min-h-0 relative bg-neutral-800">
      <FileViewport
        file={selectedFile || file}
        currentSrc={currentSrc}
        pageIndex={pageIndex}
        zoom={zoom}
        pageRotation={pageRotations[pageIndex] ?? 0}
        onRotatePage={rotateCurrentPage}
        onZoom={(d) =>
          setZoom((z) => Math.max(0.2, Math.min(3, z + d)))
        }
        onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
        onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
      />
    </div>

    {/* ===== RIGHT PANEL ===== */}
    {rightPanel && (
      <div className="w-80 shrink-0 h-full border-l border-gray-300 bg-white">
        {rightPanel.type === "viewDetail" && (
          <ViewDetailPanel
            view={rightPanel.data}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel.type === "todoDetail" && (
          <TodoDetailPanel
            todo={rightPanel.data}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel.type === "createView" && (
          <CreateViewPanel
            onClose={() => setRightPanel(null)}
            onSave={() => setRightPanel(null)}
          />
        )}
        {rightPanel.type === "createTodo" && (
          <CreateTodoPanel
            onClose={() => setRightPanel(null)}
            onSave={() => setRightPanel(null)}
          />
        )}
      </div>
    )}
  </div>
);

  // return (
  //   <div
  //     className="flex w-full h-full min-h-0 overflow-hidden"
  //   >
  //     <LeftPanelTool
  //       activeKey={activeTool}
  //       viewCount={views.length}
  //       onClick={(key) => {
  //         const tool = key as ActiveTool;
  //         if (tool === activeTool) {
  //           setIsLeftPanelOpen((prev) => !prev);
  //         } else {
  //           setActiveTool(tool);
  //           setIsLeftPanelOpen(true);
  //         }
  //         setRightPanel(null);
  //       }}
  //     />

  //     {isLeftPanelOpen && (
  //       <div className="w-72 h-full min-h-0 border-r border-gray-300 bg-white overflow-auto">
  //         <LeftPanelBody
  //           activeTool={activeTool}
  //           data={{
  //             file: selectedFile || file,
  //             view: selectedView,
  //             pages,
  //             pageIndex,
  //             views,
  //             todos,
  //           }}
  //           onSelectPage={(item: PageItem) => {
  //             setPageIndex(item.pageNumber ?? item.index);
  //             if (item.imageSrc) setCurrentSrc(item.imageSrc);
  //             else setCurrentSrc(null);
  //           }}
  //           onSelectView={async (v) => {
  //             setSelectedView(v);
  //             setSelectedTodo(null);

  //             let fileDetail: IFile;

  //             if (typeof v.fileId === "object" && v.fileId !== null) {
  //               // fileId đã là object → convert
  //               fileDetail = toIFile(v.fileId);
  //             } else {
  //               // fileId là string → gọi API
  //               const res = await explorerService.getFileDetail(v.fileId);
  //               const raw = (res as any)?.data ?? res;
  //               fileDetail = toIFile(raw);
  //             }

  //             const snapshot = v.previewSrc ?? null;
  //             setCurrentSrc(snapshot);

  //             setPages([
  //               {
  //                 _id: v._id,
  //                 index: 1,
  //                 imageSrc: snapshot ?? "",
  //                 fileId: fileDetail._id,
  //                 source: "view",
  //               },
  //             ]);

  //             setPageIndex(1);
  //             setRightPanel({ type: "viewDetail", data: v });
  //           }}

  //           onSelectTodo={(t) => {
  //             setSelectedTodo(t);
  //             setSelectedView(null);
  //             setSelectedFile(null);

  //             if (t.relatedImage) {
  //               setCurrentSrc(t.relatedImage);
  //             }

  //             setRightPanel({ type: "todoDetail", data: t });
  //           }}
  //           onCreateView={() => setRightPanel({ type: "createView" })}
  //           onCreateTodo={() => setRightPanel({ type: "createTodo" })}
  //         />
  //       </div>
  //     )}

  //     <FileViewport
  //       file={selectedFile || file}
  //       currentSrc={currentSrc}
  //       pageIndex={pageIndex}
  //       zoom={zoom}

  //       pageRotation={pageRotations[pageIndex] ?? 0}
  //       onRotatePage={rotateCurrentPage}

  //       onZoom={(d) =>
  //         setZoom((z) => Math.max(0.2, Math.min(3, z + d)))
  //       }
  //       onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
  //       onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
  //     />

  //     {rightPanel?.type === "viewDetail" && (
  //       <ViewDetailPanel
  //         view={rightPanel.data}
  //         onClose={() => setRightPanel(null)}
  //       />
  //     )}

  //     {rightPanel?.type === "todoDetail" && (
  //       <TodoDetailPanel
  //         todo={rightPanel.data}
  //         onClose={() => setRightPanel(null)}
  //       />
  //     )}

  //     {rightPanel?.type === "createView" && (
  //       <CreateViewPanel
  //         onClose={() => setRightPanel(null)}
  //         onSave={() => setRightPanel(null)}
  //       />
  //     )}

  //     {rightPanel?.type === "createTodo" && (
  //       <CreateTodoPanel
  //         onClose={() => setRightPanel(null)}
  //         onSave={() => setRightPanel(null)}
  //       />
  //     )}
  //   </div>
  // );

}
// bimcde-fe\components\features\view2DManagement\viewHome.tsx