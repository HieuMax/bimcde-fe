'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function TreeNode({ idx, node, onSelect, modelId, selectedTreePaths, setSelectedTreePaths }) {
  const [open, setOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    setOpen(!open);
  };

  const clickItem = () => {
    if (node.expressID && onSelect?.current) {
      onSelect.current.highlight(modelId, node.expressID);
    }
  };
  // const isActive = selectedTreePath === node.expressID;
  const isActive =
    selectedTreePaths.some(path => path.modelIndex === modelId && path.expressID === node.expressID);

  const marginLeft = idx ? idx * 15 + 20 : 20;

  // console.log()

  const getName = (node) => {
    if (node.properties && node.properties.Name) {
      return node.properties.Name.value;
    }
    return `${node.type} #${node.expressID}`;
  };

  return (
    <div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          clickItem();
          console.log('Clicked item:', { modelId, expressID: node.expressID });
          const path = { modelIndex: modelId, expressID: node.expressID };
          if (e.ctrlKey) {
            // Toggle selection
            setSelectedTreePaths(prev => {
              const exists = prev.some(p => p.modelIndex === modelId && p.expressID === node.expressID);
              if (exists) {
                return prev.filter(p => !(p.modelIndex === modelId && p.expressID === node.expressID));
              } else {
                return [...prev, path];
              }
            });
          } else {
            // Single selection
            setSelectedTreePaths([path]);
          }
        }}
        className={isActive ? 'tree-active' : ''}
        style={{
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2px 0',
          borderRadius: '4px',
          position: 'relative',
          width: '100%',
          minHeight: '24px',
        }}
      >
        <div
          className="flex w-full items-center"
          style={{
            background: isActive ? '#dbeafe' : 'transparent',
          }}
        >
          {/* Toggle icon */}
          {hasChildren ? (
            <span
              style={{ width: '20px', marginLeft: marginLeft, display: 'flex' }}
              onClick={handleClick}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </span>
          ) : (
            <span
              style={{ width: '20px', marginLeft: marginLeft, marginTop: '5px', padding: '5px 0' }}
            ></span>
          )}

          <span
            style={{
              marginLeft: '4px',
              padding: '5px 0',
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? '#2D566C' : '#444',
            }}
          >
            {getName(node)}
          </span>
        </div>

        <div className="w-full items-center">
          {open &&
            hasChildren &&
            node.children.map((child) => (
              <TreeNode
                key={child.expressID}
                idx={idx + 1}
                node={child}
                onSelect={onSelect}
                modelId={modelId}
                selectedTreePaths={selectedTreePaths}
                setSelectedTreePaths={setSelectedTreePaths}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
