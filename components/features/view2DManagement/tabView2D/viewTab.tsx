'use client';

import { useState, useEffect } from 'react';
import { 
  Camera, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Share2, 
  Filter
} from 'lucide-react';
import { ViewItem } from '@/types/explorer'; 

type ViewsTabProps = {
  views: ViewItem[];
  currentUser: string;
  onSelectView: (view: ViewItem) => void;
  onCreateView: () => void;
  onDeleteView?: (viewId: string) => void;
  onEditView?: (view: ViewItem) => void;
};

export default function ViewsTab({
  views,
  currentUser,
  onSelectView,
  onCreateView,
  onDeleteView,
  onEditView
}: ViewsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Logic lọc dữ liệu
  const filtered = views.filter(v => {
    const matchesFilter = filterType === 'mine' 
      ? (v.assignedTo === currentUser || v.createdBy === currentUser) 
      : true;
    
    const viewName = v.name || ""; 
    const matchesSearch = viewName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* ===== HEADER ===== */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Views ({views.length})
        </h3>
        <button
          onClick={onCreateView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          title="Create New View"
        >
          <Camera size={14} />
          <span className="text-xs font-bold">New</span>
        </button>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="p-3 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search views..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={12} className="text-gray-400" />
          <select
            className="flex-1 bg-transparent text-xs font-medium text-gray-600 focus:outline-none cursor-pointer hover:text-blue-600"
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'mine')}
          >
            <option value="all">All Views</option>
            <option value="mine">Created by Me</option>
          </select>
        </div>
      </div>

      {/* ===== LIST CONTENT ===== */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
             <Camera size={24} strokeWidth={1.5} className="opacity-20" />
             <span className="text-xs">No views found</span>
           </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(v => (
              <div
                key={v._id}
                className="group relative flex gap-3 p-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
              >
                <div 
                  onClick={() => onSelectView(v)}
                  className="w-24 aspect-video rounded-md bg-gray-200 overflow-hidden shrink-0 border border-gray-100 cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                >
                  {v.previewSrc ? (
                    <img
                      src={v.previewSrc.split('#coords:')[0]}
                      alt={v.name || 'View'}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Camera size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 cursor-pointer" onClick={() => onSelectView(v)}>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {v.name || <span className="text-gray-400 italic">Untitled View</span>}
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                      <span className="truncate max-w-[80px]">
                        {typeof v.createdBy === 'string' 
                          ? v.createdBy 
                          : (v.createdBy as any)?.fullName || 'Unknown'}
                      </span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                      
                      <span>
                        {v.createdAt 
                          ? new Date(v.createdAt).toLocaleDateString() 
                          : 'Just now'} 
                      </span>
                    </div>
                  </div>
                  
                  {v.description && (
                    <div className="text-[10px] text-gray-400 truncate mt-1">
                      {v.description}
                    </div>
                  )}
                </div>

                <div className={`absolute right-1 top-1 ${activeMenuId === v._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === v._id ? null : v._id);
                    }}
                    className="p-1 rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuId === v._id && (
                    <div 
                      className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => {
                          onSelectView(v);
                          onEditView?.(v);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <Edit size={12} /> Rename
                      </button>
                      <button 
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
                        onClick={() => setActiveMenuId(null)}
                      >
                        <Share2 size={12} /> Share
                      </button>
                      <div className="h-[1px] bg-gray-100 my-0.5" />
                      <button 
                        onClick={() => {
                          if (confirm(`Delete view "${v.name || 'Untitled'}"?`)) {
                             onDeleteView?.(v._id);
                          }
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}