/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useParams } from "next/navigation";
import { viewService } from "@/services/view.service";
import LeftPanelTool from "./leftPanelTool";
import LeftPanelBody from "./leftPanelBody";
import { explorerService } from "@/services/explorer.service";
import FileViewport, { FileViewportHandle } from "./viewPort";
import { pdfjs } from "react-pdf";
// import { jsPDF } from "jspdf";
import ViewDetailPanel from "./tabView2D/properties2DView/viewProperties";
import TodoDetailPanel from "./tabView2D/properties2DView/todoProperties";
// Import form cũ (trả về sharedWith: string)
import CreateViewPanel, {
  CreateViewPanelProps,
} from "./createModel/createView";
import CreateTodoPanel from "./createModel/createTodo";
import type {
  FileItem,
  ViewItem,
  TodoItem,
  PageItem,
  UpdateViewDTO,
  UserPopulated,
} from "@/types/view";
import { ToolType, IAnnotation, View2DMarkup, ViewState } from "@/types/view";
import { toast } from "sonner";
// Giả sử bạn có hook lấy user, nếu không sẽ dùng mock
// import { useAuth } from "@/hooks/useAuth";

// Setup PDF worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// --- TYPES ---
type RightPanelState =
  | { type: "viewDetail"; data: ViewItem }
  | { type: "todoDetail"; data: TodoItem }
  | { type: "createView" }
  | { type: "createTodo" }
  | null;

type ActiveTab = "filedetail" | "page" | "view" | "todo";

interface DetailView2DProps {
  mode?: "view" | "file";
  fileId?: string;
  activeTool: ToolType;
  activeColor: string;
  showAnnotation: boolean;
  onLoaded?: (file: FileItem) => void;
  onToolSelect?: (tool: ToolType) => void;
  // Có thể nhận currentUser từ Page cha nếu Page cha là Server Component
  currentUser?: string;
}

/* ========= COMPONENT ========= */

