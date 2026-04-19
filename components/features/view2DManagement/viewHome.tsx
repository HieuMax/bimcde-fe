/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { view2DService } from "@/services/view2d.service"; // 🌟 ĐÃ ĐỔI SANG VIEW2D SERVICE
import { todo2DService } from "@/services/todo2d.service";

// --- PDF SETUP ---
import html2canvas from "html2canvas";
type PdfjsInstance = typeof import("react-pdf").pdfjs;
const pdfjsRef: { current: PdfjsInstance | null } = { current: null };
const ensurePdfjs = async (): Promise<PdfjsInstance | null> => {
  if (pdfjsRef.current) return pdfjsRef.current;
  if (typeof window === "undefined") return null;

  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  pdfjsRef.current = pdfjs;
  return pdfjs;
};

// --- IMPORT TYPES ---

import type { IFile, IFileVersion, PageItem, TodoItem } from "@/types/explorer";
import {
  ToolType,
  IAnnotation,
  View2DMarkup,
  ViewState,
  View2DItem, // 🌟 SỬ DỤNG View2DItem
  CreateView2DDTO, // 🌟 SỬ DỤNG CreateView2DDTO
  UpdateView2DDTO, // 🌟 SỬ DỤNG UpdateView2DDTO
} from "@/types/view2d";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPanel } from "@/components/ui/amination";
import React from "react";
import VersionHistoryPanel from "./tabView2D/VersionHistoryPanel";

type RightPanelState =
  | { type: "viewDetail"; data: View2DItem }
  | { type: "history" }
  | { type: "todoDetail"; data: TodoItem }
  | { type: "createView" }
  | { type: "createTodo" }
  | null;

type ActiveTab = "filedetail" | "page" | "view" | "todo" | "history";

