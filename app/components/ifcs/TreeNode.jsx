"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function TreeNode({ node, onSelect }) {

  const [open, setOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    setOpen(!open);
  };

  const clickItem = () => {
    if (node.expressID && onSelect?.current) {
      onSelect.current.highlight(0, node.expressID);
    }
  };

  return (
    <div style={{ marginLeft: "15px", marginTop: "5px" }}>
      <div
        onClick={() => {
            clickItem()
            handleClick()
        }}
        style={{ cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center" }}
      >
        {/* Toggle icon */}
        {hasChildren ? (
          <span style={{ width: "20px" }}>
            {open ? <ChevronDown /> : <ChevronRight />}
          </span>
        ) : (
          <span style={{ width: "20px" }}>•</span>
        )}

        {/* Name -- ToDo: Change Name of item */}
        <span style={{ marginLeft: "4px" }}>
          {node.type} #{node.expressID}
        </span>
      </div>

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.expressID}
            node={child}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
