"use client";

import { useState, useEffect, useRef } from "react";
import { ThreeScene } from "@/app/libs/ifc/scene";
import { IfcManager } from "@/app/libs/ifc/ifc-manager";

export default function IfcViewer() {
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);
  const [src, setSrc] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setSrc(url);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!loaderRef.current) {
      const scene = new ThreeScene(canvasRef.current);
      loaderRef.current = new IfcManager(scene.scene, []);
    }

    if (src) {
      loaderRef.current.clearModels();
      loaderRef.current.loadIfcUrl(src);
    }
  }, [src]);

  return (
    <div style={{ overflow: 'hidden'}}>
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
      <canvas
        id="threeCanvas"
        ref={canvasRef}
        style={{ width: "100vw", height: "100%", display: "block", overflow: "hidden" }}
      />
    </div>
  );
}