export default function DetailView2D({
  mode = "view",
  fileId,
  onLoaded,
  shareToken,
  showAnnotation,
  activeTool: drawingTool,
  activeColor,
  currentUser,
  onRegisterOpenViewPanel,
  onRegisterOpenTodoPanel,
}: {
  mode?: "view" | "file" | "share";
  fileId?: string;
  onLoaded?: (file: IFile) => void;
  shareToken?: string;
  showAnnotation?: boolean;
  activeTool: ToolType;
  activeColor: string;
  currentUser?: string;
  onRegisterOpenViewPanel?: (open: () => void) => void;
  onRegisterOpenTodoPanel?: (open: () => void) => void;
}) {
  const params = useParams() as { projectId?: string; viewId?: string };
  const routeProjectId = params?.projectId as string;
  const searchParams = useSearchParams();
  const activeShareToken =
    shareToken ?? searchParams.get("shareToken") ?? undefined;

  const hasCalledOnLoaded = useRef(false);
  const loadedFileIdRef = useRef<string | null>(null);

  const [file, setFile] = useState<IFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);

  const currentProjectId =
    routeProjectId || selectedFile?.projectId || file?.projectId || "";

  const [views, setViews] = useState<View2DItem[]>([]); // 🌟 SỬ DỤNG View2DItem
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);

  const [selectedView, setSelectedView] = useState<View2DItem | null>(null); // 🌟 SỬ DỤNG View2DItem
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [annotations, setAnnotations] = useState<IAnnotation[]>([]);
  const [isAutoEditView, setIsAutoEditView] = useState(false);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(1);

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    mode === "file" || mode === "share" ? "page" : "view",
  );

  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isViewLoading, setIsViewLoading] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const isShareMode = !!activeShareToken;
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);

  const userPermission = file?.permission || "DOWNLOAD";

  const allowedTools: ActiveTab[] =
    isShareMode && userPermission === "VIEW"
      ? ["page"]
      : ["page", "view", "todo", "filedetail", "history"];

  const getScrollContainer = () => {
    let scrollContainer: Element | null = document.getElementById(
      "file-viewport-container",
    );
    if (
      scrollContainer &&
      scrollContainer.scrollHeight <= scrollContainer.clientHeight
    ) {
      const childWithScroll = Array.from(
        scrollContainer.querySelectorAll("*"),
      ).find(
        (el) =>
          el.scrollHeight > el.clientHeight &&
          window.getComputedStyle(el).overflowY !== "hidden",
      );
      if (childWithScroll) scrollContainer = childWithScroll;
    }
    return scrollContainer;
  };

  const scrollToPage = (targetPage: number) => {
    setTimeout(() => {
      const pdfPage = document.querySelector(
        `.react-pdf__Page[data-page-number="${targetPage}"]`,
      ) as HTMLAnchorElement;
      if (pdfPage) {
        pdfPage.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const wordPages = document.querySelectorAll(
        ".docx-wrapper section, .docx-document section, .document-page, #file-viewport-container canvas",
      );
      if (wordPages && wordPages.length >= targetPage) {
        const wordPage = wordPages[targetPage - 1] as HTMLAnchorElement;
        if (wordPage) {
          wordPage.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      if (targetPage === 1) {
        const scrollContainer = getScrollContainer();
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }, 150);
  };

  useEffect(() => {
    if (!isViewLoading && pendingScroll) {
      const timer = setTimeout(() => {
        const scrollContainer = getScrollContainer();
        if (scrollContainer) {
          scrollContainer.scrollTo({
            left: pendingScroll.x,
            top: pendingScroll.y,
            behavior: "smooth",
          });
        }
        setPendingScroll(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isViewLoading, pendingScroll]);

  const captureCurrentScreen = async () => {
    let snapshotUrl = "";
    let actualPageIndex = pageIndex;

    try {
      const container = document.getElementById("file-viewport-container");
      if (!container) return { snapshotUrl, actualPageIndex };

      // 1. Tìm thẻ ảnh (nếu là Image) và tất cả thẻ canvas (nếu là PDF / Annotation)
      const imgElement = container.querySelector("img");
      const canvases = container.querySelectorAll("canvas");

      let baseCanvas: HTMLCanvasElement | null = null;
      let drawCanvas: HTMLCanvasElement | null = null;

      if (canvases.length > 1) {
        // TH PDF: canvas[0] thường là nền PDF, canvas cuối cùng là nét vẽ
        baseCanvas = canvases[0];
        drawCanvas = canvases[canvases.length - 1];
      } else if (canvases.length === 1) {
        // TH Ảnh: Chỉ có 1 canvas là nét vẽ
        drawCanvas = canvases[0];
      }

      // 2. Xác định kích thước ảnh xuất ra (Ưu tiên theo canvas nét vẽ)
      const targetWidth = drawCanvas
        ? drawCanvas.width
        : imgElement
          ? imgElement.naturalWidth || imgElement.clientWidth
          : container.clientWidth;

      const targetHeight = drawCanvas
        ? drawCanvas.height
        : imgElement
          ? imgElement.naturalHeight || imgElement.clientHeight
          : container.clientHeight;

      // 3. Tạo một Canvas ảo để "chập" các lớp lại với nhau
      const offCanvas = document.createElement("canvas");
      offCanvas.width = targetWidth;
      offCanvas.height = targetHeight;
      const ctx = offCanvas.getContext("2d");

      if (ctx) {
        // Lót nền trắng để tránh ảnh bị trong suốt xỉn màu
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // --- LỚP DƯỚI CÙNG: VẼ ẢNH GỐC HOẶC NỀN PDF ---
        if (imgElement) {
          // Khởi tạo Image mới để ép tải lại ảnh với CORS hợp lệ
          const safeImg = new Image();
          safeImg.crossOrigin = "anonymous"; // QUAN TRỌNG NHẤT: Tránh lỗi CORS Tainted
          // Thêm timestamp để ép trình duyệt không lấy cache cũ bị lỗi
          safeImg.src =
            imgElement.src +
            (imgElement.src.includes("?") ? "&" : "?") +
            "t=" +
            new Date().getTime();

          await new Promise((resolve) => {
            safeImg.onload = () => {
              // Ép ảnh gốc khớp vừa vặn với kích thước nét vẽ
              ctx.drawImage(safeImg, 0, 0, targetWidth, targetHeight);
              resolve(true);
            };
            safeImg.onerror = () => {
              console.warn("Lỗi tải ảnh nền CORS, snapshot sẽ chỉ có nét vẽ.");
              resolve(false);
            };
          });
        } else if (baseCanvas) {
          ctx.drawImage(baseCanvas, 0, 0, targetWidth, targetHeight);
        }

        // --- LỚP TRÊN CÙNG: VẼ LAYER NÉT VẼ ---
        if (drawCanvas) {
          ctx.drawImage(drawCanvas, 0, 0, targetWidth, targetHeight);
        }

        // 4. Xuất ra mã Base64
        snapshotUrl = offCanvas.toDataURL("image/jpeg", 0.8);
      }
    } catch (e) {
      console.warn("Lỗi capture thủ công:", e);
    }

    // 5. Fallback an toàn nếu hệ thống vẫn thất bại
    if (!snapshotUrl || snapshotUrl === "data:,") {
      const currentPageInfo = pages.find(
        (p) => p.pageNumber === actualPageIndex || p.index === actualPageIndex,
      );
      snapshotUrl =
        currentPageInfo?.imageSrc || currentSrc || file?.fileUrl || "";
    }

    return { snapshotUrl, actualPageIndex };
  };

  const handleCreateView2D = async (data: {
    name: string;
    description: string;
    createdBy?: string;
    sharedWithUsers?: string[];
  }) => {
    const targetFileId = fileId || params.viewId;
    const targetProjectId = params.projectId || currentProjectId;

    if (!targetFileId || !targetProjectId) {
      alert("Missing file or project information.");
      return;
    }
    const savedUser = localStorage.getItem("user");
    const currentUserObj = savedUser ? JSON.parse(savedUser) : null;
    const currentUserId = currentUserObj?._id || currentUserObj?.id;

    try {
      const { snapshotUrl: capturedUrl, actualPageIndex } =
        await captureCurrentScreen();
      const snapshotUrl =
        capturedUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || "View")}&background=random`;

      let scrollX = 0;
      let scrollY = 0;
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        scrollX = scrollContainer.scrollLeft;
        scrollY = scrollContainer.scrollTop;
      }

      // Xóa nối đuôi #coords để giữ nguyên tính hợp lệ của chuỗi Base64
      const finalPreviewSrc = snapshotUrl;

      // Lưu trữ tọa độ vào camera thay vì chuỗi URL
      const newViewState: ViewState = {
        camera: {
          position: { x: scrollX, y: scrollY, z: zoom },
          target: { x: 0, y: 0, z: 0 },
          up: { x: 0, y: 1, z: 0 },
          projection: "ORTHO",
          zoom: zoom,
        },
        markupData: annotations as any,
      };

      const payload: CreateView2DDTO = {
        projectId: targetProjectId,
        name: data.name,
        description: data.description,
        fileId: targetFileId,
        createdBy: currentUserId,
        previewSrc: finalPreviewSrc,
        pageIndex: actualPageIndex,
        scale: zoom,
        rotation: pageRotations[actualPageIndex] || 0,
        viewState: newViewState as any,
      };

      const newView: any = await view2DService.createView(payload as any);

      const hydratedView: any = {
        ...newView,
        createdBy:
          typeof newView.createdBy === "string"
            ? {
              _id: newView.createdBy,
              fullName:
                currentUserObj?.fullName || currentUserObj?.name || "Unknown",
              email: currentUserObj?.email || "",
            }
            : newView.createdBy,
        fileId:
          typeof newView.fileId === "string"
            ? {
              _id: newView.fileId,
              name: (selectedFile || file)?.name || "Unknown File",
            }
            : newView.fileId,
      };

      setViews((prev) => [hydratedView as View2DItem, ...prev]);
      setRightPanel(null);
      setActiveTab("view");
    } catch (error) {
      console.error("Lỗi khi tạo View:", error);
      alert("An error occurred while saving the view.");
    }
  };

  const handleUpdateViewSnapshot = async (targetView: View2DItem) => {
    try {
      const { snapshotUrl: capturedUrl, actualPageIndex } =
        await captureCurrentScreen();
      const snapshotUrl =
        capturedUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(targetView.name || "View")}&background=random`;

      let scrollX = 0;
      let scrollY = 0;
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        scrollX = scrollContainer.scrollLeft;
        scrollY = scrollContainer.scrollTop;
      }

      const finalThumbnailUrl = snapshotUrl;

      const newViewState = {
        ...targetView.viewState,
        camera: {
          position: { x: scrollX, y: scrollY, z: zoom },
          target: { x: 0, y: 0, z: 0 },
          up: { x: 0, y: 1, z: 0 },
          projection: "ORTHO" as const,
          zoom: zoom,
        },
        markupData: annotations as any,
      };

      const payload: UpdateView2DDTO = {
        previewSrc: finalThumbnailUrl,
        pageIndex: actualPageIndex,
        scale: zoom,
        rotation: pageRotations[actualPageIndex] || 0,
        viewState: newViewState as any,
      };

      const updated = await view2DService.updateView(
        targetView._id,
        payload as any,
      );

      const manuallyUpdatedView = {
        ...targetView,
        ...updated,
        previewSrc: finalThumbnailUrl,
        pageIndex: actualPageIndex,
        scale: zoom,
        rotation: pageRotations[actualPageIndex] || 0,
        viewState: newViewState as any,
      };

      setViews((prev) =>
        prev.map((v) =>
          v._id === manuallyUpdatedView._id
            ? (manuallyUpdatedView as View2DItem)
            : v,
        ),
      );
      setRightPanel({
        type: "viewDetail",
        data: manuallyUpdatedView as View2DItem,
      });

      if (actualPageIndex !== pageIndex) {
        setPageIndex(actualPageIndex);
      }
    } catch (error) {
      console.error("Lỗi cập nhật ảnh View:", error);
      alert("Failed to update view image.");
    }
  };

  const handleDeleteView = async (viewId: string) => {
    try {
      // 🌟 GỌI VIEW 2D SERVICE
      await view2DService.deleteView(viewId);
      setViews((prev) => prev.filter((v) => v._id !== viewId));
      if (rightPanel?.type === "viewDetail" && rightPanel.data._id === viewId) {
        setRightPanel(null);
        setSelectedView(null);
      }
    } catch (error) {
      console.error("Lỗi xóa view:", error);
      alert("Unable to delete this view.");
    }
  };

  // ==========================================
  // 👇 LOGIC ĐỌC VÀ ĐIỀU HƯỚNG VIEW (View2DItem)
  // ==========================================
  const applyViewPosition = (
    v: View2DItem,
    overridePages?: PageItem[],
    overrideFile?: IFile,
  ) => {
    const activePages = overridePages || pages;
    const activeFile = overrideFile || selectedFile || file;

    // 1. Phân tích bóc tách trực tiếp mảng Annotations từ markupData
    let parsedAnnotations: IAnnotation[] = [];
    if (v.viewState?.markupData) {
      try {
        const rawMarkup =
          typeof v.viewState.markupData === "string"
            ? JSON.parse(v.viewState.markupData)
            : v.viewState.markupData;

        // Hỗ trợ tương thích ngược nếu data cũ còn bị bọc trong object có key 'annotations'
        parsedAnnotations = Array.isArray(rawMarkup)
          ? rawMarkup
          : rawMarkup.annotations || [];
      } catch (err) {
        console.warn("Failed to parse markupData", err);
        parsedAnnotations = [];
      }
    }
    setAnnotations(parsedAnnotations);

    // 2. Lấy Rotate và PageIndex trực tiếp từ root (mặc định page 1, rotate 0 nếu không có)
    const targetPage = v.pageIndex && v.pageIndex > 0 ? v.pageIndex : 1;
    const rotationToRestore = v.rotation ?? 0;

    // 3. Lấy Zoom từ state root (ưu tiên), hoặc fallback từ camera
    const zoomToRestore = v.scale ?? v.viewState?.camera?.zoom ?? 1;

    setPageIndex(targetPage);
    setZoom(zoomToRestore);
    setPageRotations((prev) => ({ ...prev, [targetPage]: rotationToRestore }));

    if (activeFile?.fileType !== "PDF") {
      const pageInfo = activePages.find(
        (p) => p.pageNumber === targetPage || p.index === targetPage,
      );
      setCurrentSrc(pageInfo?.imageSrc || activeFile?.fileUrl || null);
      setTimeout(() => setIsViewLoading(false), 150);
    } else {
      setCurrentSrc(null);
    }

    const coordsMatch = v.previewSrc?.match(/#coords:(\d+),(\d+)/);
    if (coordsMatch) {
      setPendingScroll({
        x: parseInt(coordsMatch[1], 10),
        y: parseInt(coordsMatch[2], 10),
      });
    } else {
      setPendingScroll(null);
      scrollToPage(targetPage);
    }
  };

  const loadNewFileForView = async (
    newFileId: string,
    viewToApply: View2DItem,
  ) => {
    try {
      setIsViewLoading(true);

      const raw: IFile = await explorerService.getFileDetail(newFileId);

      const hasVersions =
        Array.isArray(raw.versions) && raw.versions.length > 0;
      const currentVer: IFileVersion | undefined = hasVersions
        ? (raw.versions!.find(
          (v: IFileVersion) => v.version === raw.currentVersion,
        ) ?? raw.versions![0])
        : undefined;

      let finalUrl = raw.fileUrl || currentVer?.location || "";
      finalUrl = finalUrl.replace(/ /g, "%20");
      const finalMimeType = raw.mimeType || currentVer?.mimeType || "";
      const isPdf =
        finalMimeType.includes("pdf") ||
        finalUrl.toLowerCase().includes(".pdf");
      const isWord =
        finalMimeType.includes("word") ||
        finalUrl.toLowerCase().match(/\.(doc|docx)$/);

      let fileType = "IMAGE";
      if (isPdf) fileType = "PDF";
      else if (isWord) fileType = "WORD";

      const newFile: IFile = {
        ...raw,
        fileUrl: finalUrl,
        previewSrc: raw.previewSrc || finalUrl,
        size: currentVer?.size ?? raw.size ?? 0,
        mimeType: finalMimeType,
        fileType: fileType as any,
        location: raw.location,
      };

      setSelectedFile(newFile);
      setFile(newFile);

      let derivedPages: PageItem[] = [];
      if (newFile.fileType === "PDF") {
        const total = await getPdfTotalPages(newFile.fileUrl);
        derivedPages = Array.from({ length: total }).map((_, i) => ({
          _id: `${newFile._id}-page-${i + 1}`,
          index: i + 1,
          pageNumber: i + 1,
          fileId: newFile._id,
          source: "pdf",
        }));
      } else if (newFile.fileType === "WORD") {
        derivedPages = [
          {
            _id: newFile._id,
            index: 1,
            imageSrc: "",
            fileId: newFile._id,
            source: "word",
          },
        ];
      } else {
        derivedPages = [
          {
            _id: newFile._id,
            index: 1,
            imageSrc: newFile.previewSrc ?? newFile.fileUrl,
            fileId: newFile._id,
            source: "image",
          },
        ];
      }

      setPages(derivedPages);
      applyViewPosition(viewToApply, derivedPages, newFile);
    } catch (error) {
      console.error("Lỗi khi load file mới cho View:", error);
      alert("Unable to load file for this view.");
      setIsViewLoading(false);
    }
  };

  const loadViewById = async (viewId: string) => {
    try {
      setIsViewLoading(true);

      // 🌟 GỌI VIEW 2D SERVICE (NẾU CÓ GET BY ID TRONG SERVICE, CHÚ Ý NẾU KO CÓ BẠN CÓ THỂ TÌM TRONG state views)
      // Thường service sẽ có getViewById, giả định là gọi được.
      const viewData: View2DItem | undefined = views.find(
        (v) => v._id === viewId,
      );

      // Nếu API getViewById có sẵn trong service của bạn:
      // viewData = await view2dService.getViewById(viewId);

      if (!viewData) {
        throw new Error("Không tìm thấy dữ liệu View");
      }

      setSelectedView(viewData);
      setSelectedTodo(null);
      setIsAutoEditView(false);
      setRightPanel({ type: "viewDetail", data: viewData });

      // 🌟 Thay đổi logic lấy ID File
      const viewFileId =
        typeof viewData.fileId === "string"
          ? viewData.fileId
          : (viewData.fileId as any)?._id;

      const currentActiveFileId = selectedFile?._id || file?._id;

      if (viewFileId && viewFileId !== currentActiveFileId) {
        await loadNewFileForView(viewFileId, viewData);
      } else {
        applyViewPosition(viewData);
      }
    } catch (error) {
      console.error("Lỗi khi load chi tiết View:", error);
      alert("Không thể tải chi tiết của View này.");
      setIsViewLoading(false);
    }
  };

  const handleSelectView = async (v: View2DItem) => {
    setIsViewLoading(true);
    setSelectedView(v);
    setSelectedTodo(null);
    setIsAutoEditView(false);
    setRightPanel({ type: "viewDetail", data: v });

    // 🌟 SỬ DỤNG fileId CHUẨN MỚI
    const viewFileId =
      typeof v.fileId === "string" ? v.fileId : (v.fileId as any)?._id;
    const currentActiveFileId = selectedFile?._id || file?._id;

    if (viewFileId && viewFileId !== currentActiveFileId) {
      await loadViewById(v._id);
    } else {
      applyViewPosition(v);
    }
  };

  const handleEditView = async (v: View2DItem) => {
    setIsViewLoading(true);
    setSelectedView(v);
    setSelectedTodo(null);
    setIsAutoEditView(true);
    setRightPanel({ type: "viewDetail", data: v });

    // 🌟 SỬ DỤNG fileId
    const viewFileId =
      typeof v.fileId === "string" ? v.fileId : (v.fileId as any)?._id;
    const currentActiveFileId = selectedFile?._id || file?._id;

    if (viewFileId && viewFileId !== currentActiveFileId) {
      await loadNewFileForView(viewFileId, v);
    } else {
      applyViewPosition(v);
    }
  };

  // --- LOGIC TODO ---
  const handleCreateTodo = async (data: any) => {
    const targetFileId = fileId || params.viewId;
    if (!targetFileId) return;

    try {
      const newTodo = await todo2DService.createTodo({
        ...data,
        fileId: targetFileId,
        projectId: currentProjectId,
        position: { pageIndex: pageIndex, x: 0, y: 0 },
      });
      setTodos((prev) => [newTodo, ...prev]);
      setRightPanel(null);
      setActiveTab("todo");
    } catch (error) {
      console.error("Lỗi tạo Todo:", error);
      alert("Failed to create todo.");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todo2DService.deleteTodo(todoId);
      setTodos((prev) => prev.filter((t) => t._id !== todoId));
      if (rightPanel?.type === "todoDetail" && rightPanel.data._id === todoId) {
        setRightPanel(null);
        setSelectedTodo(null);
      }
    } catch (error) {
      console.error("Lỗi xóa Todo:", error);
      alert("Unable to delete this todo (network or server error).");
    }
  };

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

  const rotateCurrentPage = (delta: number) => {
    setPageRotations((prev) => ({
      ...prev,
      [pageIndex]: ((prev[pageIndex] ?? 0) + delta) % 360,
    }));
  };

  const handlePrevPage = () => {
    setPageIndex((p) => {
      const newP = Math.max(1, p - 1);
      if (file?.fileType !== "PDF") {
        const pageInfo = pages.find(
          (page) => page.pageNumber === newP || page.index === newP,
        );
        setCurrentSrc(pageInfo?.imageSrc || file?.fileUrl || null);
      }
      scrollToPage(newP);
      return newP;
    });
  };

  const handleNextPage = () => {
    setPageIndex((p) => {
      const newP = Math.min(pages.length, p + 1);
      if (file?.fileType !== "PDF") {
        const pageInfo = pages.find(
          (page) => page.pageNumber === newP || page.index === newP,
        );
        setCurrentSrc(pageInfo?.imageSrc || file?.fileUrl || null);
      }
      scrollToPage(newP);
      return newP;
    });
  };

  // Effects
  useEffect(() => {
    onRegisterOpenViewPanel?.(() => setRightPanel({ type: "createView" }));
  }, [onRegisterOpenViewPanel]);

  useEffect(() => {
    onRegisterOpenTodoPanel?.(() => setRightPanel({ type: "createTodo" }));
  }, [onRegisterOpenTodoPanel]);

  useEffect(() => {
    setActiveTab(mode === "file" || mode === "share" ? "page" : "view");
  }, [mode]);

  // Load File Detail
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Determine what ID to load
        let fileIdToLoad = fileId;
        let viewIdToLoad = params.viewId;
        let viewToAutoLoad: View2DItem | null = null;

        // When opening a view directly (mode="view", no explicit fileId, but viewId in params)
        // Load the view first to get the associated fileId
        if (mode === "view" && !fileId && params.viewId) {
          try {
            const viewData = await view2DService.getViewById(params.viewId);
            if (viewData) {
              viewToAutoLoad = viewData;
              // Get the file ID from the view
              const associatedFileId =
                typeof viewData.fileId === "string"
                  ? viewData.fileId
                  : (viewData.fileId as any)?._id;
              fileIdToLoad = associatedFileId;
              viewIdToLoad = undefined;
            } else {
              // If no view found, assume the route param is actually a fileId
              fileIdToLoad = params.viewId;
              viewIdToLoad = undefined;
            }
          } catch (err) {
            // If fetching view by id fails, treat params.viewId as a fileId fallback
            console.debug("getViewById failed, falling back to treat param as fileId:", err);
            fileIdToLoad = params.viewId;
            viewIdToLoad = undefined;
          }
        }

        const targetId = fileIdToLoad ?? viewIdToLoad;
        if (!targetId) return;

        if (!isShareMode) {
          if (loadedFileIdRef.current === targetId) return;
          loadedFileIdRef.current = targetId as string;
        }

        const raw: IFile = activeShareToken
          ? await explorerService.getFileDetailPublic(
            targetId as string,
            activeShareToken,
          )
          : await explorerService.getFileDetail(targetId as string);

        const hasVersions =
          Array.isArray(raw.versions) && raw.versions.length > 0;
        const currentVer: IFileVersion | undefined = hasVersions
          ? (raw.versions!.find(
            (v: IFileVersion) => v.version === raw.currentVersion,
          ) ?? raw.versions![0])
          : undefined;

        let personName = "Unknown";
        if (currentVer && currentVer.uploadedBy) {
          personName =
            typeof currentVer.uploadedBy === "object"
              ? (currentVer.uploadedBy as any).fullName
              : raw.createdBy || "Unknown";
        }

        let finalUrl = raw.fileUrl || currentVer?.location || "";
        finalUrl = finalUrl.replace(/ /g, "%20");

        if (!finalUrl && !isShareMode)
          throw new Error("Không có URL file để hiển thị");

        const finalMimeType = raw.mimeType || currentVer?.mimeType || "";
        const isPdf =
          finalMimeType.includes("pdf") ||
          finalUrl.toLowerCase().includes(".pdf");
        const isWord =
          finalMimeType.includes("word") ||
          finalUrl.toLowerCase().match(/\.(doc|docx)$/);

        let fileType = "IMAGE";
        if (isPdf) fileType = "PDF";
        else if (isWord) fileType = "WORD";

        const file: IFile = {
          ...raw,
          fileUrl: finalUrl,
          previewSrc: raw.previewSrc || finalUrl,
          size: currentVer?.size ?? raw.size ?? 0,
          mimeType: finalMimeType,
          fileType: fileType as any,
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
        } else if (file.fileType === "WORD") {
          derivedPages = [
            {
              _id: file._id,
              index: 1,
              imageSrc: "",
              fileId: file._id,
              source: "word",
            },
          ];
        } else {
          derivedPages = [
            {
              _id: file._id,
              index: 1,
              imageSrc: file.previewSrc ?? file.fileUrl,
              fileId: file._id,
              source: "image",
            },
          ];
        }

        setPages(derivedPages);

        // If we loaded a view automatically earlier (when no fileId prop), apply its position
        if (viewToAutoLoad) {
          setSelectedView(viewToAutoLoad);
          applyViewPosition(viewToAutoLoad, derivedPages, file);
        } else if (params.viewId) {
          // If route contains a viewId (e.g., opened from Views list), try to load and apply it
          try {
            const viewDataFetched = await view2DService.getViewById(params.viewId);
            if (viewDataFetched) {
              setSelectedView(viewDataFetched);
              applyViewPosition(viewDataFetched, derivedPages, file);
            } else if (!selectedView) {
              setPageIndex(1);
            }
          } catch (err) {
            console.warn("Could not auto-load view from params.viewId:", err);
            if (!selectedView) setPageIndex(1);
          }
        } else if (!selectedView) {
          setPageIndex(1);
        }
      } catch (e) {
        console.error("Load detail failed:", e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fileId, params.viewId, activeShareToken, isShareMode, mode, onLoaded]);

  // Load View & Todo
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!currentProjectId) return;

      try {
        const targetId = fileId || params.viewId;
        const viewsData = targetId
          ? await view2DService.getViewsByFile(targetId)
          : await view2DService.getViewsByProject(currentProjectId);

        if (Array.isArray(viewsData)) setViews(viewsData);

        if (targetId) {
          const todosData = await todo2DService.getTodosByFile(targetId);
          if (Array.isArray(todosData)) setTodos(todosData);
          else if ((todosData as any).data) setTodos((todosData as any).data);
        }
      } catch (error) {
        console.error("Lỗi tải metadata (view/todo):", error);
      }
    };
    fetchMetadata();
  }, [currentProjectId, fileId, params.viewId]);

  const handleWordLoadSuccess = (totalPages: number) => {
    if (!selectedFile) return;
    const derivedPages: PageItem[] = Array.from({ length: totalPages }).map(
      (_, i) => ({
        _id: `${selectedFile._id}-page-${i + 1}`,
        index: i + 1,
        pageNumber: i + 1,
        fileId: selectedFile._id,
        source: "word",
        imageSrc: "",
      }),
    );
    setPages(derivedPages);
  };

  const handleWordThumbnailGenerated = React.useCallback(
    (index: number, src: string) => {
      setPages((prevPages) => {
        return prevPages.map((page) => {
          if (page.source === "word" && page.index === index) {
            return { ...page, imageSrc: src };
          }
          return page;
        });
      });
    },
    [],
  );

  // Logic reload pages
  useEffect(() => {
    if (activeTab !== "page") return;
    if (selectedView?.previewSrc) return; // 🌟 SỬ DỤNG previewSrc
    if (!selectedFile) return;

    async function reLoadPagesForPageTab() {
      if (
        selectedFile?.fileType !== "PDF" &&
        !selectedFile?.fileUrl?.toLocaleLowerCase().endsWith(".pdf")
      ) {
        const isWord = selectedFile?.fileType === "WORD";

        setPages((prevPages) => {
          if (
            isWord &&
            prevPages.length > 0 &&
            prevPages[0].source === "word" &&
            prevPages[0].fileId === selectedFile._id
          ) {
            return prevPages;
          }
          return [
            {
              _id: selectedFile?._id || "",
              index: 1,
              imageSrc: isWord ? "" : (currentSrc ?? ""),
              fileId: selectedFile?._id || "",
              source: isWord ? "word" : "image",
            },
          ];
        });

        if (!isWord) {
          setPageIndex((prev) => (prev > 0 ? prev : 1));
        }
        return;
      }

      const total = await getPdfTotalPages(selectedFile.fileUrl!);
      const derivedPages: PageItem[] = Array.from({ length: total }).map(
        (_, i) => ({
          _id: `${selectedFile._id}-page-${i + 1}`,
          index: i + 1,
          pageNumber: i + 1,
          fileId: selectedFile._id,
          source: "pdf",
        }),
      );
      setPages(derivedPages);
      setPageIndex((prev) => Math.min(prev, derivedPages.length));
    }

    reLoadPagesForPageTab();
  }, [activeTab, selectedFile, selectedView, currentSrc]);

  useEffect(() => {
    if (!allowedTools.includes(activeTab)) {
      setActiveTab("page");
      setRightPanel(null);
    }
  }, [allowedTools, activeTab]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading 2D Management...
      </div>
    );
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex w-full h-full min-h-0 overflow-hidden">
      {/* ===== LEFT TOOL ===== */}
      <LeftPanelTool
        activeKey={activeTab}
        viewCount={views.length}
        onClick={(key) => {
          const tab = key as ActiveTab;
          if (tab === activeTab) setIsLeftPanelOpen((prev) => !prev);
          else {
            setActiveTab(tab);
            setIsLeftPanelOpen(true);
          }
          setRightPanel(null);
        }}
      />

      {/* ===== LEFT PANEL ===== */}
      <AnimatePresence>
        {isLeftPanelOpen && (
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-72 shrink-0 h-full border-r border-gray-300 bg-white overflow-auto"
          >
            <LeftPanelBody
              activeTab={activeTab}
              allowedKeys={allowedTools}
              data={{
                file: selectedFile || file,
                view: selectedView as any,
                pages,
                pageIndex,
                views: views as any,
                todos,
              }}
              onSelectPage={(item) => {
                setPageIndex(item.pageNumber ?? item.index);
                setCurrentSrc(item.imageSrc ?? null);
                scrollToPage(item.pageNumber ?? item.index);
              }}
              onSelectView={handleSelectView as any}
              onDeleteView={handleDeleteView}
              onEditView={handleEditView as any}
              onDeleteTodo={handleDeleteTodo}
              onSelectTodo={(t) => {
                setSelectedTodo(t);
                setSelectedView(null);
                setRightPanel({ type: "todoDetail", data: t });
              }}
              onCreateView={() => setRightPanel({ type: "createView" })}
              onCreateTodo={() => setRightPanel({ type: "createTodo" })}
              onFileUpdated={(updatedFile) => {
                setFile(updatedFile);
                setSelectedFile(updatedFile);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CENTER VIEWPORT ===== */}
      <div
        id="file-viewport-container"
        className="flex-1 min-w-0 min-h-0 relative bg-neutral-800 overflow-auto"
      >
        <FileViewport
          file={selectedFile || file}
          currentSrc={currentSrc}
          pageIndex={pageIndex}
          zoom={zoom}
          activeTool={drawingTool}
          activeColor={activeColor}
          annotations={annotations}
          onAnnotationsChange={setAnnotations}
          pageRotation={pageRotations[pageIndex] ?? 0}
          onRotatePage={rotateCurrentPage}
          showAnnotation={showAnnotation}
          onZoom={(d) => setZoom((z) => Math.max(0.2, Math.min(3, z + d)))}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
          onPageChange={(page) => setPageIndex(page)}
          onRendered={() => setIsViewLoading(false)}
          onWordLoadSuccess={handleWordLoadSuccess}
          onWordThumbnailGenerated={handleWordThumbnailGenerated}
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
                  view={rightPanel.data as any}
                  onClose={() => setRightPanel(null)}
                  projectId={currentProjectId}
                  onUpdateSuccess={(updatedView) => {
                    setViews((prev) =>
                      prev.map((v) =>
                        v._id === updatedView._id ? (updatedView as any) : v,
                      ),
                    );
                    setRightPanel({
                      type: "viewDetail",
                      data: updatedView as any,
                    });
                  }}
                  initialEditMode={isAutoEditView}
                  onJumpToView={() => applyViewPosition(rightPanel.data)}
                  onUpdateSnapshot={() =>
                    handleUpdateViewSnapshot(rightPanel.data)
                  }
                />
              </AnimatedPanel>
            )}

            {rightPanel.type === "history" && (
              <VersionHistoryPanel
                file={selectedFile || fileId}
                onClose={() => setRightPanel(null)}
                onDownloadVersion={(versionId) => {
                  console.log("Download version:", versionId);
                }}
                onOpenVersion={(versionId) => {
                  console.log("Open version:", versionId);
                }}
              />
            )}

            {rightPanel.type === "todoDetail" && (
              <AnimatedPanel animationKey={`todo-${rightPanel.data._id}`}>
                <TodoDetailPanel
                  todo={rightPanel.data}
                  onClose={() => setRightPanel(null)}
                  projectId={currentProjectId}
                  onUpdateSuccess={(updatedTodo) => {
                    setTodos((prev) =>
                      prev.map((t) =>
                        t._id === updatedTodo._id ? updatedTodo : t,
                      ),
                    );
                    setRightPanel({ type: "todoDetail", data: updatedTodo });
                    setSelectedTodo(updatedTodo);
                  }}
                />
              </AnimatedPanel>
            )}

            {rightPanel.type === "createView" && (
              <AnimatedPanel animationKey="create-view">
                <CreateViewPanel
                  projectId={currentProjectId}
                  onClose={() => setRightPanel(null)}
                  onSave={handleCreateView2D}
                />
              </AnimatedPanel>
            )}

            {rightPanel.type === "createTodo" && (
              <AnimatedPanel animationKey="create-todo">
                <CreateTodoPanel
                  projectId={currentProjectId}
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
