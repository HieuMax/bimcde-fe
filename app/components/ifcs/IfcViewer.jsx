'use client';

import { useState, useEffect, useRef } from 'react';
import { ThreeScene } from '@/app/libs/ifc/scene';
import { IfcManager } from '@/app/libs/ifc/ifc-manager';
import { TreeNode } from './TreeNode';
import TodoList from '@/components/todos/TodoList';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Info,
  EllipsisVertical,
} from 'lucide-react';
import './ifc.css';
import LoadingBar from '../LoadingBar';

export default function IfcViewer({ ifcUrls, state, projectId }) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [openModel, setOpenModel] = useState({});
  const [selectedTreePath, setSelectedTreePath] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState({});
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState([]);

  const EXPANDED_WIDTH = 400;
  const COLLAPSED_WIDTH = 250;

  const [isCollapsed, setIsCollapsed] = useState(false);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Model list
  const [models, setModels] = useState([]);

  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  // Todo list
  // const [todos, setTodos] = useState<Todo[]>([])
  // const [isOpen, setIsOpen] = useState(false)
  // const [selectedTodoId, setSelectedTodoId] = useState<string | undefined>()

  // const selectedTodo = todos.find((todo) => todo.id === selectedTodoId)

  // const handleAddTodo = (newTodo: Omit<Todo, 'id'>) => {
  //   const todo: Todo = {
  //     ...newTodo,
  //     id: Date.now().toString(),
  //   }
  //   setTodos([...todos, todo])
  //   setSelectedTodoId(todo.id)
  //   setIsOpen(false)
  // }

  // const handleDeleteTodo = (id: string) => {
  //   setTodos(todos.filter((todo) => todo.id !== id))
  //   if (selectedTodoId === id) {
  //     setSelectedTodoId(undefined)
  //   }
  // }

  // const handleUpdateTodo = (id: string, updatedTodo: Omit<Todo, 'id'>) => {
  //   setTodos(todos.map((todo) => (todo.id === id ? { ...updatedTodo, id } : todo)))
  // }

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
              setSelectedItems([result]);
            } else {
              setSelectedItems([]);
            }
          }
        });
      }

      if (ifcUrls?.length) {
        loaderRef.current.clearModels();
        for (const url of ifcUrls) {
          loaderRef.current.loadIfcUrl(url).then(async (model) => {
            const modelID = model.modelID;
            const { tree, layers } = await loaderRef.current.getSpatialTree(modelID);

            setModels((prev) => [
              ...prev,
              {
                id: modelID,
                // name: file.name,
                name: url.split('/').pop(),
                tree,
                layers,
                mesh: model.mesh,
                visible: true,
              },
            ]);
          });
        }
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

  const onToggleLayer = (modelId, typeId) => {
    loaderRef.current.toggleTypeVisibility(modelId, typeId);
  };

  const layerKey = (modelID, typeId) => `${modelID}_${typeId}`;

  const isLayerVisible = (modelID, typeId) => !hiddenLayers.has(layerKey(modelID, typeId));

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
    <div style={{ width: '100%', height: '100vh' }}>
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
              overflowY: 'auto',
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
            }}
          >
            <div className="flex justify-between items-center">
              {/* <h3>{state == 'models' ? 'Selected Models' : 'Layers'}</h3>
              <span>
                {isCollapsed ? (
                  <ChevronRight
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsCollapsed(false)}
                  />
                ) : (
                  <ChevronLeft style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)} />
                )}
              </span> */}
            </div>

            {/* Model */}
            {state == 'models' &&
              models.map((m, idx) => {
                const isActive = selectedModelIndex === idx && selectedTreePath == null;

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
                      setSelectedTreePath(null);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      width: '100%',
                      borderRadius: '4px',
                      width: `${sidebarWidth - 30}px`,
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
                          modelId={m.id}
                          node={m.tree}
                          onSelect={loaderRef}
                          selectedTreePath={selectedTreePath}
                          setSelectedTreePath={setSelectedTreePath}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Layers */}
            {state == 'layers' &&
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
              })}

            {/* Todos */}
            {state == 'todos' &&
              <>
                <TodoList
                  projectId={projectId}
                  // todos={todos}
                  // selectedTodoId={selectedTodoId}
                  // onSelectTodo={setSelectedTodoId}
                  // onAddTodo={() => setIsOpen(true)}
                />
              </>
            }
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
