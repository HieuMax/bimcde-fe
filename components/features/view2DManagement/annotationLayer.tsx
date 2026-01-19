"use client";
import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { ToolType, IAnnotation, IPoint } from "@/types/explorer";

interface AnnotationLayerProps {
  width: number;
  height: number;
  zoom: number;
  activeTool: ToolType;
  annotations: IAnnotation[];
  onChangeAnnotations: (anns: IAnnotation[]) => void;
}

export default function AnnotationLayer({
  width,
  height,
  activeTool,
  annotations,
  onChangeAnnotations,
}: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing States
  const [isDragDrawing, setIsDragDrawing] = useState(false);
  const [startPos, setStartPos] = useState<IPoint>({ x: 0, y: 0 });
  const [currentPolyPoints, setCurrentPolyPoints] = useState<IPoint[]>([]);

  // Interaction States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<
    "none" | "drawing" | "moving" | "resizing"
  >("none");
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState<IPoint>({ x: 0, y: 0 });
  const [initialShapeState, setInitialShapeState] =
    useState<IAnnotation | null>(null);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        const newAnn = [...annotations];
        newAnn.pop();
        onChangeAnnotations(newAnn);
        setSelectedId(null);
      }
      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const shape = annotations.find((a) => a.id === selectedId);
          if (shape && shape.type !== "pencil") {
            onChangeAnnotations(annotations.filter((a) => a.id !== selectedId));
            setSelectedId(null);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, annotations, onChangeAnnotations]);

  // --- HELPER FUNCTIONS ---
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Vì canvas được scale theo CSS của cha, nhưng kích thước nội tại (width/height attr) giữ nguyên
    // Nên ta cần tính tỉ lệ dựa trên rect hiển thị thực tế
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getBounds = (ann: IAnnotation) => {
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
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    const x = ann.w! > 0 ? ann.x! : ann.x! + ann.w!;
    const y = ann.h! > 0 ? ann.y! : ann.y! + ann.h!;
    return { x, y, w: Math.abs(ann.w!), h: Math.abs(ann.h!) };
  };

  const isPointInShape = (pos: IPoint, ann: IAnnotation) => {
    const b = getBounds(ann);
    const pad = 10;
    return (
      pos.x >= b.x - pad &&
      pos.x <= b.x + b.w + pad &&
      pos.y >= b.y - pad &&
      pos.y <= b.y + b.h + pad
    );
  };

  const isPointInHandle = (
    pos: IPoint,
    rect: { x: number; y: number; w: number; h: number }
  ) => {
    return (
      pos.x >= rect.x &&
      pos.x <= rect.x + rect.w &&
      pos.y >= rect.y &&
      pos.y <= rect.y + rect.h
    );
  };

  // --- DRAWING RENDERER ---
  const drawShape = (ctx: CanvasRenderingContext2D, ann: IAnnotation) => {
    ctx.beginPath();
    ctx.strokeStyle = ann.color || "red";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { type } = ann;
    if (type === "rectangle" && ann.x !== undefined)
      ctx.strokeRect(ann.x, ann.y!, ann.w!, ann.h!);
    else if (type === "circle" && ann.x !== undefined) {
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
    } else if (type === "arrow" && ann.x !== undefined) {
      const sx = ann.x,
        sy = ann.y!,
        ex = ann.x + ann.w!,
        ey = ann.y! + ann.h!;
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const angle = Math.atan2(ey - sy, ex - sx);
      const hl = 15;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - hl * Math.cos(angle - Math.PI / 6),
        ey - hl * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - hl * Math.cos(angle + Math.PI / 6),
        ey - hl * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    } else if (ann.points && ann.points.length > 1) {
      const pts = ann.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      if (type === "pentagon" || type === "pencil") {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      } else if (type === "cloud") {
        for (let i = 0; i < pts.length; i++) {
          if (ann.id === "preview" && i === pts.length - 1) break;
          const p1 = pts[i],
            p2 = pts[(i + 1) % pts.length];
          const mx = (p1.x + p2.x) / 2,
            my = (p1.y + p2.y) / 2;
          const vx = p2.x - p1.x,
            vy = p2.y - p1.y;
          const cx = mx - vy * 0.5,
            cy = my + vx * 0.5;
          ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        }
      }
      if (ann.id !== "preview" && !["pencil", "arrow"].includes(type)) {
        if (type === "pentagon") ctx.closePath();
        ctx.stroke();
      } else ctx.stroke();
    }
  };

  const drawSelectionBox = (
    ctx: CanvasRenderingContext2D,
    ann: IAnnotation
  ) => {
    const b = getBounds(ann);
    const hs = 10; // handle size
    ctx.save();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.restore();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    const handles = [
      { id: "tl", x: b.x - hs / 2, y: b.y - hs / 2 },
      { id: "tr", x: b.x + b.w - hs / 2, y: b.y - hs / 2 },
      { id: "bl", x: b.x - hs / 2, y: b.y + b.h - hs / 2 },
      { id: "br", x: b.x + b.w - hs / 2, y: b.y + b.h - hs / 2 },
    ];
    handles.forEach((h) => {
      ctx.fillRect(h.x, h.y, hs, hs);
      ctx.strokeRect(h.x, h.y, hs, hs);
    });
  };

  const redraw = (previewPos?: IPoint) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    annotations.forEach((a) => drawShape(ctx, a));
    if (selectedId) {
      const s = annotations.find((a) => a.id === selectedId);
      if (s) drawSelectionBox(ctx, s);
    }
    if (currentPolyPoints.length > 0 || (isDragDrawing && startPos)) {
      // Preview Logic
      let previewAnn: IAnnotation = {
        id: "preview",
        type: activeTool,
        color: "red",
        points: currentPolyPoints,
      };
      if (isDragDrawing) {
        // Rect, Circle, Arrow
        previewAnn = {
          id: "preview",
          type: activeTool,
          color: "red",
          x: startPos.x,
          y: startPos.y,
          w: (previewPos?.x || startPos.x) - startPos.x,
          h: (previewPos?.y || startPos.y) - startPos.y,
        };
      }
      drawShape(ctx, previewAnn);
      // Rubber band for Cloud/Pentagon
      if (
        previewPos &&
        ["pentagon", "cloud"].includes(activeTool) &&
        currentPolyPoints.length > 0
      ) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,0,0,0.5)";
        const last = currentPolyPoints[currentPolyPoints.length - 1];
        ctx.moveTo(last.x, last.y);
        if (activeTool === "pentagon") ctx.lineTo(previewPos.x, previewPos.y);
        else {
          // Cloud curve preview (simplified)
          ctx.lineTo(previewPos.x, previewPos.y);
        }
        ctx.stroke();
      }
    }
  };

  useLayoutEffect(
    () => redraw(),
    [annotations, currentPolyPoints, selectedId, width, height, isDragDrawing]
  );

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getMousePos(e);

    // 1. SELECT / MOVE / RESIZE
    if (activeTool === "cursor" || activeTool === "hand") {
      if (selectedId && activeTool === "cursor") {
        const s = annotations.find((a) => a.id === selectedId);
        if (s) {
          const b = getBounds(s);
          const hs = 12;
          if (
            isPointInHandle(pos, {
              x: b.x - hs / 2,
              y: b.y - hs / 2,
              w: hs,
              h: hs,
            })
          ) {
            setInteractionMode("resizing");
            setActiveHandle("tl");
            setInitialShapeState(s);
            setLastMousePos(pos);
            return;
          }
          if (
            isPointInHandle(pos, {
              x: b.x + b.w - hs / 2,
              y: b.y - hs / 2,
              w: hs,
              h: hs,
            })
          ) {
            setInteractionMode("resizing");
            setActiveHandle("tr");
            setInitialShapeState(s);
            setLastMousePos(pos);
            return;
          }
          if (
            isPointInHandle(pos, {
              x: b.x - hs / 2,
              y: b.y + b.h - hs / 2,
              w: hs,
              h: hs,
            })
          ) {
            setInteractionMode("resizing");
            setActiveHandle("bl");
            setInitialShapeState(s);
            setLastMousePos(pos);
            return;
          }
          if (
            isPointInHandle(pos, {
              x: b.x + b.w - hs / 2,
              y: b.y + b.h - hs / 2,
              w: hs,
              h: hs,
            })
          ) {
            setInteractionMode("resizing");
            setActiveHandle("br");
            setInitialShapeState(s);
            setLastMousePos(pos);
            return;
          }
        }
      }
      const clicked = [...annotations]
        .reverse()
        .find((a) => isPointInShape(pos, a));
      if (clicked) {
        setSelectedId(clicked.id);
        if (activeTool === "hand" || activeTool === "cursor") {
          setInteractionMode("moving");
          setLastMousePos(pos);
        }
      } else setSelectedId(null);
      return;
    }

    // 2. DRAWING
    if (activeTool === "pencil") {
      setInteractionMode("drawing");
      setCurrentPolyPoints([pos]);
      return;
    }
    if (["rectangle", "circle", "arrow"].includes(activeTool)) {
      setInteractionMode("drawing");
      setIsDragDrawing(true);
      setStartPos(pos);
      return;
    }
    if (["pentagon", "cloud"].includes(activeTool)) {
      setInteractionMode("drawing");
      setCurrentPolyPoints((p) => [...p, pos]);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (
      interactionMode === "resizing" &&
      selectedId &&
      initialShapeState &&
      activeHandle
    ) {
      const dx = pos.x - lastMousePos.x;
      const dy = pos.y - lastMousePos.y;
      const oldB = getBounds(initialShapeState);
      let nX = oldB.x,
        nY = oldB.y,
        nW = oldB.w,
        nH = oldB.h;
      if (activeHandle === "br") {
        nW += dx;
        nH += dy;
      } else if (activeHandle === "bl") {
        nX += dx;
        nW -= dx;
        nH += dy;
      } else if (activeHandle === "tr") {
        nY += dy;
        nH -= dy;
        nW += dx;
      } else if (activeHandle === "tl") {
        nX += dx;
        nW -= dx;
        nY += dy;
        nH -= dy;
      }

      onChangeAnnotations(
        annotations.map((a) => {
          if (a.id === selectedId) {
            if (a.points && initialShapeState.points) {
              const sX = nW / oldB.w;
              const sY = nH / oldB.h;
              return {
                ...a,
                points: initialShapeState.points.map((p) => ({
                  x: nX + (p.x - oldB.x) * sX,
                  y: nY + (p.y - oldB.y) * sY,
                })),
              };
            }
            return { ...a, x: nX, y: nY, w: nW, h: nH };
          }
          return a;
        })
      );
      return;
    }

    if (interactionMode === "moving" && selectedId) {
      const dx = pos.x - lastMousePos.x;
      const dy = pos.y - lastMousePos.y;
      onChangeAnnotations(
        annotations.map((a) => {
          if (a.id === selectedId) {
            if (a.points)
              return {
                ...a,
                points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            return { ...a, x: (a.x || 0) + dx, y: (a.y || 0) + dy };
          }
          return a;
        })
      );
      setLastMousePos(pos);
      return;
    }

    if (interactionMode === "drawing") {
      if (activeTool === "pencil") {
        const last = currentPolyPoints[currentPolyPoints.length - 1];
        if (
          !last ||
          Math.abs(pos.x - last.x) > 2 ||
          Math.abs(pos.y - last.y) > 2
        )
          setCurrentPolyPoints((p) => [...p, pos]);
      } else {
        redraw(pos); // For previewing drag shapes and rubber bands
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (interactionMode === "moving" || interactionMode === "resizing") {
      setInteractionMode("none");
      setActiveHandle(null);
      setInitialShapeState(null);
      return;
    }
    if (interactionMode === "drawing") {
      const pos = getMousePos(e);
      if (
        ["rectangle", "circle", "arrow"].includes(activeTool) &&
        isDragDrawing
      ) {
        const w = pos.x - startPos.x,
          h = pos.y - startPos.y;
        if (Math.abs(w) > 5 || Math.abs(h) > 5) {
          onChangeAnnotations([
            ...annotations,
            {
              id: Date.now().toString(),
              type: activeTool,
              color: "red",
              x: startPos.x,
              y: startPos.y,
              w,
              h,
            },
          ]);
        }
        setIsDragDrawing(false);
        setInteractionMode("none");
      } else if (activeTool === "pencil") {
        if (currentPolyPoints.length > 2)
          onChangeAnnotations([
            ...annotations,
            {
              id: Date.now().toString(),
              type: "pencil",
              color: "red",
              points: [...currentPolyPoints],
            },
          ]);
        setCurrentPolyPoints([]);
        setInteractionMode("none");
        redraw();
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      ["pentagon", "cloud"].includes(activeTool) &&
      currentPolyPoints.length >= 2
    ) {
      onChangeAnnotations([
        ...annotations,
        {
          id: Date.now().toString(),
          type: activeTool,
          color: "red",
          points: [...currentPolyPoints],
        },
      ]);
    }
    setCurrentPolyPoints([]);
    setInteractionMode("none");
    redraw();
  };

  const cursorClass =
    activeTool === "cursor"
      ? "cursor-default"
      : activeTool === "hand"
      ? "cursor-grab"
      : "cursor-crosshair";

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 z-50 ${cursorClass}`}
      style={{ width: "100%", height: "100%" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
}
