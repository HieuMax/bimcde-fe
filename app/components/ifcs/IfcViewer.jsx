'use client';

import { useState, useEffect, useRef, useCallback} from 'react';
import { ThreeScene } from '@/app/libs/ifc/scene';
import * as THREE from "three";
import { IfcManager } from '@/app/libs/ifc/ifc-manager';
import { TreeNode } from './TreeNode';
import TodoList from '@/components/todos/TodoList';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Info,
  EllipsisVertical,
  Menu, Search, Check,
  Paperclip,
  Expand,
  SquareScissors,
  Shrink,
  SquaresSubtract
} from 'lucide-react';
import './ifc.css';
import LoadingBar from '../LoadingBar';

import { ViewList } from '@/components/views/ViewList';
import { DataTable } from '@/components/_3d/data_table/DataTable';
import { Topics } from '@/components/_3d/topics/Topics';
import { ClashSets } from '@/components/_3d/clash_sets/ClashSets';
import { Organizer } from '@/components/_3d/organizer/Organizer';
import { PropertiesDrawer } from './PropertiesDrawer';
import { AttachFileDialog } from '@/components/todos/AttachFileDialog';
import { fa } from 'zod/v4/locales';

export default function IfcViewer({
  ifcUrls,
  state,
  projectId,
  isCollapsed,
  setSelectdItemsForNavbar,
  onRegisterCapture,
  onLoaded,
  onSelectTodo,
  onOpenTodoDrawer,
  onOpenViewDrawer,
  onRestoreView,
  onUpdateSnapshot,
  modelOpacity,
  onOpacityChange,
  selectionMode = 'single',
  areaSelectEnabled = false,
  clipMode,
  hoverMode,
  onVerticalClipCreated,
  onClearVerticalClips,
  onClipSelected, 
  onClipDeselected  ,
  // onClearVerticalClips
}) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);

  const modelUrlMap = useRef({})

  // Keep latest props for event listeners that are registered once
  const selectionModeRef = useRef(selectionMode);
  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  // Area selection (drag rectangle) flag for one-time listeners
  const areaSelectEnabledRef = useRef(areaSelectEnabled);
  useEffect(() => {
    areaSelectEnabledRef.current = areaSelectEnabled;
  }, [areaSelectEnabled]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [openModel, setOpenModel] = useState({});
  const [selectedTreePaths, setSelectedTreePaths] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState({});
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState([]);
  //< "name" | "date-modified" >
  const [sortBy, setSortBy] = useState("date-modified")
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [searchQuery, setSearchQuery] = useState("")

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState(null);
  const [isLoadingProps, setIsLoadingProps] = useState(false);

  const EXPANDED_WIDTH = 370;
  const COLLAPSED_WIDTH = 250;

  // const [isCollapsed, setIsCollapsed] = useState(false);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Sync selected items to parent (navbar) AFTER state updates
  useEffect(() => {
    if (!setSelectdItemsForNavbar) return;
    const payload = (selectedItems || []).map(item => ({
      ...item,
      fileUrl: item.fileUrl || modelUrlMap.current[item.modelID],
    }));
    setSelectdItemsForNavbar(payload);
  }, [selectedItems, setSelectdItemsForNavbar]);

  // Model list
  const [models, setModels] = useState([]);
  const modelsRef = useRef(models);
  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  // DATA TABLE
  const isDataTable = state === 'data-table';

  // Area selection rectangle overlay (canvas-local px)
  const [selectionRect, setSelectionRect] = useState(null); // {x,y,w,h}
  const selectionRectRef = useRef(null);
  const areaDragRef = useRef({ active: false, startX: 0, startY: 0 });


  // 1. Hàm lấy trạng thái Clip hiện tại để lưu
const getClippingState = () => {
    // Lấy context từ viewer (tùy thuộc vào library bạn dùng, đây là ví dụ logic)
    // Nếu dùng ifc.js components:
    const clipper = viewerRef.current.clipper; 
    
    if (!clipper || !clipper.active) {
        return { enabled: false, planes: [] };
    }

    // Lấy danh sách các planes (Three.js Plane: normal & constant)
    const planes = clipper.planes.map(p => ({
        normal: { x: p.normal.x, y: p.normal.y, z: p.normal.z },
        constant: p.constant
    }));

    return {
        enabled: true,
        planes: planes
    };
};

// 2. Hàm khôi phục Clip từ data đã lưu
const restoreClippingState = (clippingData) => {
    const clipper = viewerRef.current.clipper;
    
    // Xóa hết clip cũ trước
    clipper.deleteAllPlanes();
    
    if (!clippingData || !clippingData.enabled || !clippingData.planes) {
        return;
    }

    // Tạo lại planes
    clippingData.planes.forEach(pData => {
        const normal = new THREE.Vector3(pData.normal.x, pData.normal.y, pData.normal.z);
        // Gọi hàm tạo plane của viewer library
        clipper.createPlane(normal, pData.constant); 
    });
};
// =====================================================
// CLIP PLANE 
// =====================================================
const [selectedPlaneId, setSelectedPlaneId] = useState(null);
// Hover
const hoverGroupRef = useRef(new THREE.Group());
// state từng mặt
const sectionIndexRef = useRef(1); 

// Core refs
const planesDataRef = useRef([]);
const planeHelpersGroupRef = useRef(new THREE.Group());
const cutFaceGroupRef = useRef(new THREE.Group());

const draggingPlaneRef = useRef(null);
const lastMouseYRef = useRef(0);

// =====================================================
// HELPERS
// =====================================================
const getSceneBoundingBox = useCallback(() => {
  const box = new THREE.Box3();
  models.forEach(m => m.mesh && box.expandByObject(m.mesh));
  return box;
}, [models]);

// MARKER ĐÁNH DẤU THỨ TỰ TỪNG CLIP
const createSectionMarker = (point, index) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Nền tròn
  ctx.beginPath();
  ctx.arc(64, 64, 55, 0, Math.PI * 2);
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  
  // Viền trắng
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Số
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index), 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  
  // 🔥 Dùng SpriteMaterial thay vì MeshBasicMaterial
  const mat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false, // Luôn nổi lên trên
    depthWrite: false,
    sizeAttenuation: true // Thu nhỏ khi ở xa (tự nhiên)
  });

  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(point);
  
  // 🔥 Scale sprite (Sprite mặc định size 1x1, cần chỉnh to lên chút)
  sprite.scale.set(1.5, 1.5, 1); 
  
  sprite.renderOrder = 10000; // Vẽ sau cùng
  sprite.userData.isClipHelper = true;

  return sprite;
};

