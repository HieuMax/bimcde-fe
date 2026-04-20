'use client';

import { useState, useEffect, useRef } from 'react';
import { ThreeScene } from '@/app/libs/ifc/scene';
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
  Settings2,
  Footprints,
  Move,
  Plus
} from 'lucide-react';
import './ifc.css';
import LoadingBar from '../LoadingBar';

import { ViewList } from '@/components/views/ViewList';
import { DataTable } from '@/components/_3d/data_table/DataTable';
import { Topics } from '@/components/_3d/topics/Topics';
import { ClashSets } from '@/components/_3d/clash_sets/ClashSets';
import { PropertiesDrawer } from './PropertiesDrawer';
import { ModelPositionDrawer } from './ModelPositionDrawer';
// import { AttachFileDialog } from './AttachFileDialog';
import { useAuth } from "@/app/context/authContext";
import { toast } from "sonner";
import { AttachFileDialog } from '@/components/todos/AttachFileDialog';

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
  autoOpenTopicId,
  onAutoOpenTopicHandled,
  onOpenTopicContext,
  modelOpacity,
  onOpacityChange,
  onOpenNewClashDrawer,
  clashResults,
  autoExpandedClashSetId,
  onRestoreClashSet,
  cameraMode,
  selectionMode,
  activeTool,
  onToolChange,
  onAddTodoForTopic,
  onLoadAdditionalModels
}) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);
  const threeSceneRef = useRef(null);
  const requestRef = useRef();
  const selectedItemsRef = useRef([]);
  const selectionModeRef = useRef(selectionMode)
  const modelUrlMap = useRef({})

  const processedUrlsRef = useRef([]);

  const normalizeIfcUrl = (url) => {
    if (!url) return "";

    try {
      const decoded = decodeURIComponent(String(url)).trim().toLowerCase();
      return decoded.split("#")[0].split("?")[0];
    } catch {
      return String(url).trim().toLowerCase().split("#")[0].split("?")[0];
    }
  };

  const extractIfcFileKey = (url) => {
    const normalizedUrl = normalizeIfcUrl(url);
    if (!normalizedUrl) return "";

    const baseName = normalizedUrl.split("/").pop() || normalizedUrl;
    return baseName.replace(/^\d+_[0-9a-f-]+_/i, "");
  };

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
  // const [statusFilter, setStatusFilter] = useState(undefined)
  const [searchQuery, setSearchQuery] = useState("")

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState(null);
  const [isLoadingProps, setIsLoadingProps] = useState(false);

  const EXPANDED_WIDTH = 370;
  const COLLAPSED_WIDTH = 250;

  const { user } = useAuth(); // Lấy thông tin user cho AttachFileDialog
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);

  // Hàm xử lý khi người dùng chọn xong file từ Dialog
  const handleLoadAdditionalModels = async (files) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const currentModels = [...models];
    const failedFiles = [];
    const successfullyLoadedUrls = []; // <--- Dùng mảng này để gom các URL tải thành công

    for (const file of files) {
      try {
        const url = file.url;
        console.log(`[Viewer] Dynamically loading model: ${url}`);

        // Load file IFC vào scene
        const model = await loaderRef.current.loadIfcUrl(url);
        const modelID = model.modelID;
        modelUrlMap.current[modelID] = url;

        // Lấy cấu trúc cây và layer
        const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);

        // Tạo ID mảng mới an toàn (tránh trùng lặp)
        const nextId = currentModels.length > 0 ? Math.max(...currentModels.map(m => m.id)) + 1 : 0;

        currentModels.push({
          id: nextId,
          ifcModelID: modelID,
          name: file.name || url.split('/').pop(),
          tree,
          layers,
          mesh: model.mesh,
          visible: true,
        });

        successfullyLoadedUrls.push(url); // Ghi nhận tải thành công

        if (!processedUrlsRef.current.includes(url)) {
          processedUrlsRef.current.push(url);
        }
        toast.success(`Successfully load model: ${file.name}`);
      } catch (err) {
        console.error(`Failed to load model ${file.name}:`, err);
        failedFiles.push(file.name);
      }
    }

    if (failedFiles.length > 0) {
      toast.error(`Failed to load: ${failedFiles.join(', ')}`);
    }

    // Báo cho file cha cập nhật `ifcUrls`
    if (successfullyLoadedUrls.length > 0 && onLoadAdditionalModels) {
      onLoadAdditionalModels(successfullyLoadedUrls);
    }

    // Cập nhật lại danh sách Models để Sidebar hiển thị
    setModels(currentModels);
    setIsLoading(false);
  };

  // const [isCollapsed, setIsCollapsed] = useState(false);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Model list
  const [models, setModels] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  // DATA TABLE
  const isDataTable = state === 'data-table';


  // --- STATE POSITION DRAWER ---
  const [isPosDrawerOpen, setIsPosDrawerOpen] = useState(false);
  const [posDrawerModel, setPosDrawerModel] = useState(null);
  const [posDrawerData, setPosDrawerData] = useState(null);

  const [markerCallback, setMarkerCallback] = useState(null);
  const markerCallbackRef = useRef(null);
  const markerMeshRef = useRef(null);

  // --- HÀM VẼ CHẤM ĐỎ MARKER ---
  const updateMarkerMesh = async (point) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current.scene;

    if (markerMeshRef.current) {
      scene.remove(markerMeshRef.current);
      if (markerMeshRef.current.material && markerMeshRef.current.material.map) {
        markerMeshRef.current.material.map.dispose();
      }
      if (markerMeshRef.current.material) {
        markerMeshRef.current.material.dispose();
      }
      markerMeshRef.current = null;
    }

    if (point) {
      const THREE = await import('three');

      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      // Tính toán tâm và bán kính
      const center = canvasSize / 2;
      const outerRadius = (canvasSize / 2) * 0.9;
      const innerRadius = (canvasSize / 2) * 0.6;

      ctx.beginPath();
      ctx.arc(center, center, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff0000';
      ctx.fill();

      const markerTexture = new THREE.CanvasTexture(canvas);

      const material = new THREE.SpriteMaterial({
        map: markerTexture,
        depthTest: false,
        transparent: true,
        opacity: 0.9
      });

      const sprite = new THREE.Sprite(material);

      sprite.scale.set(0.8, 0.8, 1.0);

      // Đặt vị trí
      sprite.position.set(point.x, point.y, point.z);

      sprite.renderOrder = 999;

      scene.add(sprite);
      markerMeshRef.current = sprite;
    }
  };

  // --- HANDLER ---
  const handleOpenPositionSettings = (model) => {
    if (!loaderRef.current) return;

    const transform = loaderRef.current.getModelTransform(model.ifcModelID);

    setPosDrawerModel({ id: model.ifcModelID, name: model.name });
    setPosDrawerData(transform);
    setOpenMenuKey(null);
    setIsPosDrawerOpen(true);
  };

  const handleSavePosition = (modelId, data) => {
    if (loaderRef.current) {
      loaderRef.current.setModelTransform(modelId, data);
    }
  };

  const animateClipping = () => {
    if (loaderRef.current) {
      loaderRef.current.updateClippingPlanes();
    }
    requestRef.current = requestAnimationFrame(animateClipping);
  };

  useEffect(() => {
    // Start loop
    requestRef.current = requestAnimationFrame(animateClipping);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);


  useEffect(() => {
    if (!loaderRef.current || !sceneRef.current) return;
    const renderer = sceneRef.current.getRenderer();
    const camera = sceneRef.current.getCamera();
    const controls = sceneRef.current.controls;

    if (activeTool === 'clipping') {
      loaderRef.current.toggleClipping(true, camera, renderer);
      renderer.clippingPlanes = loaderRef.current.clippingPlanes;

      if (loaderRef.current.transformControls) {
        loaderRef.current.transformControls.addEventListener('dragging-changed', (event) => {
          controls.enabled = !event.value;
        });
      }
    } else {
      loaderRef.current.toggleClipping(false, camera, renderer);
      controls.enabled = true;
    }
  }, [activeTool]);


  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    selectedItemsRef.current = selectedItems;
  }, [selectedItems]);

  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  useEffect(() => {
    if (threeSceneRef.current && cameraMode) {
      threeSceneRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  useEffect(() => {
    if (!ifcUrls?.length || !canvasRef.current) return;

    const isSame =
      ifcUrls.length === processedUrlsRef.current.length &&
      ifcUrls.every(u => processedUrlsRef.current.includes(u));

    // Nếu danh sách ifcUrls truyền vào trùng khớp với những gì đã load -> BỎ QUA
    if (isSame) {
      return;
    }

    processedUrlsRef.current = [...ifcUrls];

    // Create AbortController for this load cycle
    const abortController = new AbortController();
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      const canvas = canvasRef.current;

      if (!loaderRef.current) {
        const scene = new ThreeScene(canvasRef.current);
        sceneRef.current = scene;
        threeSceneRef.current = scene;
        loaderRef.current = new IfcManager(scene.scene, []);

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

        /** ONLY PICK IF NOT DRAGGING */
        canvas.addEventListener('mouseup', (event) => {
          if (!isDragging.current) {
            const isClippingMode = activeToolRef.current === 'clipping';

            const camera = scene.getCamera();
            const renderer = scene.getRenderer();

            if (isClippingMode) {
              if (loaderRef.current) {
                loaderRef.current.handleClippingClick(event, camera, renderer);
                renderer.clippingPlanes = loaderRef.current.clippingPlanes;
              }
              return;
            }

            if (loaderRef.current) {
              const clickedPlane = loaderRef.current.pickClipPlane(event, camera, renderer);

              if (clickedPlane) {
                console.log("Click trúng Icon -> Edit Plane");

                loaderRef.current.editPlane(clickedPlane);

                if (onToolChange) {
                  onToolChange('clipping');
                }

                return;
              }
            }

            if (markerCallbackRef.current) {
              const hitResult = loaderRef.current.pick(event, camera, renderer);

              const intersectPoint = hitResult?.point || hitResult?.intersect?.point;

              if (intersectPoint) {
                markerCallbackRef.current({
                  x: intersectPoint.x,
                  y: intersectPoint.y,
                  z: intersectPoint.z
                });
                updateMarkerMesh(intersectPoint);
              } else {
                // CẢNH BÁO: Nếu chạy vào đây nghĩa là ifc-manager đang bị thiếu point
                alert("Click thành công vật thể, nhưng file ifc-manager.js chưa trả về tọa độ (point). Vui lòng xem hướng dẫn để fix!");

                markerCallbackRef.current({ x: 0, y: 0, z: 0 });
              }

              markerCallbackRef.current = null;
              return;
            }

            const result = loaderRef.current.pick(event, scene.getCamera(), scene.getRenderer());
            const currentMode = selectionModeRef.current || 'single';

            const prevSelected = selectedItemsRef.current;
            let newSelection = [];

            if (result) {
              const sourceUrl = modelUrlMap.current[result.modelID]
              const enrichedItem = { ...result, fileUrl: sourceUrl }
              // if (setSelectdItemsForNavbar) {
              //   setSelectdItemsForNavbar([enrichedItem]);
              // }
              // setSelectedItems([result]);
              if (currentMode === 'single') {
                // Single: Thay thế hoàn toàn
                newSelection = [enrichedItem];
              } else {
                // Multiple: Toggle
                const exists = prevSelected.find(
                  item => item.modelID === result.modelID && item.expressID === result.expressID
                );

                if (exists) {
                  // Remove
                  newSelection = prevSelected.filter(item => item !== exists);
                } else {
                  // Add
                  newSelection = [...prevSelected, enrichedItem];
                }
              }
              loaderRef.current.highlightItems(newSelection)
            } else {
              // setSelectedItems([]);
              // if (setSelectdItemsForNavbar) {
              //   setSelectdItemsForNavbar([]);
              // }
              newSelection = [];
              loaderRef.current.removeHighlight();
            }


            // Update Local State
            setSelectedItems(newSelection);

            if (setSelectdItemsForNavbar) {
              setSelectdItemsForNavbar(newSelection);
            }
          }
        });


        if (onRegisterCapture) {
          onRegisterCapture({
            capture: getSnapshot,
            restore: restoreState,
            getContext: getContext,
            runClashTest: runClashTest,
            setCameraMode: (mode) => {
              if (threeSceneRef.current) {
                threeSceneRef.current.setCameraMode(mode);
              }
            },
            setView: (viewType) => {
              if (threeSceneRef.current) threeSceneRef.current.setView(viewType);
            },
            saveClipping: () => {
              if (loaderRef.current) {
                loaderRef.current.saveCurrentClipping();
                if (sceneRef.current) {
                  sceneRef.current.getRenderer().clippingPlanes = loaderRef.current.clippingPlanes;
                }
              }
            },
            cancelClipping: () => {
              if (loaderRef.current) {
                loaderRef.current.cancelCurrentClipping();
                if (sceneRef.current) {
                  sceneRef.current.getRenderer().clippingPlanes = loaderRef.current.clippingPlanes;
                }
              }
            }
          });
        }
      }

      //
      // LOADING MODELS WITH ABORT SUPPORT
      //
      if (ifcUrls?.length) {
        loaderRef.current.clearModels();

        modelUrlMap.current = {};
        setLoadError(null); // Clear previous errors

        const newModels = [];
        const failedUrls = [];

        for (let i = 0; i < ifcUrls.length; i++) {
          // Check if this load cycle was aborted
          if (abortController.signal.aborted) {
            console.log(`[Viewer] Load cycle aborted, stopping model load at ${i + 1}/${ifcUrls.length}`);
            break;
          }

          const url = ifcUrls[i];
          console.log(`[Viewer] Loading model ${i + 1}/${ifcUrls.length}: ${url}`);

          try {
            const model = await loaderRef.current.loadIfcUrl(url);

            // Check again after async operation
            if (abortController.signal.aborted) {
              console.log(`[Viewer] Aborting after model ${i + 1} loaded (context switched)`);
              break;
            }

            if (!isMounted) {
              console.log(`[Viewer] Component unmounted, skipping model ${i + 1}`);
              break;
            }

            const modelID = model.modelID;
            modelUrlMap.current[modelID] = url;

            const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);

            if (abortController.signal.aborted || !isMounted) {
              console.log(`[Viewer] Aborting after spatial tree for model ${i + 1}`);
              break;
            }

            newModels.push({
              id: i,
              ifcModelID: modelID,
              name: url.split('/').pop(),
              tree,
              layers,
              mesh: model.mesh,
              visible: true,
            });
          } catch (err) {
            if (abortController.signal.aborted) {
              console.log(`[Viewer] Load cancelled for model ${url}`);
              break;
            }
            console.error(`Error loading model ${url}:`, err);
            failedUrls.push({ url, error: err.message || String(err) });
          }
        }

        if (isMounted && !abortController.signal.aborted) {
          // If no models loaded successfully, set error
          if (failedUrls.length > 0 && newModels.length === 0) {
            const errorMsg = `Failed to load all models. ${failedUrls.map(f => `${f.url}: ${f.error}`).join('; ')}`;
            console.error("[Viewer]", errorMsg);
            setLoadError(errorMsg);
          } else if (failedUrls.length > 0) {
            // Some failed but some succeeded - just warn
            const warnMsg = `${failedUrls.length} model(s) failed to load`;
            console.warn("[Viewer]", warnMsg, failedUrls);
          }

          setModels(newModels);
          if (onLoaded) onLoaded();
        }
      }

      setIsLoading(false);
    };

    load();

    // Cleanup: Abort pending loads if effect reruns or unmounts
    return () => {
      isMounted = false;
      abortController.abort();
      console.log("[Viewer] Effect cleanup: aborted pending model loads");
    };
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


  // === RESTORE STATE ===
  const restoreState = async (viewState, todoItems = []) => {
    if (!viewState || !sceneRef.current || !loaderRef.current) return;

    if (onOpacityChange) {
      const savedOpacity = viewState.modelOpacity !== undefined ? viewState.modelOpacity : 1;
      onOpacityChange(savedOpacity);
    }

    if (viewState.modelTransforms) {
      loaderRef.current.restoreAllModelsTransform(viewState.modelTransforms);
    }

    // ---------------------------------------------------------
    // 1. PREPARE MAPPING (URL <-> Model ID)
    // ---------------------------------------------------------

    const urlToNewId = {};
    Object.keys(modelUrlMap.current).forEach(id => {
      const url = modelUrlMap.current[id];
      const normalizedUrl = normalizeIfcUrl(url);
      if (normalizedUrl) {
        urlToNewId[normalizedUrl] = parseInt(id);
      }
    });

    const findMappedModelId = (url) => {
      const normalizedUrl = normalizeIfcUrl(url);
      const fileKey = extractIfcFileKey(url);
      if (!normalizedUrl) return undefined;

      if (urlToNewId[normalizedUrl] !== undefined) {
        return urlToNewId[normalizedUrl];
      }

      const matchedEntry = Object.entries(urlToNewId).find(
        ([savedUrl]) =>
          savedUrl.endsWith(normalizedUrl) ||
          normalizedUrl.endsWith(savedUrl) ||
          (fileKey && extractIfcFileKey(savedUrl) === fileKey),
      );

      return matchedEntry ? matchedEntry[1] : undefined;
    };

    const oldIdToUrl = {};

    // R1: Todo Items
    if (todoItems && Array.isArray(todoItems)) {
      todoItems.forEach(item => {
        const oldModelId = item.modelId ?? item.modelID;
        if (item.fileUrl && oldModelId !== undefined && oldModelId !== null) {
          oldIdToUrl[String(oldModelId)] = item.fileUrl;
        }
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

    if (viewState && viewState.camera) {
      sceneRef.current.setCameraState(viewState.camera);
    }

    if (viewState && viewState.marker) {
      updateMarkerMesh(viewState.marker);
    } else {
      updateMarkerMesh(null);
    }
    // ---------------------------------------------------------
    // 3. RESTORE VISIBILITY
    // ---------------------------------------------------------
    const mappedVisibility = [];
    const newHiddenItemsReactState = {};

    if (viewState && viewState.visibility && Array.isArray(viewState.visibility)) {
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

        const newID = findMappedModelId(url);

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
        const url =
          item.fileUrl ||
          oldIdToUrl[String(item.modelID ?? item.modelId)] ||
          (ifcUrls.length === 1 ? ifcUrls[0] : undefined);
        const newID = findMappedModelId(url);

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


    if (viewState.clippingPlanes) {
      loaderRef.current.restoreClippingState(viewState.clippingPlanes);
    } else {
      loaderRef.current.deleteAllPlanes();
    }

    if (itemsToHighlight.length > 0) {
      // Highlight items
      loaderRef.current.highlightItems(itemsToHighlight);

      if (viewState && viewState.clippingPlanes) {
        loaderRef.current.restoreClippingState(viewState.clippingPlanes);
      } else if (loaderRef.current) {
        loaderRef.current.deleteAllPlanes();
      }
      // Update UI Navbar
      setSelectedItems(itemsToHighlight);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar(itemsToHighlight);
    } else {
      loaderRef.current.removeHighlight();
      setSelectedItems([]);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar([]);
    }
  };


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
    if (loaderRef.current) {
      console.log("Unmounting Viewer - Disposing Manager");
      loaderRef.current.dispose();
    }
  }, [])


  // --- WRAPPER CLASH TEST ---
  const runClashTest = async (modelIDs, tolerance) => {
    if (!loaderRef.current) return 0;
    return await loaderRef.current.runClashTest(modelIDs, tolerance);
  };


  const handleSelectClashItem = (item1, item2) => {
    if (!loaderRef.current) return;

    const sourceUrl1 = modelUrlMap.current[item1.modelID];
    const sourceUrl2 = modelUrlMap.current[item2.modelID];

    const itemsToHighlight = [
      { modelID: item1.modelID, expressID: item1.expressID, fileUrl: sourceUrl1 },
      { modelID: item2.modelID, expressID: item2.expressID, fileUrl: sourceUrl2 }
    ];
    loaderRef.current.highlightItems(itemsToHighlight);

    setSelectedItems(itemsToHighlight);
    if (setSelectdItemsForNavbar) {
      setSelectdItemsForNavbar(itemsToHighlight);
    }
    // Zoom camera  (Optional)
    // loaderRef.current.zoomToItems(itemsToHighlight); 
  };

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
      modelID: item.modelID
    }));

    const thumbnail = sceneRef.current.getScreenshot();

    const modelTransforms = loaderRef.current.getAllModelsTransform();

    const clippingPlanes = loaderRef.current.getClippingState();
    return {
      camera,
      visibility: safeVisibility,
      selection: safeSelection,
      thumbnail,
      modelOpacity: modelOpacity,
      modelTransforms: modelTransforms,
      clippingPlanes: clippingPlanes
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





  // --- EFFECT: UPDATE OPACITY ---
  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.setModelOpacity(modelOpacity);
    }
  }, [modelOpacity])


  const Loading = () => {
    if (isLoading || loadError) {
      return (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0 bg-white/80 z-50 flex-col gap-4">
          {loadError ? (
            <div className="flex flex-col gap-2 items-center px-4 max-w-md">
              <div className="text-red-600 font-semibold">⚠️ Failed to Load Models</div>
              <div className="text-red-500 text-sm break-words">{loadError}</div>
              <div className="text-gray-600 text-xs mt-2">Please try refreshing or switching to a different file.</div>
            </div>
          ) : (
            <>
              <div className="text-gray-500">Loading IFC models...</div>
              <div className="w-32">
                <LoadingBar loading={isLoading} />
              </div>
            </>
          )}
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
                    <div className="flex items-center gap-2 mb-3">
                      {/* Dropdown All Models */}
                      {/* <div className="flex-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal border bg-white">
                              {statusFilter || "All Models"}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuItem onClick={() => setStatusFilter("Selected model")}>Selected model</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>All Models</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div> */}

                      {/* Nút Load Model mới */}
                      <Button
                        variant="outline"
                        className="h-8 px-3 my-3 text-sm flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 shrink-0"
                        onClick={() => setIsAttachDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Load
                      </Button>
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

                            <span
                              style={{ cursor: 'pointer', marginLeft: 'auto', marginTop: "4px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuKey(openMenuKey === `model-${m.id}` ? null : `model-${m.id}`);
                              }}
                            >
                              <EllipsisVertical size={20} />

                              {openMenuKey === `model-${m.id}` && (
                                <div className="absolute bg-white border shadow-lg z-50 rounded-md py-1 right-2 w-40">
                                  <div
                                    className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer flex items-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPositionSettings(m);
                                    }}
                                  >
                                    <Settings2 size={14} /> Position Settings
                                  </div>
                                </div>
                              )}
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
                        {/* <DropdownMenuTrigger asChild><Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">{statusFilter || "All Layers"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger> */}
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
                                    next.has(key) ? next.delete(key) : next.add(key);
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
                  <Topics
                    projectId={projectId}
                    ifcUrls={ifcUrls}
                    autoOpenTopicId={autoOpenTopicId}
                    onAddTodoForTopic={onAddTodoForTopic}
                    capture3DState={
                      async () => {
                        const snapshot = getSnapshot();
                        const context =
                          snapshot?.selection && snapshot.selection.length > 0
                            ? snapshot.selection
                            : getContext();

                        let thumbnailBase64 = "";
                        if (canvasRef.current && sceneRef.current) {
                          const renderer = sceneRef.current.getRenderer();
                          const scene = sceneRef.current.scene;
                          const camera = sceneRef.current.getCamera();

                          renderer.render(scene, camera);
                          thumbnailBase64 = canvasRef.current.toDataURL("image/png", 0.5);
                        }
                        return {
                          viewState: snapshot,
                          items: context,
                          thumbnail: thumbnailBase64 || snapshot?.thumbnail
                        }
                      }
                    }
                    onRestoreView={restoreState}
                    onOpenTopicContext={onOpenTopicContext}
                    onAutoOpenTopicHandled={onAutoOpenTopicHandled}
                    onAddMarkerStart={(cb) => { markerCallbackRef.current = cb; }}
                    onAddMarkerCancel={() => { markerCallbackRef.current = null; }}
                  />
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
                  <ClashSets
                    onOpenNewClashDrawer={onOpenNewClashDrawer}
                    projectId={projectId}
                    onSelectClashItem={handleSelectClashItem}
                    clashResults={clashResults}
                    onRestoreClashSet={onRestoreClashSet}
                    autoExpandedSetId={autoExpandedClashSetId}
                  />
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

          {cameraMode === 'walk' && (
            <div className="absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-top-2 duration-500 pointer-events-none select-none">
              <div className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg border border-white/10 w-auto min-w-[200px]">

                {/* Header Compact */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-blue-400">
                  <Footprints className="h-4 w-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Fly Mode Controls</span>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-y-2 gap-x-4 text-[11px] items-center">

                  {/* Movement */}
                  <span className="text-slate-300 font-medium">Move</span>
                  <div className="flex gap-1 justify-end">
                    <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
                  </div>

                  {/* Elevation */}
                  <span className="text-slate-300 font-medium">Elevation</span>
                  <div className="flex gap-1 justify-end">
                    <Kbd>R</Kbd>
                    <span className="text-slate-500 self-center text-[10px]">/</span>
                    <Kbd>T</Kbd>
                  </div>

                  {/* Speed */}
                  <span className="text-slate-300 font-medium">Sprint</span>
                  <div className="flex gap-1 justify-end">
                    <Kbd>Shift</Kbd>
                  </div>

                  {/* Look */}
                  <span className="text-slate-300 font-medium">Look</span>
                  <div className="flex items-center justify-end gap-1 text-slate-300">
                    <Move className="h-3 w-3" /> Mouse
                  </div>
                </div>

              </div>
            </div>
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

              {/* Visibility */}
              {selectedItems.length > 0 && (
                <button
                  className="hover:text-blue-400 transition"
                  title="Toggle visibility"
                  onClick={() => {
                    const firstItem = selectedItems[0];
                    const firstKey = `${firstItem.modelID}-${firstItem.expressID}`;
                    const isFirstHidden = hiddenItems[firstKey];
                    const shouldHide = !isFirstHidden;

                    setHiddenItems((prev) => {
                      const updated = { ...prev };
                      selectedItems.forEach(item => {
                        const key = `${item.modelID}-${item.expressID}`;
                        if (shouldHide) {
                          updated[key] = true;
                        } else {
                          delete updated[key];
                        }
                      });
                      return updated;
                    });

                    selectedItems.forEach(item => {
                      const key = `${item.modelID}-${item.expressID}`;
                      const isItemCurrentlyHidden = hiddenItems[key];

                      if (shouldHide && !isItemCurrentlyHidden) {
                        loaderRef.current.toggleItemVisibility(item.modelID, item.expressID);
                      }
                      else if (!shouldHide && isItemCurrentlyHidden) {
                        loaderRef.current.toggleItemVisibility(item.modelID, item.expressID);
                      }
                    });

                    if (shouldHide) {
                      loaderRef.current.removeHighlight();
                    } else {
                      loaderRef.current.highlightItems(selectedItems);
                    }
                  }}
                >
                  {/* Icon */}
                  {hiddenItems[`${selectedItems[0]?.modelID}-${selectedItems[0]?.expressID}`] ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}
                </button>
              )}
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



      {/* RENDER MODEL POSITION DRAWER */}
      <ModelPositionDrawer
        open={isPosDrawerOpen}
        onOpenChange={setIsPosDrawerOpen}
        modelId={posDrawerModel?.id ?? null}
        modelName={posDrawerModel?.name ?? ""}
        initialData={posDrawerData}
        onSave={handleSavePosition}
      />

      {/* RENDER ATTACH MODEL DIALOG */}
      {isAttachDialogOpen && (
        <AttachFileDialog
          open={isAttachDialogOpen}
          onOpenChange={setIsAttachDialogOpen}
          projectId={projectId}
          userId={user?._id || ""}
          onAttach={handleLoadAdditionalModels}
          hideUpload={true}
        />
      )}
    </div>
  );
}


function Kbd({ children }) {
  return (
    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-slate-100 font-mono font-bold border-b border-white/10 min-w-[20px] text-center text-[10px] inline-block shadow-sm">
      {children}
    </kbd>
  );
}