const DetailView2D = forwardRef<FileViewportHandle, DetailView2DProps>(
  (props, ref) => {
    const {
      mode = "view",
      fileId,
      showAnnotation,
      onLoaded,
      activeTool,
      activeColor,
      currentUser, // Nhận prop user ID
    } = props;

    const params = useParams() as { projectId: string; viewId: string };
    const viewportRef = useRef<FileViewportHandle>(null);

    // --- STATES ---
    const [file, setFile] = useState<FileItem | null>(null);
    const [views, setViews] = useState<ViewItem[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [pages, setPages] = useState<PageItem[]>([]);

    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [selectedView, setSelectedView] = useState<ViewItem | null>(null);

    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const [pageIndex, setPageIndex] = useState<number>(1);

    const [annotations, setAnnotations] = useState<IAnnotation[]>([]);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<
      string | null
    >(null);

    const [activeTab, setActiveTab] = useState<ActiveTab>(
      mode === "file" ? "page" : "view",
    );

    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
    const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

    const [zoom, setZoom] = useState<number>(1);
    const [rotate, setRotate] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const effectiveUserId = currentUser || "MOCK_USER_ID";

    // --- EXPOSE EXPORT FUNCTION ---
    useImperativeHandle(ref, () => ({
      exportSnapshot: () =>
        viewportRef.current?.exportSnapshot() || Promise.resolve(null),
    }));

    // --- HELPER: GET PDF PAGES ---
    const getPdfTotalPages = async (url: string) => {
      try {
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        return pdf.numPages;
      } catch {
        return 1;
      }
    };

    // --- EFFECT: SYNC TAB ---
    useEffect(() => {
      setActiveTab(mode === "file" ? "page" : "view");
    }, [mode]);

    // --- EFFECT: LOAD DATA ---
    // --- MAIN LOAD LOGIC ---
    useEffect(() => {
      async function load() {
        try {
          setLoading(true);
          setError(null);

          // 1. Identify Input ID (ViewID or FileID)
          const incomingId = fileId || params.viewId;
          if (!incomingId) throw new Error("Missing ID");

          let targetFileId = incomingId;
          let initialViewData: ViewItem | null = null;

          // =========================================================
          // STEP 1: LOAD VIEW DETAIL (If in 'view' mode)
          // =========================================================
          if (mode === "view") {
            try {
              const viewData = await viewService.getViewById(incomingId);
              if (!viewData) throw new Error("View not found");

              initialViewData = viewData;

              targetFileId =
                typeof viewData.relatedFileId === "object" &&
                viewData.relatedFileId !== null
                  ? viewData.relatedFileId._id
                  : (viewData.relatedFileId as string);

              // --- Parse ViewState (Camera, Zoom, Markup) ---
              let loadedZoom = 1;
              let loadedRotate = 0;
              let loadedPageIndex = 1;
              let loadedAnnotations: any[] = [];

              if (viewData.viewState) {
                // Camera
                if (viewData.viewState.camera) {
                  loadedZoom = viewData.viewState.camera.zoom || 1;
                }

                // Markup Data
                let markup = viewData.viewState.markupData;
                if (typeof markup === "string") {
                  try {
                    markup = JSON.parse(markup);
                  } catch {}
                }

                const markupObj = markup as View2DMarkup;
                if (markupObj) {
                  loadedAnnotations = markupObj.annotations || [];
                  if (markupObj.viewport) {
                    loadedRotate = markupObj.viewport.rotate || 0;
                    loadedPageIndex = markupObj.viewport.pageIndex || 1;
                  }
                }
              }

              // Apply State
              setZoom(loadedZoom);
              setRotate(loadedRotate);
              setPageIndex(loadedPageIndex);
              setAnnotations(loadedAnnotations);
              setSelectedView(viewData);
            } catch (err) {
              console.warn(
                "Could not load view details, falling back to file mode:",
                err,
              );
            }
          }

          // =========================================================
          // STEP 2: LOAD FILE DETAILS (Critical Step)
          // =========================================================
          const fileRes: any =
            await explorerService.getFileDetail(targetFileId);
          const rawData = fileRes.data || fileRes;

          if (!rawData) throw new Error("File not found");

          const currentVer =
            rawData.versions?.find(
              (v: any) => v.version === rawData.currentVersion,
            ) || rawData.versions?.[0];

          const mappedFile: FileItem = {
            _id: rawData._id,
            name: rawData.name,
            projectId: rawData.projectId,
            fileUrl: currentVer?.location || "",
            fileType: currentVer?.mimeType?.toLowerCase().includes("pdf")
              ? "PDF"
              : "IMAGE",
            previewSrc: currentVer?.location || "",
            uploadedBy: currentVer?.uploadedBy,
            createdAt: rawData.createdAt,
          } as unknown as FileItem;

          setFile(mappedFile);

          // Set Display Source
          if (mode === "view" && initialViewData?.thumbnailUrl) {
            setCurrentSrc(mappedFile.fileUrl); // Use high-res file for viewer
          } else {
            setCurrentSrc(mappedFile.previewSrc || mappedFile.fileUrl || null);
          }

          if (onLoaded) onLoaded(mappedFile);

          // =========================================================
          // STEP 3: LOAD LIST VIEWS (With Client-Side Filtering)
          // =========================================================
          try {
            const response: any = await viewService.getViews(
              rawData.projectId,
              { type: "2D" },
            );
            const data = response?.data?.data || response?.data || response;

            // KIỂM TRA VÀ SET VIEW
            if (Array.isArray(data)) {
              setViews(data);
            } else {
              console.warn("Dữ liệu Views trả về không phải mảng:", data);
              setViews([]);
            }
          } catch (err) {
            console.warn("Failed to load views list", err);
            setViews([]);
          }

          // =========================================================
          // STEP 4: GENERATE PAGES
          // =========================================================
          let derivedPages: PageItem[] = [];
          if (
            mappedFile.fileType === "PDF" ||
            mappedFile.fileUrl?.toLowerCase().endsWith(".pdf")
          ) {
            const total = await getPdfTotalPages(mappedFile.fileUrl!);
            derivedPages = Array.from({ length: total }).map((_, i) => ({
              _id: `${mappedFile._id}-page-${i + 1}`,
              index: i + 1,
              pageNumber: i + 1,
              fileId: mappedFile._id,
              source: "pdf",
            }));
          } else {
            derivedPages = [
              {
                _id: `${mappedFile._id}-page-1`,
                index: 1,
                pageNumber: 1,
                fileId: mappedFile._id,
                source: "file",
                imageSrc: mappedFile.previewSrc,
              },
            ];
          }
          setPages(derivedPages);
          if (mode !== "view") {
            setPageIndex(1);
            setAnnotations([]);
            setZoom(1);
            setRotate(0);
          }
        } catch (e) {
          console.error("Load Error:", e);
          setError((e as Error).message || "Failed to load content");
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [mode, fileId, params.viewId]);

    // --- HANDLERS ---

    const handleSelectView = async (v: ViewItem) => {
      try {
        // 1. Xác định ID file gốc của View này
        const targetFileId =
          typeof v.relatedFileId === "object" && v.relatedFileId
            ? v.relatedFileId._id
            : (v.relatedFileId as string);

        const currentFileId = file?._id;

        if (targetFileId !== currentFileId) {
          const fileRes: any =
            await explorerService.getFileDetail(targetFileId);
          const rawData = fileRes.data || fileRes;

          if (!rawData)
            throw new Error("Original file for this view not found.");

          const currentVer =
            rawData.versions?.find(
              (ver: any) => ver.version === rawData.currentVersion,
            ) || rawData.versions?.[0];

          // Map data chuẩn
          const mappedFile: FileItem = {
            _id: rawData._id,
            name: rawData.name,
            projectId: rawData.projectId,
            fileUrl: currentVer?.location || "",
            fileType: currentVer?.mimeType?.toLowerCase().includes("pdf")
              ? "PDF"
              : "IMAGE",
            previewSrc: currentVer?.location || "",
            uploadedBy: currentVer?.uploadedBy,
            createdAt: rawData.createdAt,
          } as unknown as FileItem;

          setFile(mappedFile);

          if (v.thumbnailUrl && mode === "view") {
            setCurrentSrc(mappedFile.fileUrl);
          } else {
            setCurrentSrc(mappedFile.previewSrc || mappedFile.fileUrl || "");
          }

          // --- C. TẠO LẠI DANH SÁCH PAGE ---
          if (mappedFile.fileType === "PDF") {
            const total = await getPdfTotalPages(mappedFile.fileUrl);
            setPages(
              Array.from({ length: total }).map((_, i) => ({
                _id: `${mappedFile._id}-p${i + 1}`,
                index: i + 1,
                pageNumber: i + 1,
                fileId: mappedFile._id,
                source: "pdf",
              })),
            );
          } else {
            setPages([
              {
                _id: `${mappedFile._id}-p1`,
                index: 1,
                pageNumber: 1,
                fileId: mappedFile._id,
                source: "file",
                imageSrc: mappedFile.previewSrc,
              },
            ]);
          }
        }

        // 3. KHÔI PHỤC TRẠNG THÁI VIEW (ANNOTATION, ZOOM, ROTATE)
        let z = 1,
          r = 0,
          p = 1,
          ann: IAnnotation[] = [];

        const vs = v.viewState;
        if (vs) {
          // 3.1 Camera
          z = vs.camera.zoom || 1;

          // 3.2 Markup Data
          let markup = vs.markupData;
          if (typeof markup === "string") {
            try {
              markup = JSON.parse(markup);
            } catch {}
          }

          const m = markup as View2DMarkup;
          if (m) {
            ann = m.annotations || [];
            if (m.viewport) {
              r = m.viewport.rotate || 0;
              p = m.viewport.pageIndex || 1;
            }
          }
        }

        // 4. APPLY VÀO CANVAS
        setZoom(z);
        setRotate(r);
        setPageIndex(p);
        setAnnotations(ann);

        // 5. UI Update
        setSelectedView(v);
        setRightPanel({
          type: "viewDetail",
          data: {
            ...v,
            createdBy:
              (v.createdBy as any)?.fullName ||
              (v.createdBy as any)?.email ||
              "Unknown",
          } as any,
        });
      } catch (error) {
        console.error("Failed to load view context:", error);
        toast.error("Could not load the file for this view.");
      }
    };

    const handleUpdateAnnotation = async (viewToUpdate: ViewItem) => {
      if (!viewToUpdate?._id) return;

      const loadingToast = toast.loading("Đang lưu thay đổi...");

      try {
        // 1. Gom dữ liệu nét vẽ
        const newMarkupData = {
          viewport: {
            zoom: zoom,
            rotate: rotate,
            pageIndex: pageIndex,
          },
          annotations: annotations,
        };

        // 2. Tạo Payload
        const payload: UpdateViewDTO = {
          name: viewToUpdate.name,
          description: viewToUpdate.description,

          // Cập nhật Permission
          sharedWith: {
            isPublic: viewToUpdate.sharedWith?.isPublic || false,
            users: viewToUpdate.sharedWith?.users || [],
          },

          // Cập nhật Markup
          viewState: {
            ...viewToUpdate.viewState,
            markupData: newMarkupData,
          } as any,
        };

        // 3. GỌI API UPDATE
        await viewService.updateView(viewToUpdate._id, payload);

        // 4. CẬP NHẬT LẠI LOCAL STATE
        setViews((prev) =>
          prev.map((v) =>
            v._id === viewToUpdate._id
              ? {
                  ...v,
                  ...payload,
                  viewState: { ...v.viewState, markupData: newMarkupData },
                }
              : v,
          ),
        );

        toast.success("Đã cập nhật View thành công!", { id: loadingToast });
      } catch (error) {
        console.error("Lỗi khi cập nhật View:", error);
        toast.error("Không thể lưu thay đổi. Vui lòng thử lại!", {
          id: loadingToast,
        });
      }
    };

    const handleSaveNewView = async (formData: CreateViewPanelProps) => {
      if (!file) return;
      const savedUser = localStorage.getItem("user");
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      const currentUserPopulated: UserPopulated = {
        _id: currentUser?._id || currentUser?.id || "unknown_id",
        fullName: currentUser?.fullName || "Me",
        email: currentUser?.email || "",
      };
      try {
        const isPublicShare = formData.sharedWithUsers
          ?.toLowerCase()
          .includes("public");

        // 1. Tạo Payload
        const view2DData: View2DMarkup = {
          annotations: annotations,
          viewport: { rotate, pageIndex },
        };

        const newViewState: ViewState = {
          camera: {
            position: { x: 0, y: 0, z: zoom },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 },
            projection: "ORTHO",
            zoom: zoom,
          },
          markupData: view2DData,
        };

        const payload = {
          projectId: params.projectId,
          name: formData.name,
          description: formData.description,
          type: "2D",
          relatedFileId: file._id,
          thumbnailUrl: currentSrc || "",
          viewState: newViewState,
          sharedWith: { isPublic: isPublicShare || false, users: [] },
        };
        const rawNewView: any = await viewService.createView(payload as any);

        const hydratedView: ViewItem = {
          ...rawNewView,
          createdBy:
            typeof rawNewView.createdBy === "string"
              ? {
                  _id: rawNewView.createdBy,
                  fullName:
                    rawNewView.createdBy === currentUserPopulated._id
                      ? currentUserPopulated.fullName
                      : "Unknown",
                  email: "",
                }
              : rawNewView.createdBy,

          // Tự tạo object file giả lập
          relatedFileId:
            typeof rawNewView.relatedFileId === "string"
              ? {
                  _id: rawNewView.relatedFileId,
                  name: file.name,
                }
              : rawNewView.relatedFileId,
        };

        // 4. Cập nhật State với view đã được sửa
        setViews((prev) => [hydratedView, ...prev]);

        toast.success("View saved!");
        setRightPanel(null);
        setIsLeftPanelOpen(true);
        setActiveTab("view");
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to save view");
      }
    };
    const handleDeleteView = async (viewToDelete: ViewItem) => {
      const confirm = window.confirm(
        `Are you sure you want to delete view "${viewToDelete.name}"?`,
      );
      if (!confirm) return;

      try {
        // 2. Gọi API Delete
        await viewService.deleteView(viewToDelete._id);
        setViews((prevViews) =>
          prevViews.filter((v) => v._id !== viewToDelete._id),
        );

        if (selectedView?._id === viewToDelete._id) {
          setSelectedView(null);
          setAnnotations([]);
          setRightPanel(null);
          toast.info("View deleted. Returned to base file.");
        } else {
          toast.success("View deleted successfully");
        }
      } catch (err: any) {
        console.error("Delete failed:", err);
        if (err.response?.status === 403) {
          toast.error(
            "Permission denied: Only the owner can delete this view.",
          );
        } else {
          toast.error("Failed to delete view.");
        }
      }
    };
    // --- RENDER ---

    if (loading)
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading...
        </div>
      );
    if (error)
      return (
        <div className="flex h-full items-center justify-center text-red-600">
          {error}
        </div>
      );

    return (
      <div className="flex h-full w-full overflow-hidden flex-col">
        <div className="flex-1 h-full flex overflow-hidden relative">
          <LeftPanelTool
            activeKey={activeTab}
            viewCount={views.length}
            onClick={(k) => {
              const t = k as ActiveTab;
              if (t === activeTab) setIsLeftPanelOpen(!isLeftPanelOpen);
              else {
                setActiveTab(t);
                setIsLeftPanelOpen(true);
              }
              setRightPanel(null);
            }}
          />

          {isLeftPanelOpen && (
            <div className="w-72 border-r h-full border-gray-300 bg-white shrink-0 overflow-hidden">
              <LeftPanelBody
                activeTool={activeTab}
                data={{
                  file: file,
                  view: selectedView,
                  pages,
                  pageIndex,
                  views,
                  todos: [],
                  currentUser: effectiveUserId,
                }}
                onSelectPage={(item) => {
                  setPageIndex(item.pageNumber || 1);
                  if (item.source === "file")
                    setCurrentSrc(item.imageSrc || null);
                }}
                onSelectView={handleSelectView}
                onSelectTodo={() => {}}
                onCreateView={() => setRightPanel({ type: "createView" })}
                onCreateTodo={() => {}}
                onDeleteView={handleDeleteView}
              />
            </div>
          )}

          <FileViewport
            ref={viewportRef}
            {...props}
            file={file}
            currentSrc={currentSrc}
            pageIndex={pageIndex}
            zoom={zoom}
            rotate={rotate}
            activeTool={activeTool}
            activeColor={activeColor}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
            showAnnotation={showAnnotation}
            onZoom={(d) => setZoom((z) => Math.max(0.1, Math.min(5, z + d)))}
            onRotate={(d) => setRotate((r) => (r + d) % 360)}
            onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
            onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
          />

          {rightPanel?.type === "createView" && (
            <CreateViewPanel
              onClose={() => setRightPanel(null)}
              onSave={handleSaveNewView}
            />
          )}

          {!isPanelOpen && selectedView && (
            <div
              onMouseEnter={() => setIsPanelOpen(true)}
              className="fixed right-0 top-48 h-4/5 w-4 z-[55] cursor-pointer hover:bg-blue-500/10 transition-colors"
              title="Rê chuột để xem chi tiết"
            />
          )}
          {rightPanel?.type === "viewDetail" && selectedView && isPanelOpen && (
            <ViewDetailPanel
              view={selectedView}
              onClose={() => setIsPanelOpen(false)}
              onSave={handleUpdateAnnotation}
            />
          )}
        </div>
      </div>
    );
  },
);

DetailView2D.displayName = "DetailView2D";
export default DetailView2D;
