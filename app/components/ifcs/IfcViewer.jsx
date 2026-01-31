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
  Settings2
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
  selectionMode
}) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);
  const threeSceneRef = useRef(null);
  const selectedItemsRef = useRef([]);
  const selectionModeRef = useRef(selectionMode)
  const modelUrlMap = useRef({})

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

  // Model list
  const [models, setModels] = useState([]);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  // DATA TABLE
  const isDataTable = state === 'data-table';


  // --- STATE POSITION DRAWER ---
  const [isPosDrawerOpen, setIsPosDrawerOpen] = useState(false);
  const [posDrawerModel, setPosDrawerModel] = useState(null);
  const [posDrawerData, setPosDrawerData] = useState(null);

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
            }
          });
        }
      }

      //
      // LOADING MODELS
      //
      if (ifcUrls?.length) {
        loaderRef.current.clearModels();

        modelUrlMap.current = {};

        // const loadPromises = ifcUrls.map(url => loaderRef.current.loadIfcUrl(url));

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

    const itemsToHighlight = [
      { modelID: item1.modelID, expressID: item1.expressID },
      { modelID: item2.modelID, expressID: item2.expressID }
    ];

    loaderRef.current.highlightItems(itemsToHighlight);

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
      modelID: ""
    }));

    const thumbnail = sceneRef.current.getScreenshot();

    const modelTransforms = loaderRef.current.getAllModelsTransform();
    return {
      camera,
      visibility: safeVisibility,
      selection: safeSelection,
      thumbnail,
      modelOpacity: modelOpacity,
      modelTransforms: modelTransforms
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
    </div>
  );
}
