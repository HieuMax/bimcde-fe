'use client';

import { useState, useEffect, useRef } from 'react';
import { ThreeScene } from '@/app/libs/ifc/scene';
import { IfcManager } from '@/app/libs/ifc/ifc-manager';
import { TreeNode } from './TreeNode';
import { Eye, EyeOff, ChevronDown, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import './ifc.css';

export default function IfcViewer({ ifcUrls }) {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const sceneRef = useRef(null);

  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [openModel, setOpenModel] = useState({});
  const [selectedTreePath, setSelectedTreePath] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState({});

  const EXPANDED_WIDTH = 400;
  const COLLAPSED_WIDTH = 250;

  const [isCollapsed, setIsCollapsed] = useState(false);

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Model list
  const [models, setModels] = useState([]);

  useEffect(() => {
    if (!ifcUrls?.length || !canvasRef.current) return;

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
          const tree = await loaderRef.current.getSpatialTree(modelID);

          setModels((prev) => [
            ...prev,
            {
              id: modelID,
              // name: file.name,
              name: url.split('/').pop(),
              tree,
              mesh: model.mesh,
              visible: true,
            },
          ]);
        });
      }
    }
  }, [ifcUrls]);


  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // HANDLE RESIZE
  useEffect(() => {
    if (!canvasRef.current || !loaderRef.current) return;

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
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }, [isCollapsed]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
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
            <div className="flex justify-between items-center mb-4 px-2">
              <h3>Selected Models</h3>
              <span>
                {isCollapsed ? (
                  <ChevronRight
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsCollapsed(false)}
                  />
                ) : (
                  <ChevronLeft style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)} />
                )}
              </span>
            </div>
            {models.map((m, idx) => {
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
