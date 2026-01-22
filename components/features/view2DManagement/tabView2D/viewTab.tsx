'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { ViewItem } from '@/types/view';

type ViewsTabProps = {
  views: ViewItem[];
  currentUser: string;
  onSelectView: (view: ViewItem) => void;
  onCreateView: () => void;
};

export default function ViewsTab({
  views,
  currentUser,
  onSelectView,
  onCreateView,
}: ViewsTabProps) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filtered =
    filter === 'mine'
      ? views.filter(v => v.assignedTo === currentUser)
      : views;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 flex items-center justify-between bg-gray-50">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Views ({views.length})
        </h3>
        <button
          onClick={onCreateView}
          className="flex items-center gap-1 px-2 py-1
                     rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
          title="Create View"
        >
          <Camera size={14} />
          <span>New</span>
        </button>
      </div>

      <div className="p-2 border-b">
        <select
          className="w-full rounded border border-gray-300 px-2 py-1
                     text-xs focus:outline-none focus:border-blue-500"
          value={filter}
          onChange={e => setFilter(e.target.value as 'all' | 'mine')}
        >
          <option value="all">All views</option>
          <option value="mine">Created by me</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
           <div className="text-center text-gray-400 text-xs mt-10">No views found</div>
        ) : (
          filtered.map(v => (
            <div
              key={v._id}
              onClick={() => onSelectView(v)}
              className="cursor-pointer group flex items-start gap-3 p-2 hover:bg-gray-100 rounded mb-1 border border-transparent hover:border-gray-200"
            >
              <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden shrink-0 border">
                {v.previewSrc ? (
                  <img
                    src={v.previewSrc}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600">
                  {v.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {v.assignedTo === currentUser ? 'Me' : v.assignedTo || 'Unknown'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}