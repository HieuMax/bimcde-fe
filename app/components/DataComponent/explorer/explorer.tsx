'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  Image as ImageIcon,
  Archive,
  File,
  FolderPlus,
  FileUp,
  ListTree,
  Grid2x2,
  DiamondPlus,
  ChevronRight
} from 'lucide-react';

import CreateFolderModal from '../CreateModel/createExplorerModel';
import UploadFilesModal from '../CreateModel/uploadFileExplorer';
import { getExplorerItems } from '@/app/types/api';

/* ===================== TYPES ===================== */
interface ExplorerItem {
  _id: string;
  name: string;
  fileId?: string;
  type: 'folder' | 'file' | 'image' | 'archive';
  previewSrc?: string;
  size?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  updatedAt?: string;
  parentId?: string | null;
}

interface ExplorerProps {
  projectId: string;
  onOpenPanel?: (item: ExplorerItem) => void;
}

/* ===================== HELPERS ===================== */
const getIcon = (type: string) => {
  switch (type) {
    case 'folder': return Folder;
    case 'image': return ImageIcon;
    case 'archive': return Archive;
    default: return File;
  }
};

/* ===================== COMPONENT ===================== */
export default function Explorer({projectId, onOpenPanel }: ExplorerProps) {
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const [path, setPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Explorer' }
  ]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [openCreateFolder, setOpenCreateFolder] = useState(false);
  const [openUploadFiles, setOpenUploadFiles] = useState(false);

  const [items, setItems] = useState<ExplorerItem[]>([]);
  const currentFolderId = path[path.length - 1].id;

  /* ===================== LOAD DATA ===================== */
  useEffect(() => {
    if (!projectId) return;

    getExplorerItems(projectId, currentFolderId)
      .then(setItems)
      .catch(console.error);
  }, [projectId, currentFolderId]);

  /* ===================== FILTER ===================== */
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  /* ===================== HANDLERS ===================== */
  const handleOpenFolder = (item: ExplorerItem) => {
    if (item.type !== 'folder') return;
    setPath(prev => [...prev, { id: item._id, name: item.name }]);
  };

  const handleFileNameClick = (item: ExplorerItem) => {
    if (item.type === 'folder') {
      handleOpenFolder(item);
      return;
    }
    if (!item.fileId) {
      console.error('ExplorerItem missing fileId', item);
      return;
    }

    router.push(`/projects/${projectId}/file/${item.fileId}`);
  };

  /* ===================== UI ===================== */
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-0">
      <div className="bg-white border-b border-gray-200 p-6 flex items-center">
        <nav className="flex items-center gap-2 text-sm text-gray-600 flex-1">
          {path.map((p, i) => (
            <div key={p.id ?? 'root'} className="flex items-center gap-2">
              <button
                className={`text-3xl ${i === path.length - 1
                  ? 'font-semibold text-slate-700'
                  : 'text-gray-600 hover:underline'}`}
                onClick={() => setPath(path.slice(0, i + 1))}
              >
                {p.name}
              </button>
              {i < path.length - 1 && <ChevronRight className="text-gray-300" />}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <Grid2x2 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <ListTree size={20} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(v => !v)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <DiamondPlus size={16} /> Add
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow z-30">
                <button
                  className="menu-item"
                  onClick={() => { setShowAddMenu(false); setOpenCreateFolder(true); }}
                >
                  <FolderPlus /> Create folder
                </button>
                <button
                  className="menu-item"
                  onClick={() => { setShowAddMenu(false); setOpenUploadFiles(true); }}
                >
                  <FileUp /> Upload files
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden px-4">
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <Folder size={48} className="text-gray-300" />
              <div className="ml-4">
                <p className="font-medium text-lg">This folder is empty</p>
                <p className="text-sm">Upload or create a folder to get started.</p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <>
              <div className="border-b border-gray-300 px-6 py-3 sticky top-0 bg-white z-10 flex gap-4 text-base font-semibold text-gray-700">
                <div className="w-12" />
                <div className="flex-1 truncate">Name</div>
                <div className="w-40">Modified by</div>
                <div className="w-40">Modified on</div>
                <div className="w-24">Size</div>
                <div className="w-32 text-right">Tags</div>
              </div>

              {/* ===== LIST BODY ===== */}
              <div className="flex-1 overflow-y-auto bg-white divide-y">
                {filteredItems.map(item => {
                  const Icon = getIcon(item.type);
                  return (
                    <div
                      key={item._id}
                      onMouseEnter={() => setHoveredId(item._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onDoubleClick={() => handleOpenFolder(item)}
                      onClick={() => onOpenPanel?.({ ...item, type: item.type })}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="w-12">
                        <div className="w-10 h-8 flex items-center justify-center rounded-sm bg-gray-100">
                          {item.previewSrc
                            ? <img src={item.previewSrc} className="w-full h-full object-cover" />
                            : <Icon size={16} className="text-gray-400" />}
                        </div>
                      </div>

                      <div className="flex-1 font-semibold line-clamp-3"
                          title={item.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileNameClick(item);
                            }}
                          >
                        {item.name}
                      </div>

                      <div className="w-40 text-sm text-gray-600 truncate">
                        {item.modifiedBy ?? '—'}
                      </div>

                      <div className="w-40 text-sm text-gray-600">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString()
                          : '—'}
                      </div>

                      <div className="w-24 text-sm text-gray-600">
                        {item.size ?? '—'}
                      </div>

                      <div className="w-32 text-right">
                        {item.tags?.length
                          ? item.tags.slice(0, 2).map(t =>
                              <span key={t} className="tag">{t}</span>)
                          : <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ===== GRID (GIỮ NGUYÊN UI) ===== */
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const Icon = getIcon(item.type);
                return (
                  <div
                    key={item._id}
                      onDoubleClick={() => {
                        if (item.type === 'folder') {
                          handleOpenFolder(item);
                        } else if (item.fileId) {
                          router.push(`/projects/${projectId}/file/${item.fileId}`);
                        }
                      }}
                    onClick={() => onOpenPanel?.(item)}
                    className="bg-white rounded-lg p-4 hover:shadow-lg cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      {item.previewSrc
                        ? <img src={item.previewSrc} className="w-full h-full object-cover rounded" />
                        : <Icon size={22} className="text-gray-500" />}
                    </div>

                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.size ?? '—'} • {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CreateFolderModal
          isOpen={openCreateFolder}
          parentName={path[path.length - 1].name}
          onClose={() => setOpenCreateFolder(false)}
          onCreate={(name) => console.log('Create folder', name)}
        />

        <UploadFilesModal
          isOpen={openUploadFiles}
          onClose={() => setOpenUploadFiles(false)}
          onFilesSelected={(files) => console.log(files)}
        />
      </div>
    </div>
  );
}
