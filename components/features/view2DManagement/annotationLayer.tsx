"use client";
import React, {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ToolType, IAnnotation, IPoint } from "@/types/view";

interface AnnotationLayerProps {
  width: number;
  height: number;
  zoom: number;
  rotate: number;
  activeTool: ToolType | "text";
  annotations: IAnnotation[];
  activeColor: string;
  onChangeAnnotations: (anns: IAnnotation[]) => void;
}

export interface AnnotationLayerHandle {
  exportSnapshot: () => Promise<Blob | null>;
}

// Mở rộng interface để hỗ trợ thuộc tính rotation
type ExtendedAnnotation = IAnnotation & { rotation?: number; text?: string };

const AnnotationLayer = forwardRef<AnnotationLayerHandle, AnnotationLayerProps>(
  function AnnotationLayer(
    {
      width,
      height,
      rotate,
      zoom,
      activeTool,
      annotations,
      activeColor,
      onChangeAnnotations,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Drawing States
    const [isDragDrawing, setIsDragDrawing] = useState(false);
    const [startPos, setStartPos] = useState<IPoint>({ x: 0, y: 0 });
    const [currentPolyPoints, setCurrentPolyPoints] = useState<IPoint[]>([]);
    const [startVisualPos, setStartVisualPos] = useState<IPoint>({
      x: 0,
      y: 0,
    });
    const [textInput, setTextInput] = useState<{
      visualX: number;
      visualY: number;
      visualW: number;
      visualH: number;
      canvasX: number;
      canvasY: number;
      w: number;
      h: number;
      text: string;
    } | null>(null);

    // Interaction States
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [interactionMode, setInteractionMode] = useState<
      "none" | "drawing" | "moving" | "resizing" | "rotating" // <-- Đã thêm mode rotating
    >("none");
    const [activeHandle, setActiveHandle] = useState<string | null>(null);
    const [lastMousePos, setLastMousePos] = useState<IPoint>({ x: 0, y: 0 });
    const [initialShapeState, setInitialShapeState] =
      useState<ExtendedAnnotation | null>(null);

    // --- IMPERATIVE HANDLE ---
    useImperativeHandle(ref, () => ({
      exportSnapshot: async () => {
        const annCanvas = canvasRef.current;
        if (!annCanvas) return null;
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(annCanvas, 0, 0);
        return new Promise<Blob | null>((resolve) => {
          exportCanvas.toBlob((blob) => resolve(blob), "image/png", 1);
        });
      },
    }));

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (textInput) return;

        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          const newAnn = [...annotations];
          newAnn.pop();
          onChangeAnnotations(newAnn);
          setSelectedId(null);
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (!selectedId) return;
          if (activeTool !== "cursor" && activeTool !== "hand") return;
          e.preventDefault();
          onChangeAnnotations(annotations.filter((a) => a.id !== selectedId));
          setSelectedId(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, annotations, activeTool, onChangeAnnotations, textInput]);

    // --- HELPER FUNCTIONS ---
    const getMousePos = (e: React.MouseEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const visualX = e.clientX - rect.left;
      const visualY = e.clientY - rect.top;
      const ratioX = visualX / rect.width;
      const ratioY = visualY / rect.height;
      let x = 0;
      let y = 0;

      const r = ((rotate % 360) + 360) % 360;

      if (r === 0) {
        x = ratioX * width;
        y = ratioY * height;
      } else if (r === 90) {
        x = ratioY * width;
        y = (1 - ratioX) * height;
      } else if (r === 180) {
        x = (1 - ratioX) * width;
        y = (1 - ratioY) * height;
      } else if (r === 270) {
        x = (1 - ratioY) * width;
        y = ratioX * height;
      }

      return { x, y, visualX, visualY };
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

    // TÌM TÂM CỦA HÌNH VẼ ĐỂ XOAY QUANH ĐÓ
    const getCenter = (ann: ExtendedAnnotation) => {
      const b = getBounds(ann);
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    };

    // XOAY MỘT ĐIỂM QUANH TÂM (Dùng để tính tọa độ chuột giả lập khi hình đang bị nghiêng)
    const rotatePoint = (p: IPoint, center: IPoint, angle: number) => {
      if (!angle) return p;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
      };
    };

    const isPointInShape = (pos: IPoint, ann: ExtendedAnnotation) => {
      const b = getBounds(ann);
      const pad = 10 / zoom;
      return (
        pos.x >= b.x - pad &&
        pos.x <= b.x + b.w + pad &&
        pos.y >= b.y - pad &&
        pos.y <= b.y + b.h + pad
      );
    };

    const isPointInHandle = (
      pos: IPoint,
      rect: { x: number; y: number; w: number; h: number },
    ) => {
      const pad = 5 / zoom;
      return (
        pos.x >= rect.x - pad &&
        pos.x <= rect.x + rect.w + pad &&
        pos.y >= rect.y - pad &&
        pos.y <= rect.y + rect.h + pad
      );
    };

    // --- SAVE TEXT LOGIC ---
    const saveText = () => {
      if (textInput && textInput.text.trim() !== "") {
        onChangeAnnotations([
          ...annotations,
          {
            id: Date.now().toString(),
            type: "text" as any,
            color: activeColor,
            x: textInput.canvasX,
            y: textInput.canvasY,
            w: textInput.w,
            h: textInput.h,
            text: textInput.text,
            rotation: 0, // Mặc định góc xoay là 0 khi vừa tạo mới
          } as ExtendedAnnotation,
        ]);
      }
      setTextInput(null);
    };

    // --- DRAWING RENDERER ---
    const drawShape = (
      ctx: CanvasRenderingContext2D,
      ann: ExtendedAnnotation,
    ) => {
      ctx.save(); // Bắt đầu lưu trạng thái ma trận Canvas

      // NẾU HÌNH CÓ GÓC XOAY -> DỊCH TÂM CHUẨN BỊ XOAY
      if (ann.rotation) {
        const center = getCenter(ann);
        ctx.translate(center.x, center.y);
        ctx.rotate(ann.rotation);
        ctx.translate(-center.x, -center.y);
      }

      ctx.beginPath();
      ctx.strokeStyle = ann.color || activeColor;
      ctx.lineWidth = 3 / zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const { type } = ann;

      if (type === ("text" as ToolType) && ann.x !== undefined) {
        ctx.strokeRect(ann.x, ann.y!, ann.w!, ann.h!);
        if (ann.text) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(ann.x, ann.y!, ann.w!, ann.h!);
          ctx.clip();
          ctx.font = `${24 / zoom}px Arial`;
          ctx.fillStyle = ann.color || activeColor;
          ctx.textBaseline = "top";
          const lines = ann.text.split("\n");
          const lineHeight = (24 / zoom) * 1.2;
          lines.forEach((line: string, i: number) => {
            ctx.fillText(
              line,
              ann.x! + 6 / zoom,
              ann.y! + 6 / zoom + i * lineHeight,
            );
          });
          ctx.restore();
        }
        ctx.restore(); // Kết thúc ma trận xoay
        return;
      }

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
          2 * Math.PI,
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
        const hl = 15 / zoom;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - hl * Math.cos(angle - Math.PI / 6),
          ey - hl * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - hl * Math.cos(angle + Math.PI / 6),
          ey - hl * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      } else if (type === "measure" && ann.points && ann.points.length === 2) {
        const [p1, p2] = ann.points;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.fillStyle = ann.color || activeColor;
        ctx.beginPath();
        const rad = 4 / zoom;
        ctx.arc(p1.x, p1.y, rad, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, rad, 0, Math.PI * 2);
        ctx.fill();

        const dx = p2.x - p1.x,
          dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (p1.x + p2.x) / 2,
          midY = (p1.y + p2.y) / 2;
        ctx.save();
        ctx.font = `${14 / zoom}px Arial`;
        ctx.fillStyle = ann.color || activeColor;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3 / zoom;
        const text = `${distance.toFixed(1)} px`;
        ctx.strokeText(text, midX + 6, midY - 6);
        ctx.fillText(text, midX + 6, midY - 6);
        ctx.restore();
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

      ctx.restore(); // Phục hồi lại hệ trục tọa độ gốc (Bắt buộc)
    };

    // --- SELECTION BOX ---
    const drawSelectionBox = (
      ctx: CanvasRenderingContext2D,
      ann: ExtendedAnnotation,
    ) => {
      const b = getBounds(ann);
      const center = getCenter(ann);
      const hs = 10 / zoom;

      ctx.save();
      // ÁP DỤNG XOAY CHO KHUNG SELECT GIỐNG HỆT HÌNH BÊN TRONG
      if (ann.rotation) {
        ctx.translate(center.x, center.y);
        ctx.rotate(ann.rotation);
        ctx.translate(-center.x, -center.y);
      }

      // Khung đứt nét
      ctx.save();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      ctx.restore();

      // 4 Điểm neo resize
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1 / zoom;
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

      // --- ĐIỂM NEO ĐỂ XOAY (Ở TRÊN CÙNG) ---
      const rotHandleY = b.y - 35 / zoom;
      ctx.beginPath();
      ctx.moveTo(center.x, b.y - 2);
      ctx.lineTo(center.x, rotHandleY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center.x, rotHandleY, 6 / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // --- REDRAW ---
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
        let previewAnn: ExtendedAnnotation = {
          id: "preview",
          type: activeTool,
          color: activeColor,
          points: currentPolyPoints,
        };
        if (isDragDrawing) {
          previewAnn = {
            id: "preview",
            type: activeTool,
            color: activeColor,
            x: startPos.x,
            y: startPos.y,
            w: (previewPos?.x || startPos.x) - startPos.x,
            h: (previewPos?.y || startPos.y) - startPos.y,
          };
        }
        if (
          activeTool === "measure" &&
          currentPolyPoints.length === 1 &&
          previewPos
        ) {
          previewAnn = {
            id: "preview",
            type: "measure",
            color: activeColor,
            points: [currentPolyPoints[0], previewPos],
          };
        }
        drawShape(ctx, previewAnn);

        if (
          previewPos &&
          ["pentagon", "cloud"].includes(activeTool) &&
          currentPolyPoints.length > 0
        ) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,0,0,0.5)";
          const last = currentPolyPoints[currentPolyPoints.length - 1];
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(previewPos.x, previewPos.y);
          ctx.stroke();
        }
      }
    };

    useLayoutEffect(
      () => redraw(),
      [
        annotations,
        currentPolyPoints,
        selectedId,
        width,
        height,
        isDragDrawing,
        zoom,
      ],
    );

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (textInput) {
        saveText();
        return;
      }
      const { x, y, visualX, visualY } = getMousePos(e);
      const pos = { x, y };

      if (activeTool === "cursor" || activeTool === "hand") {
        if (selectedId && activeTool === "cursor") {
          const s = annotations.find(
            (a) => a.id === selectedId,
          ) as ExtendedAnnotation;
          if (s) {
            const b = getBounds(s);
            const center = getCenter(s);
            // KHI HÌNH ĐANG NGHIÊNG, TA XOAY NGƯỢC CON CHUỘT LẠI TRƯỚC KHI TÍNH TOÁN HIT TEST
            const localPos = rotatePoint(pos, center, -(s.rotation || 0));
            const hs = 12 / zoom;

            // 1. Kiểm tra Click vào Điểm neo xoay (Rotation Handle)
            const rotHandleRect = {
              x: center.x - hs / 2,
              y: b.y - 35 / zoom - hs / 2,
              w: hs,
              h: hs,
            };
            if (isPointInHandle(localPos, rotHandleRect)) {
              setInteractionMode("rotating");
              setInitialShapeState(s);
              return;
            }

            // 2. Kiểm tra Click vào Điểm neo Resize
            if (
              isPointInHandle(localPos, {
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
              isPointInHandle(localPos, {
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
              isPointInHandle(localPos, {
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
              isPointInHandle(localPos, {
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

        // Kiểm tra Click vào bản thân hình khối
        const clicked = [...annotations].reverse().find((a) => {
          const center = getCenter(a);
          const localPos = rotatePoint(pos, center, -0);
          return isPointInShape(localPos, a);
        });

        if (clicked) {
          setSelectedId(clicked.id);
          if (activeTool === "hand" || activeTool === "cursor") {
            setInteractionMode("moving");
            setLastMousePos(pos);
          }
        } else setSelectedId(null);
        return;
      }

      if (activeTool === "pencil") {
        setInteractionMode("drawing");
        setCurrentPolyPoints([pos]);
        return;
      }
      if (["rectangle", "circle", "arrow", "text"].includes(activeTool)) {
        setInteractionMode("drawing");
        setIsDragDrawing(true);
        setStartPos(pos);
        setStartVisualPos({ x: visualX, y: visualY });
        return;
      }
      if (activeTool === "measure") {
        setInteractionMode("drawing");
        setCurrentPolyPoints([pos]);
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

      // XỬ LÝ SỰ KIỆN XOAY HÌNH
      if (interactionMode === "rotating" && selectedId && initialShapeState) {
        const center = getCenter(initialShapeState);
        // Tính toán góc giữa tâm hình và con trỏ chuột
        const angle =
          Math.atan2(pos.y - center.y, pos.x - center.x) + Math.PI / 2;

        onChangeAnnotations(
          annotations.map((a) =>
            a.id === selectedId ? { ...a, rotation: angle } : a,
          ),
        );
        return;
      }

      if (
        interactionMode === "resizing" &&
        selectedId &&
        initialShapeState &&
        activeHandle
      ) {
        const center = getCenter(initialShapeState);
        // Resize một hình đang nghiêng đòi hỏi Vector chuột nội bộ (Local Vector)
        const localPos = rotatePoint(
          pos,
          center,
          -(initialShapeState.rotation || 0),
        );
        const localLastPos = rotatePoint(
          lastMousePos,
          center,
          -(initialShapeState.rotation || 0),
        );

        const dx = localPos.x - localLastPos.x;
        const dy = localPos.y - localLastPos.y;

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
          }),
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
          }),
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
          redraw(pos);
        }
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (
        interactionMode === "moving" ||
        interactionMode === "resizing" ||
        interactionMode === "rotating"
      ) {
        setInteractionMode("none");
        setActiveHandle(null);
        setInitialShapeState(null);
        return;
      }
      if (interactionMode === "drawing") {
        const { x, y, visualX, visualY } = getMousePos(e);
        const pos = { x, y };

        if (
          ["rectangle", "circle", "arrow", "text"].includes(activeTool) &&
          isDragDrawing
        ) {
          const w = pos.x - startPos.x;
          const h = pos.y - startPos.y;

          if (activeTool === "text") {
            const vW = visualX - startVisualPos.x;
            const vH = visualY - startVisualPos.y;
            const isClick = Math.abs(w) < 15 || Math.abs(h) < 15;
            const finalW = isClick ? 250 / zoom : Math.abs(w);
            const finalH = isClick ? 80 / zoom : Math.abs(h);
            const finalVW = isClick ? 250 : Math.abs(vW);
            const finalVH = isClick ? 80 : Math.abs(vH);

            setTextInput({
              canvasX: w < 0 && !isClick ? pos.x : startPos.x,
              canvasY: h < 0 && !isClick ? pos.y : startPos.y,
              w: finalW,
              h: finalH,
              visualX: vW < 0 && !isClick ? visualX : startVisualPos.x,
              visualY: vH < 0 && !isClick ? visualY : startVisualPos.y,
              visualW: finalVW,
              visualH: finalVH,
              text: "",
            });
          } else {
            if (Math.abs(w) > 5 || Math.abs(h) > 5) {
              onChangeAnnotations([
                ...annotations,
                {
                  id: Date.now().toString(),
                  type: activeTool,
                  color: activeColor,
                  x: startPos.x,
                  y: startPos.y,
                  w,
                  h,
                },
              ]);
            }
          }
          setIsDragDrawing(false);
          setInteractionMode("none");
          redraw();
        } else if (activeTool === "measure" && currentPolyPoints.length === 1) {
          onChangeAnnotations([
            ...annotations,
            {
              id: Date.now().toString(),
              type: "measure",
              color: activeColor,
              points: [currentPolyPoints[0], pos],
            },
          ]);
          setCurrentPolyPoints([]);
          setInteractionMode("none");
          redraw();
        } else if (activeTool === "pencil") {
          if (currentPolyPoints.length > 2)
            onChangeAnnotations([
              ...annotations,
              {
                id: Date.now().toString(),
                type: "pencil",
                color: activeColor,
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
            color: activeColor,
            points: [...currentPolyPoints],
          },
        ]);
      }
      setCurrentPolyPoints([]);
      setInteractionMode("none");
      redraw();
    };

    const cursorClass =
      interactionMode === "rotating"
        ? "cursor-grabbing" // Thay đổi con trỏ khi đang xoay
        : activeTool === "text"
          ? "cursor-crosshair"
          : activeTool === "cursor"
            ? "cursor-default"
            : activeTool === "hand"
              ? "cursor-grab"
              : "cursor-crosshair";

    return (
      <React.Fragment>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`absolute inset-0 z-40 ${cursorClass}`}
          style={{ width: "100%", height: "100%" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        />

        {textInput && (
          <textarea
            autoFocus
            value={textInput.text}
            onChange={(e) =>
              setTextInput({ ...textInput, text: e.target.value })
            }
            onBlur={saveText}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTextInput(null);
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveText();
              }
            }}
            placeholder="Type here..."
            style={{
              position: "absolute",
              left: textInput.visualX,
              top: textInput.visualY,
              width: textInput.visualW,
              height: textInput.visualH,
              color: activeColor,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              border: `2px dashed ${activeColor}`,
              boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
              outline: "none",
              fontFamily: "Arial",
              fontSize: "24px",
              lineHeight: "1.2",
              padding: "8px",
              zIndex: 50,
              resize: "none",
              overflow: "hidden",
            }}
          />
        )}
      </React.Fragment>
    );
  },
);

export default AnnotationLayer;
