'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image, MoreVertical } from 'lucide-react';
import { getViews } from '../../../types/api';

/* ===================== TYPES ===================== */
type ViewItem = {
  _id: string;
  projectId: string;
  fileId: string;
  name: string;
  description?: string;
  previewSrc?: string;
  sharedWith?: string[];
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  dataType?: '2D' | '3D';
};

type Props = {
  projectId: string;
  onOpenPanel?: (item: ViewItem) => void;
};

/* ===================== COMPONENT ===================== */
export default function Views({projectId, onOpenPanel }: Props) {
  const router = useRouter();
  // const projectId = params?.id;

  const [views, setViews] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ===================== FETCH ===================== */
  useEffect(() => {
    if (!projectId) return;

    async function load() {
      try {
        setLoading(true);
        setViews([]);
        const data = await getViews(projectId);
        setViews(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load views');
        }
      }
      finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  /* ===================== FILTER ===================== */
  const filteredViews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return views;

    return views.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.description ?? '').toLowerCase().includes(q)
    );
  }, [views, query]);

  /* ===================== STATES ===================== */
  if (loading) {
    return <div className="p-6 text-gray-500">Loading views…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  /* ===================== RENDER ===================== */
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-0">
      {/* ===== HEADER ===== */}
      <div className="bg-white border-b border-gray-200 p-6 flex items-center">
        <div className="text-3xl font-semibold text-slate-700 flex-1">
          Views
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Table header */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 px-6 py-3 flex items-center gap-4 text-base font-semibold text-gray-700">
          <div className="w-12" />
          <div className="flex-1">Name</div>
          <div className="w-64">Description</div>
          <div className="w-40">Shared with me</div>
          <div className="w-40">Modified</div>
          <div className="w-12" />
        </div>

        {/* Rows */}
        {filteredViews.length === 0 ? (
          <div className="px-6 py-12 text-gray-500">
            No views found
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {filteredViews.map((view: ViewItem) => {
              const isHovered = hoveredId === view._id;
              const isSelected = selectedId === view._id;

              return (
                <div
                  key={view._id}
                  onMouseEnter={() => setHoveredId(view._id)}
                  onMouseLeave={() =>
                    setHoveredId(prev => (prev === view._id ? null : prev))
                  }
                  onClick={() => {
                    setSelectedId(view._id);
                    onOpenPanel?.(view)
                  }}
                  onDoubleClick={() =>
                    router.push(`/projects/${projectId}/view/${view._id}`)
                  }
                  className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors
                    ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  {/* Thumbnail / checkbox */}
                  <div className="w-12 flex items-center justify-center">
                    {isHovered ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          e.stopPropagation();
                          setSelectedId(e.target.checked ? view._id : null);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    ) : (
                      <div className="w-10 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        {view.previewSrc ? (
                          <img
                            src={view.previewSrc}
                            alt={view.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image size={16} className="text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-gray-800 truncate"
                        title={view.name}
                      >
                        {view.name}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {view.modifiedBy
                          ? `Modified by ${view.modifiedBy}`
                          : '--'}
                      </div>
                    </div>


                  {/* Description */}
                  <div className="w-64 text-sm text-gray-600 truncate">
                    {view.description ?? '--'}
                  </div>

                  {/* Shared */}
                  <div className="w-40 text-sm text-gray-600">
                    {view.sharedWith?.length ? 'Yes' : '--'}
                  </div>

                  {/* Modified */}
                  <div className="w-40 text-sm text-gray-600">
                    {view.updatedAt
                      ? new Date(view.updatedAt).toLocaleDateString()
                      : '--'}
                  </div>

                  {/* Actions */}
                  <div className="w-12 flex justify-end">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenPanel?.(view);
                      }}
                      className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