/**
 * 🔒 FIXED NORMAL
 * 👉 LUÔN cắt theo chiều rộng (WORLD Z)
 * 👉 KHÔNG đổi theo camera
 */

// =====================================================
// CLEAR
// =====================================================
const clearAllClippingPlanes = useCallback(() => {
  if (!sceneRef.current) return;

  const renderer = sceneRef.current.getRenderer();
  renderer.localClippingEnabled = false;
  renderer.clippingPlanes = [];

  cutFaceGroupRef.current.clear();
  planeHelpersGroupRef.current.clear();
  planesDataRef.current = [];

  setSelectedPlaneId(null);
  sectionIndexRef.current = 1;

  // Reset clipping trên material
  sceneRef.current.scene.traverse(obj => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(m => {
      m.clippingPlanes = null;
      m.needsUpdate = true;
    });
  });
}, []);

useEffect(() => {
  if (!onClearVerticalClips) return;

  onClearVerticalClips(() => {
    clearAllClippingPlanes();
  });
}, [onClearVerticalClips, clearAllClippingPlanes]);

// =====================================================
// CUT FACE (GREEN PLANE ONLY)
// =====================================================
const createCutFaceBackground = useCallback((plane) => {
    const bbox = getSceneBoundingBox();
    const size = bbox.getSize(new THREE.Vector3());
    const width  = Math.max(size.x, size.z) * 1.2;
    const height = size.y * 1.2;

    const geo = new THREE.PlaneGeometry(width, height);

    // --- A. Nền Mờ ---
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; 
    ctx.fillRect(0, 0, 64, 64);
    
    const bgMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthTest: true, 
      depthWrite: false,
      // 🔥 QUAN TRỌNG: Khẳng định lại lần nữa là không bị cắt
      clippingPlanes: [] 
    });
    const background = new THREE.Mesh(geo, bgMat);

    // --- B. Viền ---
    const borderCanvas = document.createElement('canvas');
    borderCanvas.width = 512; borderCanvas.height = 512;
    const bCtx = borderCanvas.getContext('2d');
    bCtx.strokeStyle = '#2563eb'; bCtx.lineWidth = 15;
    bCtx.strokeRect(5, 5, 502, 502);

    const borderMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(borderCanvas),
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      clippingPlanes: [] // 🔥 Viền cũng không bị cắt
    });
    const borderMesh = new THREE.Mesh(geo, borderMat);
    
    const group = new THREE.Group();
    group.add(background);
    group.add(borderMesh);
    
    // Định vị
    const p = plane.normal.clone().multiplyScalar(-plane.constant);
    group.position.copy(p);
    
    const forward = new THREE.Vector3(0, 0, 1);
    group.quaternion.setFromUnitVectors(forward, plane.normal);
    
    group.userData.isClipHelper = true; 
    return group;
  }, [getSceneBoundingBox]);

// =====================================================
// APPLY CLIP
// =====================================================
  const updateRendererPlanes = useCallback(() => {
    if (!sceneRef.current) return;
    const renderer = sceneRef.current.getRenderer();

    // 1. Lấy danh sách tất cả các mặt cắt
    // const allPlanes = planesDataRef.current.map(d => d.plane);
    const allPlanes = planesDataRef.current
      .filter(d => d.isActive)
      .map(d => d.plane);

    renderer.localClippingEnabled = true;
    
    // 🔥 FIX QUAN TRỌNG: KHÔNG gán cho Global Renderer
    // Để tránh việc mặt cắt này cắt mất hình ảnh của mặt cắt kia
    renderer.clippingPlanes = []; 

    // 2. Chỉ áp dụng cắt lên các Model (Mesh vật thể)
    sceneRef.current.scene.traverse(obj => {
      // Bỏ qua Visual Helper, Bỏ qua Grid, v.v.
      if (!obj.isMesh || obj.userData.isClipHelper || obj.parent?.userData.isClipHelper) return;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => {
        // Chỉ vật thể mới chịu tác động của dao cắt
        if (allPlanes.length > 0) {
            m.clippingPlanes = allPlanes; 
            m.clipIntersection = false; // false = Cắt gọt dần (Union)
            m.clipShadows = true;
            m.needsUpdate = true;
        } else {
            m.clippingPlanes = null;
            m.needsUpdate = true;
        }
      });
    });
  }, []);

// =====================================================
// CREATE SECTION (MAIN)
// =====================================================
const createVerticalSectionAtPoint = useCallback(
  (point, faceNormal = null) => {
    if (!sceneRef.current) return;

    let normal = new THREE.Vector3();
    let planePoint = point.clone();
    let isActive = true;

    if (hoverMode === 'faces' && faceNormal) {
      // ===== FACES MODE =====
      normal.copy(faceNormal).normalize();

      // đặt plane ngoài bề mặt
      const EPS = 0;
      planePoint.add(normal.clone().multiplyScalar(EPS));

      isActive = false; // 🔥 chưa cắt, chờ drag
    } else {
      // ===== LINES MODE =====
      normal.set(0, 0, 1);
    }

    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
      isActive ? normal.clone().negate() : normal,
      planePoint
    );

    const visualPlane = createCutFaceBackground(plane);

    const index = sectionIndexRef.current++;
    const marker = createSectionMarker(point, index);

    marker.userData = {
      isClipHelper: true,
      isMarker: true,
      id: index
    };

    cutFaceGroupRef.current.add(visualPlane);
    cutFaceGroupRef.current.add(marker);

    const safeNormal =
      normal.lengthSq() > 0
        ? normal.clone().normalize()
        : new THREE.Vector3(0, 0, 1);
    planesDataRef.current.push({
      id: index,
      plane,
      visual: visualPlane,
      marker,
      originalNormal: safeNormal,
      mode: hoverMode,
      isActive,
      anchorPoint: planePoint.clone()
    });

    updateRendererPlanes();
  },
  [hoverMode, createCutFaceBackground, updateRendererPlanes]
);

