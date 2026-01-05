"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Maximize,
  Download,
  FileText,
} from "lucide-react";
import { ToolType, IAnnotation, IPoint } from "@/types/tool";
import { IFile } from "@/types/explorer";

interface FileViewerProps {
  file: IFile;
  activeTool: ToolType;
}

// type InteractionMode = "none" | "drawing" | "moving" | "resizing";
// type ResizeHandle = "tl" | "tr" | "bl" | "br" | null;

export default function FileViewer({ file, activeTool }: FileViewerProps) {
  const latestVersion = file.versions[file.versions.length - 1];
  const mimeType = latestVersion?.mimeType || "";
  const location = latestVersion?.location || "";

  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- STATE ---
  const [annotations, setAnnotations] = useState<IAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // State vẽ Rect/Circle
  const [isDragDrawing, setIsDragDrawing] = useState(false);
  const [startPos, setStartPos] = useState<IPoint>({ x: 0, y: 0 });

  // State vẽ Polygon/Cloud
  const [currentPolyPoints, setCurrentPolyPoints] = useState<IPoint[]>([]);

  // State Hand Tool (Di chuyển hình)
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState<IPoint | null>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. CTRL + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        setAnnotations((prev) => {
          const newAnn = [...prev];
          newAnn.pop();
          return newAnn;
        });
        setSelectedId(null);
      }

      // 2. DELETE / BACKSPACE (Xóa hình)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const selectedShape = annotations.find((a) => a.id === selectedId);
          if (selectedShape && selectedShape.type !== "pencil") {
            setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
            setSelectedId(null);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, annotations]);
  // --- ZOOM LOGIC ---
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 10), 500));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom((prev) => Math.min(Math.max(prev + delta, 10), 500));
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // --- HELPER: TỌA ĐỘ CHUẨN ---
  const getNormalizedMousePos = (e: React.MouseEvent): IPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // --- HELPER: HIT TEST (KIỂM TRA VA CHẠM CHO HAND TOOL) ---
  const isPointInShape = (pos: IPoint, ann: IAnnotation) => {
    // 1. Với hình dạng điểm (Cloud, Pentagon)
    if (ann.points && ann.points.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      ann.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      // Mở rộng vùng click một chút (padding) cho dễ chọn
      const padding = 10;
      return (
        pos.x >= minX - padding &&
        pos.x <= maxX + padding &&
        pos.y >= minY - padding &&
        pos.y <= maxY + padding
      );
    }

    // 2. Với hình dạng Rect/Circle
    if (
      ann.x !== undefined &&
      ann.y !== undefined &&
      ann.w !== undefined &&
      ann.h !== undefined
    ) {
      const bx = ann.w > 0 ? ann.x : ann.x + ann.w;
      const by = ann.h > 0 ? ann.y : ann.y + ann.h;
      const bw = Math.abs(ann.w);
      const bh = Math.abs(ann.h);
      return pos.x >= bx && pos.x <= bx + bw && pos.y >= by && pos.y <= by + bh;
    }

    return false;
  };

  // --- DRAWING LOGIC ---
  const drawShape = (ctx: CanvasRenderingContext2D, ann: IAnnotation) => {
    const { type, color } = ann;
    ctx.beginPath();
    ctx.strokeStyle = color || "red";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1. RECTANGLE
    if (type === "rectangle" && ann.x !== undefined) {
      ctx.strokeRect(ann.x, ann.y!, ann.w!, ann.h!);
      return;
    }

    // 2. CIRCLE
    if (type === "circle" && ann.x !== undefined) {
      ctx.beginPath();
      ctx.ellipse(
        ann.x + ann.w! / 2,
        ann.y! + ann.h! / 2,
        Math.abs(ann.w! / 2),
        Math.abs(ann.h! / 2),
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();
      return;
    }

    // 3. ARROW (MŨI TÊN)
    if (type === "arrow" && ann.x !== undefined) {
      const startX = ann.x;
      const startY = ann.y!;
      const endX = ann.x + ann.w!;
      const endY = ann.y! + ann.h!;

      // Vẽ đường thẳng
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Tính góc của đường thẳng để xoay đầu mũi tên
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLength = 15; // Độ dài cánh mũi tên

      // Vẽ đầu mũi tên
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      return;
    }

    // 4. POINT-BASED (PENTAGON, CLOUD, PENCIL)
    if (!ann.points || ann.points.length < 2) return;
    const points = ann.points;
    ctx.moveTo(points[0].x, points[0].y);

    if (type === "pentagon") {
      // Nối thẳng
      for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].x, points[i].y);
    } else if (type === "pencil") {
      // NEW: PENCIL
      // Nối thẳng liên tục (Free draw)
      // Có thể dùng quadraticCurveTo để làm mượt nét nếu muốn
      for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].x, points[i].y);
    } else if (type === "cloud") {
      // Logic Cloud cũ
      for (let i = 0; i < points.length; i++) {
        if (ann.id === "preview" && i === points.length - 1) break;
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const vx = p2.x - p1.x;
        const vy = p2.y - p1.y;
        const factor = 0.5;
        const cx = mx - vy * factor;
        const cy = my + vx * factor;
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
      }
    }

    // Đóng hình (Pencil và Arrow không đóng)
    if (ann.id !== "preview" && !["pencil", "arrow"].includes(type)) {
      if (type === "pentagon") ctx.closePath();
      ctx.stroke();
    } else {
      ctx.stroke();
    }
  };

  // Hàm redraw giữ nguyên, chỉ cần update phần Preview Arrow bên dưới
  const redraw = (previewMousePos?: IPoint) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ hình cũ
    annotations.forEach((ann) => drawShape(ctx, ann));

    // Vẽ Preview (Pencil, Pentagon, Cloud)
    if (currentPolyPoints.length > 0) {
      drawShape(ctx, {
        id: "preview",
        type: activeTool,
        color: "red",
        points: currentPolyPoints,
      } as IAnnotation);

      // Vẽ dây thun cho Pentagon/Cloud (Pencil không cần dây thun)
      if (previewMousePos && ["pentagon", "cloud"].includes(activeTool)) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        const lastPoint = currentPolyPoints[currentPolyPoints.length - 1];
        ctx.moveTo(lastPoint.x, lastPoint.y);

        if (activeTool === "pentagon")
          ctx.lineTo(previewMousePos.x, previewMousePos.y);
        else if (activeTool === "cloud") {
          const p1 = lastPoint;
          const p2 = previewMousePos;
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const vx = p2.x - p1.x;
          const vy = p2.y - p1.y;
          const factor = 0.5;
          const cx = mx - vy * factor;
          const cy = my + vx * factor;
          ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        }
        ctx.stroke();
      }
    }
  };

  useLayoutEffect(() => {
    redraw();
  }, [annotations, zoom, currentPolyPoints]);

  // --- MOUSE EVENTS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || activeTool === "cursor") return;
    const pos = getNormalizedMousePos(e);

    // 1. HAND TOOL: Bắt đầu kéo
    if (activeTool === "hand") {
      const clickedShape = [...annotations]
        .reverse()
        .find((ann) => isPointInShape(pos, ann));

      if (clickedShape) {
        setDraggedShapeId(clickedShape.id);
        setLastMousePos(pos);
      }
      return;
    }
    if (activeTool === "pencil") {
      setCurrentPolyPoints([pos]);
      return;
    }

    // 2. Cloud & Pentagon: Thêm điểm
    if (["pentagon", "cloud"].includes(activeTool)) {
      setCurrentPolyPoints((prev) => [...prev, pos]);
      return;
    }

    // 3. Rect/Circle/Arrow: Bắt đầu vẽ box
    if (["rectangle", "circle", "arrow"].includes(activeTool)) {
      setIsDragDrawing(true);
      setStartPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getNormalizedMousePos(e);

    // 1. HAND TOOL: Di chuyển hình
    if (activeTool === "hand" && draggedShapeId && lastMousePos) {
      const dx = pos.x - lastMousePos.x;
      const dy = pos.y - lastMousePos.y;

      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id === draggedShapeId) {
            if (ann.points) {
              return {
                ...ann,
                points: ann.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            } else {
              return {
                ...ann,
                x: (ann.x || 0) + dx,
                y: (ann.y || 0) + dy,
              };
            }
          }
          return ann;
        })
      );

      setLastMousePos(pos);
      return;
    }
    // 1. PENCIL: Vẽ nét liền mạch

    if (activeTool === "pencil" && currentPolyPoints.length > 0) {
      const lastPt = currentPolyPoints[currentPolyPoints.length - 1];
      if (Math.abs(pos.x - lastPt.x) > 2 || Math.abs(pos.y - lastPt.y) > 2) {
        setCurrentPolyPoints((prev) => [...prev, pos]);
      }
      return;
    }

    // 2. Cloud & Pentagon: Vẽ dây thun preview
    if (
      ["pentagon", "cloud"].includes(activeTool) &&
      currentPolyPoints.length > 0
    ) {
      redraw(pos);
      return;
    }

    // 3. Rect/Circle: Vẽ box preview
    if (
      isDragDrawing &&
      ["rectangle", "circle", "arrow"].includes(activeTool)
    ) {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      redraw();
      drawShape(ctx, {
        id: "preview",
        type: activeTool,
        color: "red",
        x: startPos.x,
        y: startPos.y,
        w: pos.x - startPos.x,
        h: pos.y - startPos.y,
      } as IAnnotation);
      return;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Kết thúc Hand Tool
    if (activeTool === "hand") {
      setDraggedShapeId(null);
      setLastMousePos(null);
      return;
    }

    // Kết thúc Pencil
    if (activeTool === "pencil" && currentPolyPoints.length > 0) {
      const newShape: IAnnotation = {
        id: Date.now().toString(),
        type: "pencil",
        color: "red",
        points: [...currentPolyPoints],
      };
      setAnnotations((prev) => [...prev, newShape]);
      setCurrentPolyPoints([]);
      redraw();
      return;
    }

    // Kết thúc Rect/Circle
    if (
      ["rectangle", "circle", "arrow"].includes(activeTool) &&
      isDragDrawing
    ) {
      setIsDragDrawing(false);
      const pos = getNormalizedMousePos(e);
      const w = pos.x - startPos.x;
      const h = pos.y - startPos.y;
      if (Math.abs(w) > 5) {
        setAnnotations((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: activeTool,
            color: "red",
            x: startPos.x,
            y: startPos.y,
            w: w,
            h: h,
          } as IAnnotation,
        ]);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      ["pentagon", "cloud"].includes(activeTool) &&
      currentPolyPoints.length >= 2
    ) {
      const newShape: IAnnotation = {
        id: Date.now().toString(),
        type: activeTool,
        color: "red",
        points: [...currentPolyPoints],
      };
      setAnnotations((prev) => [...prev, newShape]);
      setCurrentPolyPoints([]);
      redraw();
    } else {
      setCurrentPolyPoints([]);
      redraw();
    }
  };

  // --- RENDER ---
  const renderContent = () => {
    const containerStyle: React.CSSProperties = {
      transform: `scale(${zoom / 100})`,
      transformOrigin: "center center",
      position: "relative",
    };

    // Logic CSS Cursor
    const cursorClass =
      activeTool === "cursor"
        ? "pointer-events-none"
        : activeTool === "hand"
        ? "pointer-events-auto cursor-grab active:cursor-grabbing"
        : "pointer-events-auto cursor-crosshair";

    if (mimeType.startsWith("image/")) {
      return (
        <div style={containerStyle} className="inline-block relative shadow-md">
          <img
            src={location}
            alt={file.name}
            className="block max-w-none"
            onLoad={(e) => {
              if (canvasRef.current) {
                canvasRef.current.width = e.currentTarget.naturalWidth;
                canvasRef.current.height = e.currentTarget.naturalHeight;
                redraw();
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full z-10 ${cursorClass}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
          />
        </div>
      );
    }

    if (mimeType === "application/pdf") {
      return (
        <div
          style={containerStyle}
          className="w-full h-full flex items-center justify-center"
        >
          <iframe
            src={location}
            className="w-[800px] h-[1100px] bg-white shadow-lg"
            title="PDF Viewer"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center bg-stone-700 rounded-lg border border-stone-600">
        <div className="p-4 rounded-full bg-stone-800">
          <FileText size={48} className="text-gray-400" />
        </div>
        <div className="text-gray-200">
          Không hỗ trợ xem trước <br />
          <span className="text-sm text-gray-400">{mimeType}</span>
        </div>
        <Button onClick={() => window.open(location, "_blank")}>
          <Download className="mr-2 h-4 w-4" /> Tải xuống
        </Button>
      </div>
    );
  };

  const isPreviewable =
    mimeType.startsWith("image/") || mimeType === "application/pdf";

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center overflow-auto bg-stone-800/50"
    >
      {renderContent()}

      {/* Toolbar Zoom */}
      {isPreviewable && (
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900/90 p-1.5 text-stone-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1 border-r border-stone-700 pr-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-stone-700 hover:text-white"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-stone-700 hover:text-white"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-stone-700 hover:text-white"
              onClick={() => handleZoom(-10)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums">
              {Math.round(zoom)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-stone-700 hover:text-white"
              onClick={() => handleZoom(10)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-stone-700 hover:text-white ml-1"
              onClick={() => setZoom(100)}
              title="Reset Zoom"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
