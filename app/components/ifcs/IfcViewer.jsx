"use client";

import { useState, useEffect, useRef } from "react";
import { ThreeScene } from "@/app/libs/ifc/scene";
import { IfcManager } from "@/app/libs/ifc/ifc-manager";
import { TreeNode } from "./TreeNode";
import { Eye, EyeOff } from "lucide-react";

export default function IfcViewer() {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const [file, setFile] = useState({
    name: "",
    url: "",
  });

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Model list
  const [models, setModels] = useState([]);
  const [currentTree, setCurrentTree] = useState(null);

  console.log(models)
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFile({
      name: file.name,
      url: url,
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!loaderRef.current) {
      const scene = new ThreeScene(canvasRef.current);
      loaderRef.current = new IfcManager(scene.scene, []);

      window.addEventListener("mousedown", (e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        isDragging.current = false;
      });

      /** IF MOUSE MOVES -> DRAGGING */
      window.addEventListener("mousemove", (e) => {
        const dx = Math.abs(e.clientX - mouseDownPos.current.x);
        const dy = Math.abs(e.clientY - mouseDownPos.current.y);
        if (dx > 3 || dy > 3) {
          isDragging.current = true;
        }
      });

      /** ONLY PICK IF NOT DRAGGING */
      window.addEventListener("mouseup", (event) => {
        if (!isDragging.current) {
          loaderRef.current.pick(
            event,
            scene.getCamera(),
            scene.getRenderer()
          );
        }
      });
    }

    if (file.url) {
      loaderRef.current.clearModels();
      loaderRef.current.loadIfcUrl(file.url).then(async (model) => {
        const modelID = model.modelID;
        const tree = await loaderRef.current.getSpatialTree(modelID);

        setModels(prev => [
          ...prev,
          {
            id: modelID,
            name: file.name,
            tree,
            mesh: model.mesh,
            visible: true,
          }
        ]);
      });
    }
  }, [file]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <input
        type="file"
        accept=".ifc"
        onChange={handleUpload}
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* LEFT SIDEBAR */}
        <div style={{
          width: "300px",
          height: "100%",
          overflowY: "auto",
          background: "#FFFFFF",
          color: "#6F6F6F",
          padding: "10px",
          zIndex: 10,
          position: "absolute",
        }}>
          <h3>Models</h3>
          {models.map((m, idx) => (
            <div key={idx} className="flex">
                <span
                  style={{ cursor: "pointer", marginRight: "10px" }}
                  onClick={() => {
                    m.mesh.visible = !m.mesh.visible;
                    m.visible = m.mesh.visible;
                    setModels([...models]);
                  }}
                >
                  {m.visible ? <Eye /> : <EyeOff />}
                </span>
                <span
                  onClick={() => setCurrentTree(m.tree)}
                  style={{ cursor: "pointer", color: "#444" }}
                >
                  {m.name}
                </span>
            </div>
          ))}

          <hr style={{ opacity: 0.3 }} />

          {currentTree && (
            <>
              <h3>Structure</h3>
              <TreeNode modelId={models[0].id} node={currentTree} onSelect={loaderRef} loaderRef={loaderRef} />
            </>
          )}
        </div>

        {/* RIGHT: 3D CANVAS */}
        <div style={{ flex: 1, height: "100%" }}>
          <canvas
            id="threeCanvas"
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>

  );
}
