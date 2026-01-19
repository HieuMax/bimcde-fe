/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { explorerService } from "@/services/explorer.service";
import LeftPanelTool from "./leftPanelTool";
import LeftPanelBody from "./leftPanelBody";
import FileViewport from "./viewPort";
import { pdfjs } from "react-pdf";
import ViewDetailPanel from "./tabView2D/properties2DView/viewProperties";
import TodoDetailPanel from "./tabView2D/properties2DView/todoProperties";
import CreateViewPanel, { CreateViewFormData } from "./createModel/createView";
import CreateTodoPanel from "./createModel/createTodo";
import type { FileItem, ViewItem, TodoItem, PageItem } from "@/types/viewType";
import { ToolType, IAnnotation } from "@/types/explorer";
import { toast } from "sonner";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type RightPanelState =
  | { type: "viewDetail"; data: ViewItem }
  | { type: "todoDetail"; data: TodoItem }
  | { type: "createView" }
  | { type: "createTodo" }
  | null;

type ActiveTab = "filedetail" | "page" | "view" | "todo";

/* ========= COMPONENT ========= */

export default function DetailView2D({
  mode = "view",
  fileId,
  onLoaded,
  activeTool,
  onToolSelect,
}: {
  mode?: "view" | "file";
  fileId?: string;
  onLoaded?: (file: FileItem) => void;
  activeTool: ToolType;
  onToolSelect?: (tool: ToolType) => void;
}) {
  const params = useParams() as { projectId: string; viewId: string };

  const [file, setFile] = useState<FileItem | null>(null);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedView, setSelectedView] = useState<ViewItem | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(1);

  const [annotations, setAnnotations] = useState<IAnnotation[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    mode === "file" ? "page" : "view",
  );

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getPdfTotalPages = async (url: string) => {
    try {
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch {
      return 1;
    }
  };

  useEffect(() => {
    setActiveTab(mode === "file" ? "page" : "view");
  }, [mode]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // ID được truyền vào từ Page
        const incomingId = fileId || params.viewId;
        if (!incomingId) throw new Error("Missing ID");

        let targetFileId = incomingId;
        let initialViewData: ViewItem | null = null;

        // --- LOGIC MỚI: XỬ LÝ DỰA VÀO MODE ---
        if (mode === "view") {
          try {
            const viewData = await explorerService.getViewDetail(incomingId);
            if (!viewData) throw new Error("View not found");

            initialViewData = viewData;
            targetFileId = viewData.fileId;

            // Setup trạng thái từ View
            if (viewData.viewportState) {
              const vp =
                typeof viewData.viewportState === "string"
                  ? JSON.parse(viewData.viewportState)
                  : viewData.viewportState;

              setZoom(vp.zoom || 1);
              setRotate(vp.rotate || 0);
              setPageIndex(vp.pageIndex || 1);
            }
            if (viewData.annotations) {
              const ann =
                typeof viewData.annotations === "string"
                  ? JSON.parse(viewData.annotations)
                  : viewData.annotations;
              setAnnotations(ann);
            }
            setSelectedView(viewData);
          } catch (err) {
            // throw new Error("Cannot load view details");
          }
        }

        // 2. Load thông tin File (Dù là mode nào cũng cần File)
        const fileRes: any = await explorerService.getFileDetail(targetFileId);
        // Do explorerService cũ của bạn có thể trả về res.json(file) trực tiếp
        const rawData = fileRes.data || fileRes;

        if (!rawData) throw new Error("File not found");

        const currentVer =
          rawData.versions?.find(
            (v: any) => v.version === rawData.currentVersion,
          ) || rawData.versions?.[0];
        const fileUrl = currentVer?.location || "";
        const mimeType = currentVer?.mimeType || "";

        const mappedFile: FileItem = {
          _id: rawData._id,
          name: rawData.name,
          projectId: rawData.projectId,
          fileUrl: fileUrl,
          fileType: mimeType.toLowerCase().includes("pdf") ? "PDF" : "IMAGE",
          previewSrc: fileUrl,
          uploadedBy: currentVer?.uploadedBy,
          createdAt: rawData.createdAt,
        } as unknown as FileItem;

        setFile(mappedFile);

        // Nếu là load View thì dùng ảnh của View (nếu có), không thì dùng ảnh gốc
        if (mode === "view" && initialViewData?.previewSrc) {
          // Có thể giữ nguyên logic previewSrc
        } else {
          setCurrentSrc(mappedFile.previewSrc || mappedFile.fileUrl || null);
        }

        if (onLoaded) onLoaded(mappedFile);

        // 3. Load danh sách Views của File này
        try {
          // Service đã sửa return res.data.data -> Trả về mảng
          const apiViews = await explorerService.getViewsByFile(targetFileId);
          setViews(Array.isArray(apiViews) ? apiViews : []);
        } catch (err) {
          console.warn("Failed to load views", err);
          setViews([]);
        }

        // ... Logic xử lý Pages giữ nguyên ...
        let derivedPages: PageItem[] = [];
        // (Copy đoạn logic PDF/Image pages cũ vào đây)
        if (
          mappedFile.fileType === "PDF" ||
          mappedFile.fileUrl?.toLowerCase().endsWith(".pdf")
        ) {
          // ... giữ nguyên code cũ
          const total = await getPdfTotalPages(mappedFile.fileUrl!); // ! vì check trên rồi
          derivedPages = Array.from({ length: total }).map((_, i) => ({
            _id: `${mappedFile._id}-page-${i + 1}`,
            index: i + 1,
            pageNumber: i + 1,
            fileId: mappedFile._id,
            source: "pdf",
          }));
        } else {
          // ... giữ nguyên code cũ
          derivedPages = [
            {
              _id: mappedFile._id,
              index: 1,
              imageSrc: mappedFile.previewSrc ?? "",
              fileId: mappedFile._id,
              source: "file",
            },
          ];
        }
        setPages(derivedPages);

        // Nếu không phải load view thì reset pageIndex về 1
        if (mode !== "view") {
          setPageIndex(1);
        }
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mode, fileId, params.viewId]);

  const handleSelectView = async (v: ViewItem) => {
    setSelectedView(v);
  };

  // --- LOGIC LƯU VIEW (QUAN TRỌNG) ---
  const handleSaveNewView = async (formData: CreateViewFormData) => {
    if (!file) return;

    const sharedVal = formData.sharedWith.trim();

    try {
      const payload = {
        name: formData.title,
        description: formData.description,
        sharedWith: sharedVal,

        fileId: file._id,
        projectId: params.projectId,

        annotations: JSON.stringify(annotations),
        viewportState: JSON.stringify({
          zoom,
          rotate,
          pageIndex,
        }),
        previewSrc: currentSrc ?? undefined,
      };
      const newView = await explorerService.createView(payload);

      setViews((prev) => [newView, ...prev]);

      toast.success("View saved successfully!");

      setRightPanel(null);
      setIsLeftPanelOpen(true);
      setActiveTab("view");
    } catch (err: any) {
      console.error("Failed to save view:", err);
      toast.error(err.response?.data?.message || "Failed to save view");
    }
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex h-full w-full overflow-hidden flex-col">
      <div className="flex-1 h-full flex overflow-hidden relative">
        <LeftPanelTool
          activeKey={activeTab}
          viewCount={views.length}
          onClick={(key) => {
            const tab = key as ActiveTab;
            if (tab === activeTab) setIsLeftPanelOpen(!isLeftPanelOpen);
            else {
              setActiveTab(tab);
              setIsLeftPanelOpen(true);
            }
            setRightPanel(null);
          }}
        />

        {isLeftPanelOpen && (
          <div className="w-72 border-r h-full border-gray-300 bg-white shrink-0">
            <LeftPanelBody
              activeTool={activeTab}
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
                setCurrentSrc(item.imageSrc || null);
              }}
              onSelectView={handleSelectView}
              onSelectTodo={() => {}}
              onCreateView={() => setRightPanel({ type: "createView" })}
              onCreateTodo={() => setRightPanel({ type: "createTodo" })}
            />
          </div>
        )}

        <FileViewport
          file={selectedFile || file}
          currentSrc={currentSrc}
          pageIndex={pageIndex}
          zoom={zoom}
          rotate={rotate}
          // Truyền props activeTool từ Page -> ViewHome -> ViewPort
          activeTool={activeTool}
          annotations={annotations}
          onAnnotationsChange={setAnnotations}
          onZoom={(d) => setZoom((z) => Math.max(0.1, Math.min(5, z + d)))}
          onRotate={(d) => setRotate((r) => (r + d) % 360)}
          onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
          onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
        />

        {rightPanel?.type === "viewDetail" && (
          <ViewDetailPanel
            view={rightPanel.data}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel?.type === "todoDetail" && (
          <TodoDetailPanel
            todo={rightPanel.data}
            onClose={() => setRightPanel(null)}
          />
        )}
        {rightPanel?.type === "createView" && (
          <CreateViewPanel
            onClose={() => setRightPanel(null)}
            onSave={handleSaveNewView}
          />
        )}
        {rightPanel?.type === "createTodo" && (
          <CreateTodoPanel
            onClose={() => setRightPanel(null)}
            onSave={() => setRightPanel(null)}
          />
        )}
      </div>
    </div>
  );
}
