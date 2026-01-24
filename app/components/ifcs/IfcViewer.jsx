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
  Menu, Search, Check
} from 'lucide-react';
import './ifc.css';
import LoadingBar from '../LoadingBar';

import { ViewList } from '@/components/views/ViewList';
import { DataTable } from '@/components/_3d/data_table/DataTable';
import { Topics } from '@/components/_3d/topics/Topics';
import { ClashSets } from '@/components/_3d/clash_sets/ClashSets';
import { Organizer } from '@/components/_3d/organizer/Organizer';

export default function IfcViewer({
  ifcUrls,
  state,
  projectId,
  isCollapsed,
  setSelectdItemsForNavbar,
  onRegisterCapture,
  onLoaded,
  onSelectTodo
}) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);

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

  const EXPANDED_WIDTH = 370;
  const COLLAPSED_WIDTH = 250;

  // const [isCollapsed, setIsCollapsed] = useState(false);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Model list
  const [models, setModels] = useState([]);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  useEffect(() => {
    if (!ifcUrls?.length || !canvasRef.current) return;

    const load = async () => {
      setIsLoading(true);

      const canvas = canvasRef.current;

      if (!loaderRef.current) {
        const scene = new ThreeScene(canvasRef.current);
        sceneRef.current = scene;
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

            if (result) {
              const sourceUrl = modelUrlMap.current[result.modelID]
              const enrichedItem = { ...result, fileUrl: sourceUrl }
              if (setSelectdItemsForNavbar) {
                setSelectdItemsForNavbar([enrichedItem]);
              }
              setSelectedItems([result]);
            } else {
              setSelectedItems([]);
              if (setSelectdItemsForNavbar) {
                setSelectdItemsForNavbar([]);
              }
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

        // for (const url of ifcUrls) {
        //   loaderRef.current.loadIfcUrl(url).then(async (model) => {
        //     const modelID = model.modelID;

        //     modelUrlMap.current[modelID] = url
        //     const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);

        //     setModels((prev) => [
        //       ...prev,
        //       {
        //         id: prev.length,
        //         ifcModelID: modelID,
        //         // name: file.name,
        //         name: url.split('/').pop(),
        //         tree,
        //         layers,
        //         mesh: model.mesh,
        //         visible: true,
        //       },
        //     ]);
        //   });
        // }

        for (let i = 0; i < loadedModels.length; i++) {
          const model = loadedModels[i];
          const url = ifcUrls[i];
          const modelID = model.modelID;

          // Lưu mapping: ModelID hiện tại <-> URL
          modelUrlMap.current[modelID] = url;

          const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);
          newModels.push({
            id: i, // Hoặc dùng modelID
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
  }, [isCollapsed]);


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

    // 1. Capture Camera
    const cameraState = sceneRef.current.getCameraState();

    // 2. Capture Visibility (Các item đang bị ẩn)
    const hiddenState = loaderRef.current.getVisibilityState();

    // 3. Capture Selection (Lấy từ state React hiện tại)
    // Lưu ý: selectedItems là state của bạn: [{ modelID, expressID, fileUrl }]
    const selectionState = selectedItems.map(item => ({
      modelID: item.modelID,
      expressID: item.expressID,
      fileUrl: item.fileUrl
    }));

    // 4. Capture Thumbnail (Optional)
    const thumbnail = sceneRef.current.getScreenshot();

    return {
      camera: cameraState,
      visibility: hiddenState,
      selection: selectionState,
      thumbnail: thumbnail
    };
  };

  // === LOGIC MỚI: RESTORE STATE ===
  const restoreState = async (viewState, todoItems = []) => {
    if (!viewState || !sceneRef.current || !loaderRef.current) return;

    // --- 1. LOGIC MAPPING ID (Chuẩn bị từ điển) ---
    // Map: OldModelID (trong DB) -> URL file
    const oldIdToUrl = {};
    if (todoItems && Array.isArray(todoItems)) {
      todoItems.forEach(item => {
        // item.modelId từ DB trả về, ép kiểu sang string cho chắc chắn để làm key
        oldIdToUrl[String(item.modelId)] = item.fileUrl;
      });
    }

    // Map: URL -> NewModelID (Runtime hiện tại của Viewer)
    const urlToNewId = {};
    Object.keys(modelUrlMap.current).forEach(id => {
      const url = modelUrlMap.current[id];
      urlToNewId[url] = parseInt(id); // ID của web-ifc thường là số nguyên (0, 1...)
    });
    // ----------------------------------------------

    // --- 2. RESTORE CAMERA (Không cần map ID) ---
    sceneRef.current.setCameraState(viewState.camera);

    // --- 3. RESTORE VISIBILITY (Cần dùng Map ID) ---
    // Bước A: Reset trạng thái cũ trước
    const modelsToReset = Array.from(loaderRef.current.hiddenExpressIDs.keys());
    loaderRef.current.hiddenExpressIDs.clear();
    modelsToReset.forEach(modelID => loaderRef.current.rebuildSubset(modelID));

    // Biến để cập nhật lại icon mắt trên UI React
    const newHiddenItemsReactState = {};

    // Bước B: Apply trạng thái mới với ID đã được Map
    if (viewState.visibility && Array.isArray(viewState.visibility)) {
      for (const group of viewState.visibility) {
        const oldID = String(group.modelID); // Lấy ID cũ
        const url = oldIdToUrl[oldID];       // Tìm URL tương ứng
        const newID = urlToNewId[url];       // Tìm ID mới hiện tại từ URL

        // Chỉ xử lý nếu tìm thấy model ID mới (tức là model đó đang được load)
        if (newID !== undefined) {
          // Lưu vào IfcManager (Logic 3D)
          loaderRef.current.hiddenExpressIDs.set(newID, new Set(group.ids));
          loaderRef.current.rebuildSubset(newID);

          // Lưu vào React State (Logic UI icon mắt)
          group.ids.forEach(id => {
            newHiddenItemsReactState[`${newID}-${id}`] = true;
          });
        }
      }
    }
    setHiddenItems(newHiddenItemsReactState);

    // --- 4. RESTORE SELECTION (Cần dùng Map ID) ---
    loaderRef.current.removeHighlight();
    let newSelectionState = [];

    if (viewState.selection && viewState.selection.length > 0) {
      // Map lại selection sang ID mới
      newSelectionState = viewState.selection.map(item => {
        // Ưu tiên lấy URL trực tiếp từ item selection (nếu có lưu), nếu không thì tra từ todoItems
        const url = item.fileUrl || oldIdToUrl[String(item.modelID)];
        const newID = urlToNewId[url];

        if (newID !== undefined) {
          return {
            ...item,
            modelID: newID // Ghi đè modelID cũ bằng cái mới
          };
        }
        return null;
      }).filter(item => item !== null); // Loại bỏ các item không tìm thấy model

      // Highlight item đầu tiên (hoặc loop nếu muốn highlight nhiều)
      if (newSelectionState.length > 0) {
        const firstItem = newSelectionState[0];
        loaderRef.current.highlight(firstItem.modelID, firstItem.expressID);
      }
    }

    // Update React State cho Selection
    setSelectedItems(newSelectionState);
    if (setSelectdItemsForNavbar) setSelectdItemsForNavbar(newSelectionState);
  };

  useEffect(() => {
    if (onRegisterCapture) {
      onRegisterCapture({
        capture: captureCurrentState,
        restore: restoreState
      });
    }
  }, [onRegisterCapture, selectedItems]);

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
    <div style={{ width: '100%', height: '100%' }}>
      <Loading />
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
        <div className="flex flex-col bg-slate-700">
          {/* LEFT SIDEBAR */}
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            style={{
              width: sidebarWidth,
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
              display: state === 'todos' ? 'flex' : 'block',
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
                <ViewList />
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
                  // TODO: Show properties drawer
                  // const item = selectedItems[0];
                  // loaderRef.current.showProperties(item);
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
