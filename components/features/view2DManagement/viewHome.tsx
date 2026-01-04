"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// --- IMPORT SERVICE MỚI ---
import { explorerService } from "@/services/explorer.service"; // Import service bạn vừa sửa

import LeftPanelTool from "./leftPanelTool";
import LeftPanelBody from "./leftPanelBody";

import ViewDetailPanel from "./tabView2D/properties2DView/viewProperties";
import TodoDetailPanel from "./tabView2D/properties2DView/todoProperties";
import CreateViewPanel from "./createModel/createView";
import CreateTodoPanel from "./createModel/createTodo";
import FileViewport from "./viewPort";

import { pdfjs } from "react-pdf";

// Config worker cho PDF
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// --- IMPORT TYPES ---
import type { FileItem, ViewItem, TodoItem, PageItem } from "@/types/api";

type RightPanelState =
  | { type: "viewDetail"; data: ViewItem }
  | { type: "todoDetail"; data: TodoItem }
  | { type: "createView" }
  | { type: "createTodo" }
  | null;

type ActiveTool = "filedetail" | "page" | "view" | "todo";

/* ========= COMPONENT ========= */

export default function DetailView2D({
  mode = "view",
  fileId,
  onLoaded, // Callback để báo cho trang cha biết đã load xong (để set tên trên toolbar)
}: {
  mode?: "view" | "file";
  fileId?: string;
  onLoaded?: (file: FileItem) => void;
}) {
  // Lấy params từ URL: /projects/[projectId]/viewer/[viewId]
  // Lưu ý: viewId ở đây chính là ID của file cần lấy chi tiết
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

  const [activeTool, setActiveTool] = useState<ActiveTool>(
    mode === "file" ? "page" : "view"
  );

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: Đếm số trang PDF
  const getPdfTotalPages = async (url: string) => {
    try {
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Lỗi đếm trang PDF:", error);
      return 1;
    }
  };

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

        // 1. Xác định ID file cần fetch
        // Ưu tiên props fileId truyền vào, nếu không thì lấy params.viewId từ URL
        const targetId = fileId || params.viewId;

        if (!targetId) {
          throw new Error("Missing File ID (viewId)");
        }

        // 2. Gọi API Service mới
        const response: any = await explorerService.getFileDetail(targetId);
        // Xử lý trường hợp response trả về nguyên cục data hoặc bọc trong .data
        const rawData = response.data || response;

        if (!rawData) throw new Error("No data returned");

        // 3. Mapping Data (Quan trọng)
        // API cũ trả về object phẳng, API mới trả về versions[].
        // Cần lấy location từ version hiện tại để làm fileUrl.

        const currentVer =
          rawData.versions?.find(
            (v: any) => v.version === rawData.currentVersion
          ) || rawData.versions?.[0];
        const fileUrl = currentVer?.location || "";
        const mimeType = currentVer?.mimeType || "";

        const mappedFile: FileItem = {
          _id: rawData._id,
          name: rawData.name,
          projectId: rawData.projectId,
          fileUrl: fileUrl,
          fileType: mimeType.toLowerCase().includes("pdf") ? "PDF" : "IMAGE",
          previewSrc: fileUrl, // Dùng luôn link gốc để preview
          uploadedBy: currentVer?.uploadedBy,
          createdAt: rawData.createdAt,
          // Map thêm các trường khác nếu cần
        } as unknown as FileItem;

        // 4. Set State và Callback
        setFile(mappedFile);
        setCurrentSrc(mappedFile.previewSrc || mappedFile.fileUrl || null);

        // Gọi callback để update Toolbar ở trang cha
        if (onLoaded) {
          onLoaded(mappedFile);
        }

        // Hiện tại chưa có API lấy Views/Todos trong service mới, set rỗng để tránh lỗi
        setViews([]);
        setTodos([]);

        /* ===== DERIVE PAGES (Tách trang PDF hoặc Ảnh) ===== */
        let derivedPages: PageItem[] = [];

        if (
          mappedFile.fileType === "PDF" ||
          mappedFile.fileUrl?.toLowerCase().endsWith(".pdf")
        ) {
          const total = mappedFile.fileUrl
            ? await getPdfTotalPages(mappedFile.fileUrl)
            : 1;
          derivedPages = Array.from({ length: total }).map((_, i) => ({
            _id: `${mappedFile._id}-page-${i + 1}`,
            index: i + 1,
            pageNumber: i + 1,
            fileId: mappedFile._id,
            source: "pdf",
          }));
        } else {
          // Mặc định cho file ảnh đơn
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
        setPageIndex(1);
      } catch (e) {
        console.error("Load detail failed:", e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, fileId, params.viewId]);

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

  /* ===== UI ===== */
  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ height: "calc(100vh - 120px)" }}
    >
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

      {isLeftPanelOpen && (
        <div className="w-72 border-r border-gray-300 bg-white">
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
            onSelectPage={(item: PageItem) => {
              setPageIndex(item.pageNumber ?? item.index);
              if (item.imageSrc) setCurrentSrc(item.imageSrc);
              else setCurrentSrc(null);
            }}
            onSelectView={async (v) => {
              // Xử lý khi chọn View (nếu sau này có dữ liệu views)
              setSelectedView(v);
              setSelectedTodo(null);

              let fileData: FileItem;

              // Kiểm tra xem ID là object hay string
              if (typeof v.fileId === "object" && v.fileId !== null) {
                fileData = v.fileId as unknown as FileItem;
              } else {
                // Gọi API lấy thông tin file từ ID
                const res: any = await explorerService.getFileDetail(
                  v.fileId as string
                );
                const raw = res.data || res;
                const ver =
                  raw.versions?.find(
                    (x: any) => x.version === raw.currentVersion
                  ) || raw.versions?.[0];

                fileData = {
                  _id: raw._id,
                  name: raw.name,
                  projectId: raw.projectId,
                  fileUrl: ver?.location || "",
                  fileType: ver?.mimeType?.includes("pdf") ? "PDF" : "IMAGE",
                  previewSrc: ver?.location,
                } as unknown as FileItem;
              }

              setSelectedFile(fileData);

              const snapshot = v.previewSrc ?? null;
              setCurrentSrc(snapshot);
              setPages([
                {
                  _id: v._id,
                  index: 1,
                  imageSrc: snapshot ?? "",
                  fileId: fileData._id,
                  source: "view",
                },
              ]);

              setPageIndex(1);
              setRightPanel({ type: "viewDetail", data: v });
            }}
            onSelectTodo={(t) => {
              setSelectedTodo(t);
              setSelectedView(null);
              setSelectedFile(null);

              if (t.relatedImage) {
                setCurrentSrc(t.relatedImage);
              }

              setRightPanel({ type: "todoDetail", data: t });
            }}
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
        onZoom={(d: number) =>
          setZoom((z) => Math.max(0.2, Math.min(3, z + d)))
        }
        onRotate={(d: number) => setRotate((r) => (r + d) % 360)}
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
          onSave={() => setRightPanel(null)}
        />
      )}

      {rightPanel?.type === "createTodo" && (
        <CreateTodoPanel
          onClose={() => setRightPanel(null)}
          onSave={() => setRightPanel(null)}
        />
      )}
    </div>
  );
}