//  ĐẢO CHIỀU CLIP
  const flipPlaneDirection = useCallback(() => {
    if (!selectedPlaneId) return;

    // Tìm plane trong dữ liệu
    const planeData = planesDataRef.current.find(p => p.id === selectedPlaneId);
    if (!planeData) return;

    const { plane, visual } = planeData;

    // 1. Đảo ngược toán học (Normal * -1)
    plane.negate();

    // 2. Cập nhật Visual (Xoay 180 độ hoặc set lại hướng)
    const forward = new THREE.Vector3(0, 0, 1);
    visual.quaternion.setFromUnitVectors(forward, plane.normal);

    // 3. Cập nhật Renderer
    updateRendererPlanes();

    console.log("🔄 Flipped Plane:", selectedPlaneId);
  }, [selectedPlaneId, updateRendererPlanes]);

  // XÓA CLIP
  const deleteSelectedPlane = useCallback(() => {
    if (!selectedPlaneId) return;

    // 1. Tìm và xóa khỏi Scene
    const planeData = planesDataRef.current.find(p => p.id === selectedPlaneId);
    if (planeData) {
        cutFaceGroupRef.current.remove(planeData.visual);
        cutFaceGroupRef.current.remove(planeData.marker);
    }

    // 2. Xóa khỏi mảng dữ liệu
    planesDataRef.current = planesDataRef.current.filter(p => p.id !== selectedPlaneId);

    // 3. Reset State & UI
    setSelectedPlaneId(null);
    if (onClipDeselected) onClipDeselected();

    // 4. Update Renderer
    updateRendererPlanes();

  }, [selectedPlaneId, updateRendererPlanes, onClipDeselected]);

// CHỌN MARKER
  useEffect(() => {

    planesDataRef.current.forEach(data => {
        const isSelected = data.id === selectedPlaneId;
        const sprite = data.marker;
        
        
        if (isSelected) {
            sprite.material.color.setHex(0xff0000);
            sprite.scale.set(1.8, 1.8, 1); 
        } else {
            sprite.material.color.setHex(0xffffff); 
            sprite.scale.set(1.5, 1.5, 1);
        }
    });

    if (selectedPlaneId && onClipSelected) {
        onClipSelected({
            onFlipClipDirection: flipPlaneDirection,
            onDeleteClip: deleteSelectedPlane
        });
    } else if (!selectedPlaneId && onClipDeselected) {
        onClipDeselected(); // Cẩn thận loop, chỉ gọi khi click ra ngoài
    }

  }, [selectedPlaneId, flipPlaneDirection, deleteSelectedPlane, onClipSelected, onClipDeselected]);
// =====================================================
// CLICK EVENT
// =====================================================
  useEffect(() => {
    if (clipMode === 'none') return;
    if (!canvasRef.current || !sceneRef.current) return;
    
    const canvas = canvasRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, sceneRef.current.getCamera());

        // ---KIỂM TRA CLICK VÀO MARKER TRƯỚC ---
        // Raycast vào group chứa visual/marker
        const helperHits = raycaster.intersectObjects(cutFaceGroupRef.current.children, true);
        
        const markerHit = helperHits.find(h => h.object.userData.isMarker);

        if (markerHit) {
          const id = markerHit.object.userData.id;
          setSelectedPlaneId(id);
          draggingPlaneRef.current = id;
          lastMouseYRef.current = e.clientY;
          return;
        }
        // --- XỬ LÝ TẠO MẶT CẮT MỚI ---          
        if (selectedPlaneId) {
            setSelectedPlaneId(null);
            if (onClipDeselected) onClipDeselected();
        }

        const meshes = modelsRef.current.map(m => m.mesh).filter(Boolean);
        const hits = raycaster.intersectObjects(meshes, true);
        const activePlanes = planesDataRef.current.map(d => d.plane);

        const validHit = hits.find(hit => {
          if (hit.object.userData.isClipHelper || hit.object.parent?.userData.isClipHelper) {
            return false;
          }

          // 🔥 Faces: 
          if (hoverMode === 'faces') {
            const worldNormal = hit.face.normal
              .clone()
              .applyQuaternion(hit.object.quaternion);

            const viewDir = new THREE.Vector3()
              .subVectors(sceneRef.current.getCamera().position, hit.point)
              .normalize();

            if (worldNormal.dot(viewDir) <= 0) return false;
          }

          const isClipped = activePlanes.some(
            plane => plane.distanceToPoint(hit.point) < -0.001
          );

          return !isClipped;
        });

        if (validHit) {
          const worldNormal = validHit.face.normal.clone();
          worldNormal.applyQuaternion(validHit.object.quaternion);

          createVerticalSectionAtPoint(
            validHit.point,
            hoverMode === 'faces' ? worldNormal : null
          );
        }
    };

    const onMouseMove = (e) => {
      if (!draggingPlaneRef.current) return;

      const planeData = planesDataRef.current.find(
        p => p.id === draggingPlaneRef.current
      );
      if (!planeData) return;

      const normal =
        planeData.originalNormal?.lengthSq() > 0
          ? planeData.originalNormal
          : new THREE.Vector3(0, 0, 1);

      // ===
      const SPEED = 0.04; 
      const deltaPx = e.clientY - lastMouseYRef.current;
      lastMouseYRef.current = e.clientY;

      // === 
      planeData.anchorPoint.add(
        normal.clone().multiplyScalar(deltaPx * SPEED)
      );

      // === update plane
      planeData.plane.setFromNormalAndCoplanarPoint(
        planeData.isActive
          ? normal.clone().negate()
          : normal,
        planeData.anchorPoint
      );

      // === faces: activate khi kéo vào
      if (
        planeData.mode === 'faces' &&
        !planeData.isActive &&
        deltaPx > 0
      ) {
        planeData.isActive = true;
        planeData.plane.normal.copy(normal.clone().negate());
      }

      // ===  update visual + marker
      const p = planeData.plane.normal
        .clone()
        .multiplyScalar(-planeData.plane.constant);

      planeData.visual.position.copy(p);
      planeData.marker.position.copy(p);

      updateRendererPlanes();
    };


    const onMouseUp = () => {
      draggingPlaneRef.current = null;
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

  }, [clipMode, models, createVerticalSectionAtPoint, selectedPlaneId]); 

