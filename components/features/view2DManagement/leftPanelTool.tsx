'use client';
import { Info, Grid2X2, CircleCheckBig, Camera, FileClock } from 'lucide-react';

export default function LeftPanelTool({
  activeKey,
  onClick,
}: {
  activeKey: string;
  viewCount: number;
  onClick: (key: string) => void;
}) {
  const tools = [
    { key: 'filedetail', icon: <Info size={22} />, label: 'File detail' },
    { key: 'history', icon: <FileClock size={22} />, label: 'Version history' },
    { key: 'page', icon: <Grid2X2 size={22} />, label: 'Pages' },
    { key: 'todo', icon: <CircleCheckBig size={22} />, label: 'ToDos' },
    { key: 'view', icon: <Camera size={22} />, label: 'Views' },
  ];

  return (
    <div className="w-12 h-full bg-slate-200 flex flex-col shrink-0">
      {tools.map(t => (
        
        <button
          key={t.key}
          title={t.label}
          onClick={() => onClick(t.key)}
          className={`h-12 flex items-center justify-center 
            ${activeKey === t.key ? 'bg-white text-blue-900 font-extrabold' : 'hover:bg-gray-100'}`}
        >
          {t.icon}
        </button>
      ))}
      <div className="flex-1" />
    </div>
  );
}
