'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreeScene } from '@/app/libs/ifc/scene';
import * as THREE from "three";
import { IfcManager } from '@/app/libs/ifc/ifc-manager';
import { TreeNode } from './TreeNode';
import TodoList from '@/components/todos/TodoList';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Info,
  EllipsisVertical,
  Menu, Search, Check,
  Paperclip,
  SquareScissors,
  Shrink,
  SquaresSubtract,
  Settings2,
  Footprints,
  Move
} from 'lucide-react';
import './ifc.css';
import LoadingBar from '../LoadingBar';

import { ViewList } from '@/components/views/ViewList';
import { DataTable } from '@/components/_3d/data_table/DataTable';
import { Topics } from '@/components/_3d/topics/Topics';
import { ClashSets } from '@/components/_3d/clash_sets/ClashSets';
import { Organizer } from '@/components/_3d/organizer/Organizer';
import { PropertiesDrawer } from './PropertiesDrawer';
import { ModelPositionDrawer } from './ModelPositionDrawer';

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
  onOpenNewClashDrawer,
  clashResults,
  autoExpandedClashSetId,
  onRestoreClashSet,
  cameraMode,
  activeTool,
  // onToolChange,

  // --- USER PROPS ---
  selectionMode = 'single',
  
  // visibility control
  viewOptions = {
    annotations: true,
    clipPlanes: true,
    grids: false,
    ifcTypes: true,
    objectAttachments: true,
  },
}) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);
  const threeSceneRef = useRef(null);
  const requestRef = useRef();
  const selectedItemsRef = useRef([]);
  const selectionModeRef = useRef(selectionMode);
  const modelUrlMap = useRef({});

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [openModel, setOpenModel] = useState({});
  const [selectedTreePaths, setSelectedTreePaths] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState({});
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState([]);
  
  const [sortBy, setSortBy] = useState("date-modified");  
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [propertiesData, setPropertiesData] = useState(null);
  const [isLoadingProps, setIsLoadingProps] = useState(false);

  const EXPANDED_WIDTH = 370;
  const COLLAPSED_WIDTH = 250;

  //marker
  const topicMarkerGroupRef = useRef(new THREE.Group());
  const [markerCallback, setMarkerCallback] = useState(null);
  const markerCallbackRef = useRef(null);
  useEffect(() => {
    markerCallbackRef.current = markerCallback;
  }, [markerCallback]);

  const clearTopicMarker = useCallback(() => {
      const g = topicMarkerGroupRef.current;
      while (g.children.length > 0) g.remove(g.children[0]);
  }, []);

  const drawTopicMarker = useCallback((point) => {
      clearTopicMarker();
      if (!point) return;

      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.arc(64, 64, 55, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626'; 
      ctx.fill();

      ctx.lineWidth = 8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 64, 68);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
          map: texture,
          depthTest: false, 
          depthWrite: false,
          sizeAttenuation: true
      });

      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(point);
      sprite.scale.set(1.5, 1.5, 1);
      sprite.renderOrder = 10000;
      
      topicMarkerGroupRef.current.add(sprite);
  }, [clearTopicMarker]);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const [models, setModels] = useState([]);
  const modelsRef = useRef(models);
  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  const isDataTable = state === 'data-table';

  // MARKER ĐÁNH DẤU THỨ TỰ TỪNG CLIP
  const createSectionMarker = (point, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(64, 64, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index), 64, 68);

    const texture = new THREE.CanvasTexture(canvas);
    
    const mat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true
    });

    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(point);
    sprite.scale.set(1.5, 1.5, 1); 
    sprite.renderOrder = 10000; 
    sprite.userData.isClipHelper = true;

    return sprite;
  };

  // =====================================================
  // INIT GROUPS 
  // =====================================================
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current.scene;
    const topicMarkerGroup = topicMarkerGroupRef.current;

    scene.add(topicMarkerGroup);

    return () => {
      scene.remove(topicMarkerGroup);
      topicMarkerGroup.clear();
    };
  }, [models]);

  // =====================================================
  // STATE POSITION DRAWER
  // =====================================================
  const [isPosDrawerOpen, setIsPosDrawerOpen] = useState(false);
  const [posDrawerModel, setPosDrawerModel] = useState(null);
  const [posDrawerData, setPosDrawerData] = useState(null);

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
    if (threeSceneRef.current && cameraMode) {
      threeSceneRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  useEffect(() => {
    if (!ifcUrls?.length || !canvasRef.current) return;

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

        canvas.addEventListener('mousemove', (e) => {
          const dx = Math.abs(e.clientX - mouseDownPos.current.x);
          const dy = Math.abs(e.clientY - mouseDownPos.current.y);
          if (dx > 3 || dy > 3) {
            isDragging.current = true;
          }
        });

        // canvas.addEventListener('mousedown', onAreaMouseDown, true);
        // canvas.addEventListener('mousemove', onAreaMouseMove, true);
        // window.addEventListener('mouseup', onAreaMouseUp, true);

        canvas.addEventListener('mouseup', (event) => {
          // if (areaSelectEnabledRef.current) return;
          
          if (!isDragging.current) {
            // Check Marker
            if (markerCallbackRef.current) {
                const rect = canvas.getBoundingClientRect();
                const mouse = new THREE.Vector2(
                    ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    -((event.clientY - rect.top) / rect.height) * 2 + 1
                );
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, scene.getCamera());
                const meshes = modelsRef.current.map(m => m.mesh).filter(Boolean);
                const intersects = raycaster.intersectObjects(meshes, true);
                const validHit = intersects.find(h => !h.object.userData.isClipHelper);

                if (validHit) {
                    drawTopicMarker(validHit.point);
                    markerCallbackRef.current(validHit.point);
                    setMarkerCallback(null);
                }
                return;
            }

            // Check Dev's Active Tool
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
                loaderRef.current.editPlane(clickedPlane);
                if (onToolChange) {
                  onToolChange('clipping');
                }
                return;
              }
            }

            // Standard Pick
            const result = loaderRef.current.pick(event, scene.getCamera(), scene.getRenderer());
            const currentMode = selectionModeRef.current || 'single';

            const prevSelected = selectedItemsRef.current;
            let newSelection = [];

            if (result) {
              const sourceUrl = modelUrlMap.current[result.modelID];
              
              let faceData = null;
              const rect = canvas.getBoundingClientRect();
              const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
              const raycaster = new THREE.Raycaster();
              raycaster.setFromCamera(mouse, camera);
              const meshes = modelsRef.current.map(m => m.mesh).filter(Boolean);
              const intersects = raycaster.intersectObjects(meshes, true);
              const validHit = intersects.find(h => !h.object.userData.isClipHelper);

              if (validHit && validHit.face) {
                  const normal = validHit.face.normal.clone().applyQuaternion(validHit.object.quaternion).normalize();
                  faceData = {
                      normal: normal,
                      point: validHit.point.clone(),
                      faceIndex: validHit.faceIndex,
                      mesh: validHit.object,
                      distance: validHit.distance
                  };
              }

              const enrichedItem = { ...result, fileUrl: sourceUrl, faceData: faceData };

              if (currentMode === 'single') {
                newSelection = [enrichedItem];
              } else {
                const exists = prevSelected.find(
                  item => item.modelID === result.modelID && item.expressID === result.expressID
                );
                if (exists) {
                  newSelection = prevSelected.filter(item => item !== exists);
                } else {
                  newSelection = [...prevSelected, enrichedItem];
                }
              }
              // loaderRef.current.highlightItems(newSelection);
            } else {
              newSelection = [];
              loaderRef.current.removeHighlight();
            }

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

      if (ifcUrls?.length) {
        loaderRef.current.clearModels();
        modelUrlMap.current = {};

        const newModels = [];

        for (let i = 0; i < ifcUrls.length; i++) {
          const url = ifcUrls[i];
          console.log(`[Viewer] Loading model ${i + 1}/${ifcUrls.length}: ${url}`);

          try {
            const model = await loaderRef.current.loadIfcUrl(url);
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
          } catch (err) {
            console.error(`Error loading model ${url}:`, err);
          }
        }
        setModels(newModels);
        if (onLoaded) onLoaded();
      }

      setIsLoading(false);
    };

    load();
  }, [ifcUrls]);

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

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

  const restoreState = async (viewState, todoItems = []) => {
    if (!viewState || !sceneRef.current || !loaderRef.current) return;

    if (onOpacityChange) {
      const savedOpacity = viewState.modelOpacity !== undefined ? viewState.modelOpacity : 1;
      onOpacityChange(savedOpacity);
    }

    if (viewState.modelTransforms) {
      loaderRef.current.restoreAllModelsTransform(viewState.modelTransforms);
    }

    // 1. PREPARE MAPPING
    const urlToNewId = {};
    Object.keys(modelUrlMap.current).forEach(id => {
      const url = modelUrlMap.current[id];
      urlToNewId[url] = parseInt(id);
    });

    const oldIdToUrl = {};

    if (todoItems && Array.isArray(todoItems)) {
      todoItems.forEach(item => {
        if (item.fileUrl) oldIdToUrl[String(item.modelId)] = item.fileUrl;
      });
    }

    if (viewState.selection && Array.isArray(viewState.selection)) {
      viewState.selection.forEach(item => {
        if (item.fileUrl) oldIdToUrl[String(item.modelID)] = item.fileUrl;
      });
    }

    // 2. RESTORE CAMERA
    sceneRef.current.setCameraState(viewState.camera);

    // 3. RESTORE VISIBILITY
    const mappedVisibility = [];
    const newHiddenItemsReactState = {};

    if (viewState.visibility && Array.isArray(viewState.visibility)) {
      viewState.visibility.forEach(group => {
        let url = group.fileUrl;

        if (!url) {
          const oldID = String(group.modelID);
          url = oldIdToUrl[oldID];
        }

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

    // 4. RESTORE SELECTION & HIGHLIGHT
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
      loaderRef.current.highlightItems(itemsToHighlight);
      setSelectedItems(itemsToHighlight);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar(itemsToHighlight);
    } else {
      loaderRef.current.removeHighlight();
      setSelectedItems([]);
      if (setSelectdItemsForNavbar) setSelectdItemsForNavbar([]);
    }
  };

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
  }, []);

  const runClashTest = async (modelIDs, tolerance) => {
    if (!loaderRef.current) return 0;
    return await loaderRef.current.runClashTest(modelIDs, tolerance);
  };

  const handleSelectClashItem = (item1, item2) => {
    if (!loaderRef.current) return;
    const itemsToHighlight = [
      { modelID: item1.modelID, expressID: item1.expressID },
      { modelID: item2.modelID, expressID: item2.expressID }
    ];
    loaderRef.current.highlightItems(itemsToHighlight);
  };


  const getSnapshot = () => {
    if (!loaderRef.current || !sceneRef.current) return null;

    const rawCamera = sceneRef.current.getCameraState();
    const camera = rawCamera ? {
        position: Array.isArray(rawCamera.position)
          ? { x: rawCamera.position[0], y: rawCamera.position[1], z: rawCamera.position[2] }
          : { x: rawCamera.position?.x ?? 0, y: rawCamera.position?.y ?? 0, z: rawCamera.position?.z ?? 0 },
        target: Array.isArray(rawCamera.target)
          ? { x: rawCamera.target[0], y: rawCamera.target[1], z: rawCamera.target[2] }
          : { x: rawCamera.target?.x ?? 0, y: rawCamera.target?.y ?? 0, z: rawCamera.target?.z ?? 0 },
      } : null;

    const rawVisibility = loaderRef.current.getVisibilityState();

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

    // const rawSelection = selectedItems;
    const rawSelection = selectedItemsRef.current;
    const safeSelection = rawSelection.map(item => ({
      fileUrl: item.fileUrl || modelUrlMap.current[item.modelID],
      expressID: item.expressID,
      modelID: ""
    }));

    const thumbnail = sceneRef.current.getScreenshot();
    
    const modelTransforms = loaderRef.current.getAllModelsTransform();
    const clippingPlanes = loaderRef.current.getClippingState();

    return {
      camera,
      visibility: safeVisibility,
      selection: safeSelection,
      thumbnail,
      modelTransforms: modelTransforms,
      clippingPlanes: clippingPlanes, 
      
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

  useEffect(() => {
    if (isPropertiesOpen) {
      handleShowProperties();
    }
  }, [selectedItems]);

  function computeFacePolygonBounds(mesh, hitFaceIndex, hitNormal) {
    const geom = mesh.geometry;
    const pos = geom.attributes.position;
    const index = geom.index;

    const thresholdNormal = 0.01;
    const thresholdPlane = 0.002;

    const faceNormal = hitNormal.clone().normalize();
    const facePoint = new THREE.Vector3().fromBufferAttribute(pos, index.getX(hitFaceIndex * 3));
    const vertices = [];

    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      const vA = new THREE.Vector3().fromBufferAttribute(pos, a);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, b);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, c);

      const triNormal = new THREE.Vector3().crossVectors(vB.clone().sub(vA), vC.clone().sub(vA)).normalize();

      if (triNormal.dot(faceNormal) < 1 - thresholdNormal) continue;
      if (Math.abs(faceNormal.dot(vA.clone().sub(facePoint))) > thresholdPlane) continue;

      vertices.push(vA, vB, vC);
    }

    vertices.forEach(v => v.applyMatrix4(mesh.matrixWorld));
    return new THREE.Box3().setFromPoints(vertices);
  }

  const handleZoomToSection = async () => {
    if (selectedItems.length === 0) return;

    const item = selectedItems[0];

    if (item.faceData) {
      const { faceIndex, mesh, normal } = item.faceData;

      const camera = sceneRef.current.camera;
      const controls = sceneRef.current.controls;
      const faceBBox = computeFacePolygonBounds(mesh, faceIndex, normal);
      const center = faceBBox.getCenter(new THREE.Vector3());
      const size = faceBBox.getSize(new THREE.Vector3());

      const viewDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * Math.PI / 180;
      const distance = (maxDim / 2) / Math.tan(fov / 2);
      const finalDistance = distance * 1.15;
      const newCameraPosition = center.clone().add(viewDir.clone().multiplyScalar(finalDistance));

      animateCamera(camera.position.clone(), newCameraPosition, controls.target.clone(), center);
      return;
    }

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
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8; 

    const currentDirection = new THREE.Vector3().subVectors(sceneRef.current.camera.position, center).normalize();
    const cameraPosition = center.clone().add(currentDirection.multiplyScalar(cameraDistance));

    animateCamera(sceneRef.current.camera.position.clone(), cameraPosition, sceneRef.current.controls.target.clone(), center);

    sceneRef.current.scene.remove(subset);
    subset.geometry.dispose();
  };

  const animateCamera = (startPosition, endPosition, startTarget, endTarget) => {
    const duration = 1000; 
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      sceneRef.current.camera.position.lerpVectors(startPosition, endPosition, easeProgress);
      sceneRef.current.controls.target.lerpVectors(startTarget, endTarget, easeProgress);
      sceneRef.current.controls.update();

      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.setModelOpacity(modelOpacity);
    }
  }, [modelOpacity]);

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
        {!isDataTable && (
          <div className="flex flex-col bg-slate-700">
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
              {state == 'models' &&
                <div className="flex flex-col items-center justify-between mb-3">
                  <div className="p-4 w-full border-b border-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Models</h2>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem >Name </DropdownMenuItem>
                            <DropdownMenuItem >Date created </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}><Search className="h-4 w-4" /></Button>
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
                        <div key={idx} className={isActive ? 'tree-active' : ''}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f2f2f2'; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                          onClick={() => { setSelectedModelIndex(idx); setSelectedTreePaths([]); }}
                          style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px', marginTop: '12px', cursor: 'pointer', position: 'relative', width: '100%', borderRadius: '4px', width: `${sidebarWidth}px`, }}
                        >
                          <div className="flex" style={{ background: isActive ? '#dbeafe' : 'transparent', padding: '4px 8px', }}>
                            <span style={{ cursor: 'pointer', marginRight: '10px', display: 'flex', gap: '4px', }}
                              onClick={(e) => { e.stopPropagation(); if (!m.visible) return; setOpenModel((prev) => ({ ...prev, [idx]: !prev[idx] })); }}
                            >
                              {openModel[idx] ? <ChevronDown /> : <ChevronRight />}
                            </span>
                            <span style={{ cursor: 'pointer', marginRight: '10px', display: 'flex', gap: '4px', }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItems((prev) => prev.filter((item) => item.modelID !== m.id));
                                loaderRef.current.toggleModelVisibility(m.id);
                                setModels((prev) => prev.map((model) => model.id === m.id ? { ...model, visible: !model.visible } : model));
                                setHiddenItems((prev) => {
                                  const updated = { ...prev };
                                  Object.keys(updated).forEach((key) => { if (key.startsWith(`${m.id}-`)) delete updated[key]; });
                                  return updated;
                                });
                                setOpenModel((prev) => ({ ...prev, [idx]: false }));
                              }}
                            >
                              {m.visible ? <Eye /> : <EyeOff />}
                            </span>
                            <span style={{ cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#2D566C' : '#444', lineClamp: 1, display: 'block', wordBreak: 'break-word', }}>{m.name}</span>
                            <span style={{ cursor: 'pointer', marginLeft: 'auto', marginTop: "4px" }}
                              onClick={(e) => { e.stopPropagation(); setOpenMenuKey(openMenuKey === `model-${m.id}` ? null : `model-${m.id}`); }}
                            >
                              <EllipsisVertical size={20} />
                              {openMenuKey === `model-${m.id}` && (
                                <div className="absolute bg-white border shadow-lg z-50 rounded-md py-1 right-2 w-40">
                                  <div className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer flex items-center gap-2"
                                    onClick={(e) => { e.stopPropagation(); handleOpenPositionSettings(m); }}
                                  >
                                    <Settings2 size={14} /> Position Settings
                                  </div>
                                </div>
                              )}
                            </span>
                          </div>
                          <div className="">
                            {!isCollapsed && openModel[idx] && (
                              <TreeNode idx={0} modelId={m.ifcModelID} node={m.tree} onSelect={loaderRef} selectedTreePaths={selectedTreePaths} setSelectedTreePaths={setSelectedTreePaths} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              }

              {state == 'layers' &&
                <div className="">
                  <div className="p-4 w-full border-b border-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Layers</h2>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortBy("name")}>Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("model")}>Model {sortBy === "model" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}><Search className="h-4 w-4" /></Button>
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
                        const isIsolated = hiddenLayers.size > 0 && allLayerKeys.every((k) => k === key || hiddenLayers.has(k));

                        return (
                          <div className="flex justify-between items-center my-2 cursor-pointers" key={idx}
                            style={{ background: isActive ? '#dbeafe' : 'transparent', padding: '4px 8px', }}
                            onClick={() => { if (modelHidden) return; setSelectedLayer([layer.typeId]); }}
                          >
                            <div className="flex" style={{ opacity: modelHidden ? 0.4 : 1 }}>
                              <span style={{ cursor: 'pointer', marginRight: '10px', display: 'flex', gap: '4px', }}
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
                              <span style={{ cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#2D566C' : '#444', lineClamp: 1, display: 'block', wordBreak: 'break-word', }}>{layer.label}</span>
                            </div>
                            <span style={{ cursor: 'pointer', opacity: modelHidden ? 0.4 : 1, position: 'relative' }}
                              onClick={(e) => { e.stopPropagation(); if (modelHidden) return; setOpenMenuKey(openMenuKey === key ? null : key); }}
                            >
                              <EllipsisVertical size={16} />
                              {openMenuKey === key && (
                                <div style={{ position: 'absolute', top: '20px', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, minWidth: '140px', }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-2 hover:bg-gray-100 text-sm"
                                    onClick={() => {
                                      if (isIsolated) { loaderRef.current.unIsolateModel(m.id); setHiddenLayers(new Set()); }
                                      else { loaderRef.current.isolateTypeVisibility(m.id, layer.typeId); setHiddenLayers(new Set(m.layers.map((l) => layerKey(m.id, l.typeId)).filter((k) => k !== key))); }
                                      setOpenMenuKey(null);
                                    }}
                                  >{isIsolated ? 'Unisolate layer' : 'Isolate layer'}</div>
                                  <div className="px-3 py-2 hover:bg-gray-100 text-sm" onClick={() => { setSelectedLayer([layer.typeId]); setOpenMenuKey(null); }}>Select layer</div>
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

              {state == 'todos' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <TodoList projectId={projectId} onRestoreView={restoreState} onSelectTodo={onSelectTodo} onOpenDrawer={onOpenTodoDrawer} />
                </div>
              )}

              {state == 'views' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <ViewList projectId={projectId} ifcUrls={ifcUrls} onOpenDrawer={onOpenViewDrawer} onRestoreView={onRestoreView} onUpdateSnapshot={onUpdateSnapshot} />
                </div>
              )}

              {state == 'organizer' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <Organizer />
                </div>
              )}

              {state == 'data-table' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <DataTable />
                </div>
              )}

              {state == 'topics' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <Topics 
                    projectId={projectId} 
                    capture3DState={async () =>{
                        const snapshot = getSnapshot();
                        const context = getContext();
                        let thumbnailBase64 ="";
                        if(canvasRef.current && sceneRef.current) {
                          const renderer = sceneRef.current.getRenderer();
                          const scene = sceneRef.current.scene;
                          const camera = sceneRef.current.getCamera();
                          renderer.render(scene, camera);
                          thumbnailBase64 = canvasRef.current.toDataURL("image/png", 0.5);
                        }
                        return { viewState: snapshot, items: context, thumbnail: thumbnailBase64 || snapshot?.thumbnail }
                    }}
                    onRestoreView={restoreState}
                    onAddMarkerStart={(cb) => setMarkerCallback(() => cb)}
                    onAddMarkerCancel={() => setMarkerCallback(null)}
                  />
                </div>
              )}

              {state == 'clash-sets' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', }}>
                  <ClashSets onOpenNewClashDrawer={onOpenNewClashDrawer} projectId={projectId} onSelectClashItem={handleSelectClashItem} clashResults={clashResults} onRestoreClashSet={onRestoreClashSet} autoExpandedSetId={autoExpandedClashSetId} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3D CANVAS */}
        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', alignItems: 'center', }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', outline: 'none', }} />

          {cameraMode === 'walk' && (
            <div className="absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-top-2 duration-500 pointer-events-none select-none">
              <div className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg border border-white/10 w-auto min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-blue-400">
                  <Footprints className="h-4 w-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Fly Mode Controls</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-y-2 gap-x-4 text-[11px] items-center">
                  <span className="text-slate-300 font-medium">Move</span>
                  <div className="flex gap-1 justify-end"><Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd></div>
                  <span className="text-slate-300 font-medium">Elevation</span>
                  <div className="flex gap-1 justify-end"><Kbd>R</Kbd><span className="text-slate-500 self-center text-[10px]">/</span><Kbd>T</Kbd></div>
                  <span className="text-slate-300 font-medium">Sprint</span>
                  <div className="flex gap-1 justify-end"><Kbd>Shift</Kbd></div>
                  <span className="text-slate-300 font-medium">Look</span>
                  <div className="flex items-center justify-end gap-1 text-slate-300"><Move className="h-3 w-3" /> Mouse</div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Item Information */}
          {selectedItems.length > 0 && (
            <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-4 z-20"
            >
              <div className="text-sm"><span className="font-semibold">{selectedItems.length}</span> selected</div>
              <div className="w-px h-5 bg-white/20" />
              <button className="hover:text-blue-400 transition" title="View properties" onClick={() => { if (isPropertiesOpen) setIsPropertiesOpen(false); else handleShowProperties(); }}><Info /></button>

              {selectedItems.length > 0 && (
                <button className="hover:text-blue-400 transition" title="Toggle visibility"
                  onClick={() => {
                    const firstItem = selectedItems[0];
                    const firstKey = `${firstItem.modelID}-${firstItem.expressID}`;
                    const isFirstHidden = hiddenItems[firstKey];
                    const shouldHide = !isFirstHidden;

                    setHiddenItems((prev) => {
                      const updated = { ...prev };
                      selectedItems.forEach(item => {
                        const key = `${item.modelID}-${item.expressID}`;
                        if (shouldHide) updated[key] = true;
                        else delete updated[key];
                      });
                      return updated;
                    });

                    selectedItems.forEach(item => {
                      const key = `${item.modelID}-${item.expressID}`;
                      const isItemCurrentlyHidden = hiddenItems[key];
                      if ((shouldHide && !isItemCurrentlyHidden) || (!shouldHide && isItemCurrentlyHidden)) {
                        loaderRef.current.toggleItemVisibility(item.modelID, item.expressID);
                      }
                    });

                    if (shouldHide) loaderRef.current.removeHighlight();
                    else loaderRef.current.highlightItems(selectedItems);
                  }}
                >
                  {hiddenItems[`${selectedItems[0]?.modelID}-${selectedItems[0]?.expressID}`] ? <EyeOff /> : <Eye />}
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {isDataTable && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 duration-300" style={{ height: '400px' }}>
          <DataTable ifcManager={loaderRef.current} />
        </div>
      )}

      <PropertiesDrawer open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen} data={propertiesData} loading={isLoadingProps} />

      <ModelPositionDrawer open={isPosDrawerOpen} onOpenChange={setIsPosDrawerOpen} modelId={posDrawerModel?.id ?? null} modelName={posDrawerModel?.name ?? ""} initialData={posDrawerData} onSave={handleSavePosition} />
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