// =====================================================
// INIT GROUPS (SAFE CLEANUP)
// =====================================================
useEffect(() => {
  if (!sceneRef.current) return;

  const scene = sceneRef.current.scene;

  const cutFaceGroup = cutFaceGroupRef.current;
  const helperGroup = planeHelpersGroupRef.current;
  const hoverGroup = hoverGroupRef.current;

  scene.add(cutFaceGroup);
  scene.add(helperGroup);
  scene.add(hoverGroup);

  return () => {
    scene.remove(cutFaceGroup);
    scene.remove(helperGroup);
    scene.remove(hoverGroup);

    cutFaceGroup.clear();
    helperGroup.clear();
    hoverGroup.clear();
  };
}, [models]);

  useEffect(() => {
    if (!ifcUrls?.length || !canvasRef.current) return;

    const load = async () => {
      setIsLoading(true);

      const canvas = canvasRef.current;

      if (!loaderRef.current) {
        const scene = new ThreeScene(canvasRef.current);
        sceneRef.current = scene;
        loaderRef.current = new IfcManager(scene.scene, []);
//
        // --- AREA SELECTION handlers (registered once, driven by refs) ---
        const getCanvasLocal = (ev) => {
          const rect = canvas.getBoundingClientRect();
          return { x: ev.clientX - rect.left, y: ev.clientY - rect.top, rect };
        };

        const onAreaMouseDown = (ev) => { // start drag
          if (!areaSelectEnabledRef.current) return;
          if (ev.button !== 0) return;
          const { x, y } = getCanvasLocal(ev);
          areaDragRef.current.active = true;
          areaDragRef.current.startX = x;
          areaDragRef.current.startY = y;
          const r0 = { x, y, w: 0, h: 0 };
          selectionRectRef.current = r0;
          setSelectionRect(r0);
          ev.preventDefault();
          ev.stopPropagation();
        };

        const onAreaMouseMove = (ev) => { // update drag
          if (!areaDragRef.current.active) return;
          const { x, y } = getCanvasLocal(ev);
          const sx = areaDragRef.current.startX;
          const sy = areaDragRef.current.startY;
          const left = Math.min(sx, x);
          const top = Math.min(sy, y);
          const w = Math.abs(x - sx);
          const h = Math.abs(y - sy);
          const r = { x: left, y: top, w, h };
          selectionRectRef.current = r;
          setSelectionRect(r);
          ev.preventDefault();
          ev.stopPropagation();
        };

        const onAreaMouseUp = () => { // end drag + pick
          if (!areaDragRef.current.active) return;
          areaDragRef.current.active = false;

          const rectData = selectionRectRef.current;
          setSelectionRect(null);
          selectionRectRef.current = null;

          if (!rectData || rectData.w < 5 || rectData.h < 5) return;
          if (!sceneRef.current || !loaderRef.current) return;

          const bounds = canvas.getBoundingClientRect();
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();

          // sample grid density based on rectangle size (good tradeoff vs perf)
          const stepPx = 35;
          const nx = Math.max(3, Math.min(24, Math.floor(rectData.w / stepPx)));
          const ny = Math.max(3, Math.min(24, Math.floor(rectData.h / stepPx)));

          const meshes = models.map(m => m.mesh).filter(Boolean);
          const foundMap = new Map();

          for (let ix = 0; ix < nx; ix++) { // across 
            for (let iy = 0; iy < ny; iy++) { 
              const px = rectData.x + (rectData.w * (ix + 0.5)) / nx;
              const py = rectData.y + (rectData.h * (iy + 0.5)) / ny;

              mouse.x = (px / bounds.width) * 2 - 1;
              mouse.y = -(py / bounds.height) * 2 + 1;

              raycaster.setFromCamera(mouse, sceneRef.current.getCamera());
              const hits = raycaster.intersectObjects(meshes, true);
              if (!hits.length) continue;

              const hit = hits.find(h => !h.object?.userData?.isClipHelper && !h.object?.parent?.userData?.isClipHelper);
              if (!hit) continue;

              const faceIndex = hit.faceIndex;
              const geometry = hit.object.geometry;
              const expressID = loaderRef.current.ifcLoader.ifcManager.getExpressId(geometry, faceIndex);
              const modelID = hit.object.modelID;
              if (modelID == null || expressID == null) continue;

              const key = `${modelID}:${expressID}`;
              if (!foundMap.has(key)) {
                foundMap.set(key, {
                  modelID,
                  expressID,
                  fileUrl: modelUrlMap.current[modelID],
                });
              }
            }
          }

          const picked = Array.from(foundMap.values());
          if (picked.length === 0) return;
          
          // Merge picked with existing selection based on mode
          const multi = selectionModeRef.current === 'multi'; 
          setSelectedItems(prev => {
            const prevArr = Array.isArray(prev) ? prev : [];
            const base = multi ? prevArr : [];
            const merged = [...base];

            const seen = new Set(base.map(i => `${i.modelID}:${i.expressID}`));
            picked.forEach(p => {
              const k = `${p.modelID}:${p.expressID}`;
              if (!seen.has(k)) {
                merged.push(p);
                seen.add(k);
              }
            });

            if (loaderRef.current?.highlightItems) {
              void loaderRef.current.highlightItems(merged);
            }

            return merged;
          });
        };

        canvas.addEventListener('mousedown', (e) => {
          mouseDownPos.current = { x: e.clientX, y: e.clientY };
          isDragging.current = false;
        });

        /** IF MOUSE MOVES -> DRAGGING */
        canvas.addEventListener('mousemove', (e) => {
          const dx = Math.abs(e.clientX - mouseDownPos.current.x);
          const dy = Math.abs(e.clientY - mouseDownPos.current.y);
          if (dx > 3 || dy > 3) {
            isDragging.current = true;
          }
        });

        // Capture events early so camera controls don't swallow drag selection
        canvas.addEventListener('mousedown', onAreaMouseDown, true);
        canvas.addEventListener('mousemove', onAreaMouseMove, true);
        window.addEventListener('mouseup', onAreaMouseUp, true);

        /** ONLY PICK IF NOT DRAGGING */
        canvas.addEventListener('mouseup', (event) => {
          if (areaSelectEnabledRef.current) return; // area mode uses its own mouseup logic
          
          if (!isDragging.current) { // click without drag(US119)
            // 1. Thực hiện Raycaster 
            const rect = canvas.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, scene.getCamera());
            
            // Lấy danh sách mesh từ models
            const meshes = modelsRef.current.map(m => m.mesh).filter(Boolean);
            const intersects = raycaster.intersectObjects(meshes, true);

            // Lọc bỏ các object không phải model 
            const validHit = intersects.find(h => !h.object.userData.isClipHelper);
            const result = loaderRef.current.pick(event, scene.getCamera(), scene.getRenderer());

              if (result) {
              const sourceUrl = modelUrlMap.current[result.modelID]
                // Lấy dữ liệu face nếu có
              let faceData = null;
              if (validHit && validHit.face) {
                  
                  const normal = validHit.face.normal.clone().applyQuaternion(validHit.object.quaternion).normalize();
                  
                  const point = validHit.point.clone();

                  faceData = {
                      normal: normal,
                      point: point,
                      faceIndex: validHit.faceIndex,
                      mesh: validHit.object,
                      distance: validHit.distance
                  };
              }
              const enrichedItem = { ...result, fileUrl: sourceUrl, faceData: faceData };

              // Handle selection modes (US123)
              if (selectionModeRef.current === 'multi') {
                // Multi-selection: toggle without needing Ctrl
                setSelectedItems(prev => {
                  const isAlreadySelected = prev.some(item => 
                    item.modelID === result.modelID && item.expressID === result.expressID
                  );
                  
                  const newSelected = isAlreadySelected
                    ? prev.filter(item => !(item.modelID === result.modelID && item.expressID === result.expressID))
                    : [...prev, enrichedItem];
                  
                  // Keep 3D highlight in sync with multi-selection
                  if (loaderRef.current?.highlightItems) {
                    if (newSelected.length > 0) {
                      void loaderRef.current.highlightItems(newSelected);
                    } else {
                      loaderRef.current.removeHighlight?.();
                    }
                  }

                  return newSelected;
                });
              } else {
                // Single selection
                setSelectedItems([enrichedItem]);
              }
            } else {
              // Click on empty space
              // setSelectedItems([]);
            }
          }
        });
      }

      //
      // LOADING MODELS
      //
      if (ifcUrls?.length) {
        loaderRef.current.clearModels();

        modelUrlMap.current = {};

        const loadPromises = ifcUrls.map(url => loaderRef.current.loadIfcUrl(url));

        const loadedModels = await Promise.all(loadPromises);
        const newModels = [];

        for (let i = 0; i < loadedModels.length; i++) {
          const model = loadedModels[i];
          const url = ifcUrls[i];
          const modelID = model.modelID;

          modelUrlMap.current[modelID] = url;

          const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);
          newModels.push({
            id: i,
            ifcModelID: modelID,
            name: url.split('/').pop(),
            tree,
            layers,
            mesh: model.mesh,
            visible: true,
          });
        }
        setModels(newModels);
        if (onLoaded) onLoaded();
      }

      setIsLoading(false);
    };

    load();
  }, [ifcUrls]);

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // HANDLE RESIZE
  useEffect(() => {
    if (!canvasRef.current || !loaderRef.current || models.length < 1) return;
    const renderer = sceneRef.current.getRenderer();
    const camera = sceneRef.current.getCamera();

    const resize = () => {
      const parent = canvasRef.current.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [models.length]);

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }, [isCollapsed, state === 'data-table']);


  useEffect(() => {
    if (!selectedTreePaths.length) {
      setSelectedItems([]);
      if (setSelectdItemsForNavbar) {
        setSelectdItemsForNavbar([]);
      }
      return;
    }

    const selectedItemsArray = selectedTreePaths.map(({ modelIndex, expressID }) => {
      const sourceUrl = modelUrlMap.current[modelIndex];
      return {
        modelID: modelIndex,
        expressID: expressID,
        fileUrl: sourceUrl
      };
    });

    setSelectedItems(selectedItemsArray);

    if (setSelectdItemsForNavbar) {
      setSelectdItemsForNavbar(selectedItemsArray);
    }
  }, [selectedTreePaths]);

  const onToggleLayer = (modelId, typeId) => {
    loaderRef.current.toggleTypeVisibility(modelId, typeId);
  };

  const layerKey = (modelID, typeId) => `${modelID}_${typeId}`;

  const isLayerVisible = (modelID, typeId) => !hiddenLayers.has(layerKey(modelID, typeId));


  // Related to camera state
  const captureCurrentState = () => {
    if (!sceneRef.current || !loaderRef.current) return null;

    const cameraState = sceneRef.current.getCameraState();

    const hiddenState = loaderRef.current.getVisibilityState();

    const selectionState = selectedItems.map(item => ({
      modelID: item.modelID,
      expressID: item.expressID,
      fileUrl: item.fileUrl
    }));

    const thumbnail = sceneRef.current.getScreenshot();

    return {
      camera: cameraState,
      visibility: hiddenState,
      selection: selectionState,
      thumbnail: thumbnail,
      modelOpacity: modelOpacity
    };
  };

  // === RESTORE STATE ===
  const restoreState = async (viewState, todoItems = []) => {
    if (!viewState || !sceneRef.current || !loaderRef.current) return;

    if (onOpacityChange) {
      const savedOpacity = viewState.modelOpacity !== undefined ? viewState.modelOpacity : 1;
      onOpacityChange(savedOpacity);
    }

    // ---------------------------------------------------------
    // 1. PREPARE MAPPING (URL <-> Model ID)
    // ---------------------------------------------------------

    const urlToNewId = {};
    Object.keys(modelUrlMap.current).forEach(id => {
      const url = modelUrlMap.current[id];
      urlToNewId[url] = parseInt(id);
    });

    const oldIdToUrl = {};

    // R1: Todo Items
    if (todoItems && Array.isArray(todoItems)) {
      todoItems.forEach(item => {
        if (item.fileUrl) oldIdToUrl[String(item.modelId)] = item.fileUrl;
      });
    }

    // R2: Selection in Snapshot
    if (viewState.selection && Array.isArray(viewState.selection)) {
      viewState.selection.forEach(item => {
        if (item.fileUrl) oldIdToUrl[String(item.modelID)] = item.fileUrl;
      });
    }

    // ---------------------------------------------------------
    // 2. RESTORE CAMERA
    // ---------------------------------------------------------
    sceneRef.current.setCameraState(viewState.camera);


    // ---------------------------------------------------------
    // 3. RESTORE VISIBILITY
    // ---------------------------------------------------------
    const mappedVisibility = [];
    const newHiddenItemsReactState = {};

    if (viewState.visibility && Array.isArray(viewState.visibility)) {
      viewState.visibility.forEach(group => {
        let url = group.fileUrl;

        if (!url) {
          const oldID = String(group.modelID);
          url = oldIdToUrl[oldID];
        }

        // Fallback
        if (!url && ifcUrls.length === 1) {
          url = ifcUrls[0];
        }

        const newID = urlToNewId[url];

        if (newID !== undefined && group.ids && group.ids.length > 0) {
          const numericIds = group.ids.map(id => Number(id));

          mappedVisibility.push({
            modelID: newID,
            ids: numericIds
          });

          numericIds.forEach(id => {
            newHiddenItemsReactState[`${newID}-${id}`] = true;
          });
        }
      });
    }

    loaderRef.current.restoreVisibilityState(mappedVisibility);
    setHiddenItems(newHiddenItemsReactState);


    // ---------------------------------------------------------
    // 4. RESTORE SELECTION & HIGHLIGHT
    // ---------------------------------------------------------
    let itemsToHighlight = [];

    const sourceItems = (todoItems && todoItems.length > 0) ? todoItems : viewState.selection;

    if (sourceItems && Array.isArray(sourceItems)) {
      sourceItems.forEach(item => {
        const url = item.fileUrl || oldIdToUrl[String(item.modelID)];
        const newID = urlToNewId[url];

        if (newID !== undefined) {
          const rawIds = item.expressId ? item.expressId : [item.expressID];
          const ids = Array.isArray(rawIds) ? rawIds : [rawIds];

          ids.forEach(id => {
            if (id) {
              itemsToHighlight.push({
                modelID: newID,
                expressID: Number(id),
                fileUrl: url
              });
            }
          });
        }
      });
    }

    if (itemsToHighlight.length > 0) {
      // Highlight items
      loaderRef.current.highlightItems(itemsToHighlight);

      // Update UI Navbar
      setSelectedItems(itemsToHighlight);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar(itemsToHighlight);
    } else {
      loaderRef.current.removeHighlight();
      setSelectedItems([]);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar([]);
    }
  };

  useEffect(() => {
    if (onRegisterCapture) {
      onRegisterCapture({
        capture: captureCurrentState,
        restore: restoreState
      });
    }
  }, [onRegisterCapture, selectedItems]);


  // Helper
  const getContext = () => {
    const context = [];
    if (modelUrlMap.current) {
      Object.keys(modelUrlMap.current).forEach(id => {
        context.push({
          fileUrl: modelUrlMap.current[id],
          modelId: String(id),
          expressId: []
        });
      });
    }
    return context;
  };

  useEffect(() => {
    if (onRegisterCapture) {
      onRegisterCapture({
        // capture: () => loaderRef.current?.getSnapshot(),
        capture: getSnapshot,
        restore: restoreState,
        getContext: getContext
        // --------------------
      });
    }

    return () => {
      if (loaderRef.current) {
        console.log("Unmounting Viewer - Disposing Manager");
        loaderRef.current.dispose();
      }
    };
  }, []);

  const getSnapshot = () => {
    if (!loaderRef.current || !sceneRef.current) return null;

    const camera = sceneRef.current.getCameraState();

    const rawVisibility = loaderRef.current.getVisibilityState();

    // Map ModelID -> FileUrl
    const safeVisibility = rawVisibility.map(item => {
      const url = modelUrlMap.current[item.modelID];
      if (url) {
        return {
          fileUrl: url,
          ids: item.ids
        };
      }
      return null;
    }).filter(item => item !== null);

    const rawSelection = selectedItems;
    const safeSelection = rawSelection.map(item => ({
      fileUrl: item.fileUrl || modelUrlMap.current[item.modelID],
      expressID: item.expressID,
      modelID: ""
    }));

    const thumbnail = sceneRef.current.getScreenshot();

    return {
      camera,
      visibility: safeVisibility,
      selection: safeSelection,
      thumbnail,
      modelOpacity: modelOpacity
    };
  };

  const handleShowProperties = async () => {
    if (selectedItems.length === 0) {
      setIsPropertiesOpen(false);
      return;
    }

    setIsPropertiesOpen(true);
    setIsLoadingProps(true);
    setPropertiesData(null);

    try {
      const data = await loaderRef.current.getSelectionProperties(selectedItems);
      setPropertiesData(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoadingProps(false);
    }
  };

  // Auto-update properties
  useEffect(() => {
    if (isPropertiesOpen) {
      handleShowProperties();
    }
  }, [selectedItems]);

// TÍNH TOÁN BOUND CỦA FACE DỰA TRÊN MẶT PHẲNG VÀ NORMAL
  function computeFacePolygonBounds(mesh, hitFaceIndex, hitNormal) {
  const geom = mesh.geometry;
  const pos = geom.attributes.position;
  const index = geom.index;

  const thresholdNormal = 0.01;
  const thresholdPlane = 0.002;

  const faceNormal = hitNormal.clone().normalize();
  const facePoint = new THREE.Vector3()
    .fromBufferAttribute(pos, index.getX(hitFaceIndex * 3));

  const vertices = [];

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);

    const vA = new THREE.Vector3().fromBufferAttribute(pos, a);
    const vB = new THREE.Vector3().fromBufferAttribute(pos, b);
    const vC = new THREE.Vector3().fromBufferAttribute(pos, c);

    // Normal triangle
    const triNormal = new THREE.Vector3()
      .crossVectors(
        vB.clone().sub(vA),
        vC.clone().sub(vA)
      )
      .normalize();

    if (triNormal.dot(faceNormal) < 1 - thresholdNormal) continue;

    // Check plane distance
    if (
      Math.abs(faceNormal.dot(vA.clone().sub(facePoint))) > thresholdPlane
    ) continue;

    vertices.push(vA, vB, vC);
  }

  // World transform
  vertices.forEach(v => v.applyMatrix4(mesh.matrixWorld));

  return new THREE.Box3().setFromPoints(vertices);
}
  // ZOOM TO SECTION (UC119)
  const handleZoomToSection = async () => {
    if (selectedItems.length === 0) return;

    const item = selectedItems[0];

    // CASE 1: Zoom vào Face cụ thể 
      if (item.faceData) {
        const { faceIndex, mesh, normal } = item.faceData;

        const camera = sceneRef.current.camera;
        const controls = sceneRef.current.controls;

        // 1. Compute REAL face bounds
        const faceBBox = computeFacePolygonBounds(
          mesh,
          faceIndex,
          normal
        );

        const center = faceBBox.getCenter(new THREE.Vector3());
        const size = faceBBox.getSize(new THREE.Vector3());

        // 2. View direction hiện tại
        const viewDir = new THREE.Vector3()
          .subVectors(camera.position, controls.target)
          .normalize();

        // 3. Fit theo FOV
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * Math.PI / 180;
        const distance = (maxDim / 2) / Math.tan(fov / 2);

        const finalDistance = distance * 1.15;

        const newCameraPosition = center.clone().add(
          viewDir.clone().multiplyScalar(finalDistance)
        );

        animateCamera(
          camera.position.clone(),
          newCameraPosition,
          controls.target.clone(),
          center
        );

        return;
      }

    // CASE 2: Zoom vào toàn bộ vật thể 
    const modelID = item.modelID;
    const expressID = item.expressID;

    const subset = loaderRef.current.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: [expressID],
      applyBVH: true,
      removePrevious: false,
      customID: "zoom-subset"
    });
    
    sceneRef.current.scene.add(subset);
    const bbox = new THREE.Box3().setFromObject(subset);

    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    sceneRef.current.controls.target.copy(center);

    const fov = sceneRef.current.camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8; // factor to avoid clipping

    const currentDirection = new THREE.Vector3().subVectors(sceneRef.current.camera.position, center).normalize();
    const cameraPosition = center.clone().add(currentDirection.multiplyScalar(cameraDistance));

    animateCamera(sceneRef.current.camera.position.clone(), cameraPosition, sceneRef.current.controls.target.clone(), center);

    sceneRef.current.scene.remove(subset);
    subset.geometry.dispose();
};

  const animateCamera = (startPosition, endPosition, startTarget, endTarget) => {
    const duration = 1000; // 1 giây
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease in out
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate position
      sceneRef.current.camera.position.lerpVectors(startPosition, endPosition, easeProgress);

      // Interpolate target
      sceneRef.current.controls.target.lerpVectors(startTarget, endTarget, easeProgress);

      sceneRef.current.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };


  // --- EFFECT: UPDATE OPACITY ---
  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.setModelOpacity(modelOpacity);
    }
  }, [modelOpacity])


  const Loading = () => {
    if (isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0 bg-white/80 z-50 flex-col gap-4">
          <div className="text-gray-500">Loading IFC models...</div>
          <div className="w-32">
            <LoadingBar loading={isLoading} />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Loading />
      <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR CONTAINER */}
        {!isDataTable && (
          <div className="flex flex-col bg-slate-700">
            {/* LEFT SIDEBAR */}
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              style={{
                width: isDataTable ? 0 : sidebarWidth,
                height: '100%',
                overflow: state === 'todos' ? 'hidden' : 'auto',
                background: '#FFFFFF',
                color: '#6F6F6F',
                padding: '5px',
                zIndex: 10,
                position: 'relative',
                left: 0,
                top: 0,
                bottom: 0,
                borderRight: '1px solid #e5e7eb',
                transition: 'width 0.25s ease',
                display: isDataTable ? 'none' : (state === 'todos' ? 'flex' : 'block'),
                flexDirection: state === 'todos' ? 'column' : undefined,
              }}
            >
              {/* Model */}
              {state == 'models' &&
                <div className="flex flex-col items-center justify-between mb-3">
                  <div className="p-4 w-full border-b border-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Models</h2>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSortBy("name")}
                            >
                              Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortBy("date-created")}
                            >
                              Date created {sortBy === "date-created" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setShowSearch(!showSearch)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {showSearch && (
                      <div className="mb-3">
                        <Input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-sm" />
                      </div>
                    )}
                    <div className="w-fit">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">{statusFilter || "All Models"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuItem onClick={() => setStatusFilter("Selected model")}>Selected model</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>All Models</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>


                  {
                    models.map((m, idx) => {
                      const isActive = selectedModelIndex === idx && selectedTreePaths.length === 0;

                      return (
                        <div
                          key={idx}
                          className={isActive ? 'tree-active' : ''}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = '#f2f2f2';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'transparent';
                          }}
                          onClick={() => {
                            setSelectedModelIndex(idx);
                            setSelectedTreePaths([]);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: '4px',
                            marginTop: '12px',
                            cursor: 'pointer',
                            position: 'relative',
                            width: '100%',
                            borderRadius: '4px',
                            width: `${sidebarWidth}px`,
                          }}
                        >
                          <div
                            className="flex"
                            style={{
                              background: isActive ? '#dbeafe' : 'transparent',
                              padding: '4px 8px',
                            }}
                          >
                            <span
                              style={{
                                cursor: 'pointer',
                                marginRight: '10px',
                                display: 'flex',
                                gap: '4px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!m.visible) {
                                  return;
                                }
                                setOpenModel((prev) => ({ ...prev, [idx]: !prev[idx] }));
                              }}
                            >
                              {openModel[idx] ? <ChevronDown /> : <ChevronRight />}
                            </span>
                            <span
                              style={{
                                cursor: 'pointer',
                                marginRight: '10px',
                                display: 'flex',
                                gap: '4px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItems((prev) => {
                                  const filtered = prev.filter((item) => item.modelID !== m.id);
                                  return filtered;
                                });
                                loaderRef.current.toggleModelVisibility(m.id);
                                setModels((prev) =>
                                  prev.map((model) =>
                                    model.id === m.id ? { ...model, visible: !model.visible } : model,
                                  ),
                                );

                                setHiddenItems((prev) => {
                                  const updated = { ...prev };
                                  Object.keys(updated).forEach((key) => {
                                    if (key.startsWith(`${m.id}-`)) {
                                      delete updated[key];
                                    }
                                  });
                                  return updated;
                                });
                                setOpenModel((prev) => ({ ...prev, [idx]: false }));
                              }}
                            >
                              {m.visible ? <Eye /> : <EyeOff />}
                            </span>

                            <span
                              style={{
                                cursor: 'pointer',
                                fontWeight: isActive ? 'bold' : 'normal',
                                color: isActive ? '#2D566C' : '#444',
                                lineClamp: 1,
                                display: 'block',
                                wordBreak: 'break-word',
                              }}
                            >
                              {m.name}
                            </span>
                          </div>
                          <div className="">
                            {!isCollapsed && openModel[idx] && (
                              <TreeNode
                                idx={0}
                                modelId={m.ifcModelID}
                                node={m.tree}
                                onSelect={loaderRef}
                                selectedTreePaths={selectedTreePaths}
                                setSelectedTreePaths={setSelectedTreePaths}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              }

              {/* Layers */}
              {state == 'layers' &&
                <div className="">
                  <div className="p-4 w-full border-b border-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Layers</h2>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSortBy("name")}
                            >
                              Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortBy("model")}
                            >
                              Model {sortBy === "model" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setShowSearch(!showSearch)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {showSearch && (
                      <div className="mb-3">
                        <Input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-sm" />
                      </div>
                    )}
                    <div className="w-fit">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">{statusFilter || "All Layers"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>All Layers</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("Isolated layer")}>Isolated layer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {
                    models.map((m, idx) => {
                      return m.layers.map((layer, idx) => {
                        const isActive = selectedLayer[0] == layer.typeId;
                        const key = layerKey(m.id, layer.typeId);
                        const visible = isLayerVisible(m.id, layer.typeId);
                        const modelHidden = m.visible === false;

                        const allLayerKeys = m.layers.map((l) => layerKey(m.id, l.typeId));

                        const isIsolated =
                          hiddenLayers.size > 0 &&
                          allLayerKeys.every((k) => k === key || hiddenLayers.has(k));

                        return (
                          <div
                            className="flex justify-between items-center my-2 cursor-pointers"
                            key={idx}
                            style={{
                              background: isActive ? '#dbeafe' : 'transparent',
                              padding: '4px 8px',
                            }}
                            onClick={() => {
                              if (modelHidden) return;
                              setSelectedLayer([layer.typeId]);
                            }}
                          >
                            <div
                              className="flex"
                              style={{
                                opacity: modelHidden ? 0.4 : 1,
                              }}
                            >
                              <span
                                style={{
                                  cursor: 'pointer',
                                  marginRight: '10px',
                                  display: 'flex',
                                  gap: '4px',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (modelHidden) return;

                                  onToggleLayer(m.id, layer.typeId);

                                  setHiddenLayers((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(key)) next.delete(key);
                                    else next.add(key);
                                    return next;
                                  });
                                }}
                              >
                                {modelHidden ? <EyeOff /> : visible ? <Eye /> : <EyeOff />}{' '}
                              </span>

                              <span
                                style={{
                                  cursor: 'pointer',
                                  fontWeight: isActive ? 'bold' : 'normal',
                                  color: isActive ? '#2D566C' : '#444',
                                  lineClamp: 1,
                                  display: 'block',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {layer.label}
                              </span>
                            </div>

                            <span
                              style={{
                                cursor: 'pointer',
                                opacity: modelHidden ? 0.4 : 1,
                                position: 'relative',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (modelHidden) return;

                                setOpenMenuKey(openMenuKey === key ? null : key);
                              }}
                            >
                              <EllipsisVertical size={16} />

                              {openMenuKey === key && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: 0,
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    minWidth: '140px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Isolate layer */}
                                  <div
                                    className="px-3 py-2 hover:bg-gray-100 text-sm"
                                    onClick={() => {
                                      if (isIsolated) {
                                        loaderRef.current.unIsolateModel(m.id);

                                        setHiddenLayers(new Set());
                                      } else {
                                        loaderRef.current.isolateTypeVisibility(m.id, layer.typeId);

                                        setHiddenLayers(
                                          new Set(
                                            m.layers
                                              .map((l) => layerKey(m.id, l.typeId))
                                              .filter((k) => k !== key),
                                          ),
                                        );
                                      }

                                      setOpenMenuKey(null);
                                    }}
                                  >
                                    {isIsolated ? 'Unisolate layer' : 'Isolate layer'}
                                  </div>

                                  {/* Select layer */}
                                  <div
                                    className="px-3 py-2 hover:bg-gray-100 text-sm"
                                    onClick={() => {
                                      // TODO: Select all item in the layer and highlight them in the viewer
                                      setSelectedLayer([layer.typeId]);
                                      setOpenMenuKey(null);
                                    }}
                                  >
                                    Select layer
                                  </div>
                                </div>
                              )}
                            </span>
                          </div>
                        );
                      });
                    })
                  }
                </div>
              }

              {/* Todos */}
              {state == 'todos' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <TodoList
                    projectId={projectId}
                    onRestoreView={restoreState}
                    onSelectTodo={onSelectTodo}
                    onOpenDrawer={onOpenTodoDrawer}
                  />
                </div>
              )}

              {/* Views */}
              {state == 'views' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <ViewList
                    projectId={projectId}
                    ifcUrls={ifcUrls}

                    // OPTION EXTEND
                    // currentUserId={currentUser?._id}
                    // currentUserEmail={currentUser?.email}
                    onOpenDrawer={onOpenViewDrawer}
                    onRestoreView={onRestoreView}
                    onUpdateSnapshot={onUpdateSnapshot}
                  />
                </div>
              )}

              {/* Organizer */}
              {state == 'organizer' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <Organizer />
                </div>
              )}

              {/* Data table */}
              {state == 'data-table' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <DataTable />
                </div>
              )}

              {/* Topics */}
              {state == 'topics' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <Topics />
                </div>
              )}

              {/* Clash sets */}
              {state == 'clash-sets' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <ClashSets />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3D CANVAS */}
        <div
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />

          {/* Area selection rectangle overlay */}
          {selectionRect && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.w,
                height: selectionRect.h,
                border: '2px solid #2563eb',
                background: 'rgba(37, 99, 235, 0.12)',
                borderRadius: 6,
              }}
            />
          )}

          {/* Selected Item Information */}
          {selectedItems.length > 0 && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 
               bg-slate-800/90 backdrop-blur
               text-white rounded-xl shadow-lg
               px-4 py-2 flex items-center gap-4
               z-20"
            >
              {/* Count */}
              <div className="text-sm">
                <span className="font-semibold">{selectedItems.length}</span> selected
              </div>

              <div className="w-px h-5 bg-white/20" />

              {/* Info */}
              <button
                className="hover:text-blue-400 transition"
                title="View properties"
                onClick={() => {
                  // Toggle Drawer
                  if (isPropertiesOpen) setIsPropertiesOpen(false);
                  else handleShowProperties();
                }}
              >
                <Info />
              </button>

              {/* attachments */}
              <button
                className="hover:text-blue-400 transition"
                title="Attachments"
              >
                <Paperclip />
              </button> 

              {/* Zoom to section */}
              <button
                className="hover:text-blue-400 transition"
                title="Zoom to section"
                onClick={handleZoomToSection}
              >
                <Shrink />
              </button>

              {/* Clip box */}
              <button
                className="hover:text-blue-400 transition"
                title="Clip box"
              >
                <SquareScissors />
              </button>
              
              {/*Show selected object*/}
              <button
                className="hover:text-blue-400 transition"
                title="Show only selected object"
              >
                <SquaresSubtract />
              </button>

              {/* Visibility */}
              {selectedItems.length > 0 && (
                <button
                  className="hover:text-blue-400 transition"
                  title="Toggle visibility"
                  onClick={() => {
                    const item = selectedItems[0];
                    const key = `${item.modelID}-${item.expressID}`;
                    setHiddenItems((prev) => {
                      const updated = { ...prev };
                      if (updated[key]) {
                        delete updated[key];
                      } else {
                        updated[key] = true;
                      }
                      return updated;
                    });
                    loaderRef.current.toggleItemVisibility(item.modelID, item.expressID);
                  }}
                >
                  {hiddenItems[`${selectedItems[0]?.modelID}-${selectedItems[0]?.expressID}`] ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}
                </button>
              )}

              <div className="w-px h-5 bg-white/20" />

              <div className="text-sm">
                <span className="font-semibold"></span> Change visibility <ChevronDown />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- BOTTOM DRAWER: DATA TABLE --- */}

      {isDataTable && (
        <div
          className="absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 duration-300"
          style={{
            height: '400px',
          }}
        >
          <DataTable ifcManager={loaderRef.current} />
        </div>
      )}

      {/* RENDER PROPERTIES DRAWER */}
      <PropertiesDrawer
        open={isPropertiesOpen}
        onOpenChange={setIsPropertiesOpen}
        data={propertiesData}
        loading={isLoadingProps}
      />
    </div>
  );
}
