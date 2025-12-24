// app/components/ToDoPropertiesPanel.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { X, MoreHorizontal, Plus, Download, UserPen, Edit2, Tag, Trash2 } from 'lucide-react';
import * as C from '../../UI/pannelClassName';

type Attachment = { id: string; name: string; url?: string };
type ToDoSelected = {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  type?: string;
  priority?: 'Normal'|'Critical'|string;
  status?: string;
  completion?: string | number;
  assignedTo?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
  attachments?: Attachment[];
  thumbnail?: string;
};

function isImageFilename(name: string = '') {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

export default function ToDoPropertiesPanel({
  selected,
  onClose,
  onEdit,
  onDownload,
}: {
  selected: ToDoSelected | null;
  onClose?: () => void;
  onEdit?: (s: ToDoSelected) => void;
  onDownload?: (s: ToDoSelected) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const previewImage = useMemo(() => {
    if (!selected) return undefined;
    if (selected.thumbnail) return selected.thumbnail;
    if (selected.attachments && selected.attachments.length) {
      const img = selected.attachments.find(a => a.url && isImageFilename(a.name));
      if (img) return img.url;
      const img2 = selected.attachments.find(a => isImageFilename(a.name));
      if (img2) return img2.url ?? img2.name;
    }
    return undefined;
  }, [selected]);

  if (!selected) return <div className={C.PANEL_WRAPPER}>No item selected</div>;

  return (
    <div className={C.PANEL_WRAPPER}>
      <div className={C.PANEL_HEADER}>
        <div className="flex-1 min-w-0">
          <div className={C.PANEL_HEADER_TITLE}>ToDo</div>
          <h3 className={C.PANEL_HEADER_MAIN}>{selected.code ?? ''} {selected.title ? `- ${selected.title}` : ''}</h3>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button onClick={() => setMoreOpen(!moreOpen)} className={C.ACTION_ICON_BTN}><MoreHorizontal size={16} /></button>
          <button onClick={() => onClose?.()} className="p-1 rounded hover:bg-gray-100 text-gray-600"><X size={18} /></button>
        </div>
      </div>

      {/* Preview + actions */}
      <div className={C.PREVIEW_CONTAINER}>
        <div className={C.PREVIEW_WRAPPER}>
          {previewImage ? <img src={previewImage} alt={selected.title ?? 'thumbnail'} className={C.PREVIEW_IMG} /> :
            <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">No preview available</div>}
        </div>

        <div className={C.ACTION_ROW}>
          <div className="flex-1"><button className={C.ACTION_PRIMARY}>Export ▾</button></div>
          <button className={C.ACTION_ICON_BTN}><Tag size={16} /></button>
          <button className={C.ACTION_ICON_BTN}><Trash2 size={16} /></button>
          <button className={C.ACTION_ICON_BTN}><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* ===== Content scroll wrapper ===== */}
      <div className="flex-1 overflow-y-auto min-h-0 px-0 py-0 side-panel-scrollbar">
        <div className={C.DETAILS_SECTION}>
          <div className={C.DETAILS_TITLE}>Details</div>
          <div className={C.DETAILS_LIST}>
            <div>
              <div className={C.DETAILS_LABEL}>Description</div>
              <div className={C.DETAILS_VALUE}>{selected.description ?? '--'}</div>
            </div>

            <div className="flex justify-between">
              <div>
                <div className={C.DETAILS_LABEL}>Due date</div>
                <div className={C.DETAILS_VALUE}>{selected.dueDate ?? '--'}</div>
              </div>
              <div>
                <div className={C.DETAILS_LABEL}>Type</div>
                <div className={C.DETAILS_VALUE}>{selected.type ?? 'Issue'}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                <div className={C.DETAILS_LABEL}>Priority</div>
                <div className="text-sm flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selected.priority === 'Critical' ? 'bg-red-600' : 'bg-blue-600'}`} />
                  <span>{selected.priority ?? 'Normal'}</span>
                </div>
              </div>
              <div>
                <div className={C.DETAILS_LABEL}>Status</div>
                <div className={C.DETAILS_VALUE}>{selected.status ?? 'New'}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                <div className={C.DETAILS_LABEL}>Completion %</div>
                <div className={C.DETAILS_VALUE}>{selected.completion ?? '--'}</div>
              </div>

              <div>
                <div className={C.DETAILS_LABEL}>Assigned To</div>
                <div className={C.DETAILS_VALUE}>{selected.assignedTo ?? '--'}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                <div className={C.DETAILS_LABEL}>Created</div>
                <div className={C.DETAILS_VALUE}>{selected.createdOn ?? '--'}</div>
                <div className="text-xs text-gray-500">By {selected.createdBy ?? '--'}</div>
              </div>

              <div>
                <div className={C.DETAILS_LABEL}>Modified</div>
                <div className={C.DETAILS_VALUE}>{selected.modifiedOn ?? '--'}</div>
                <div className="text-xs text-gray-500">By {selected.modifiedBy ?? '--'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={C.ATTACH_SECTION}>
          <div className="flex items-center justify-between">
            <div className={C.DETAILS_TITLE}>Attachments</div>
            <div className="flex items-center gap-2">
              <button title="Add" className="p-1 rounded hover:bg-gray-100"><Plus size={16} /></button>
              <button title="Edit attachments" className="p-1 rounded hover:bg-gray-100"><Edit2 size={16} /></button>
            </div>
          </div>

          <div className={C.ATTACH_LIST}>
            {(selected.attachments && selected.attachments.length > 0) ? selected.attachments.map(a => (
              <div key={a.id} className={C.ATTACH_ITEM}>
                <div className="flex items-center gap-2">
                  <div className={C.ATTACH_THUMB}>
                    {isImageFilename(a.name) && a.url ? <img src={a.url} alt={a.name} className="w-full h-full object-cover" /> : a.name.slice(0,2)}
                  </div>
                  <div>{a.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button title="Download" onClick={() => onDownload?.(selected)} className="p-1 rounded hover:bg-gray-100"><Download size={14} /></button>
                  <button title="More" className="p-1 rounded hover:bg-gray-100"><MoreHorizontal size={14} /></button>
                </div>
              </div>
            )) : <div className="text-xs text-gray-500">No attachments</div>}
          </div>
        </div>

        <div className={C.COMMENTS_WRAPPER}>
          <div className={C.COMMENTS_TITLE}>Comments</div>
          <div className="space-y-2 mb-4">{/* comments */}</div>
        </div>
      </div>

      {/* sticky input */}
      <div className={`${C.COMMENT_INPUT_ROW} sticky bottom-0 bg-white z-10`}>
        <button className={C.COMMENT_BUTTON}><Plus size={14} /></button>
        <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className={C.COMMENT_INPUT} />
        <button onClick={() => onEdit?.(selected)} title="Edit" className="p-2 bg-gray-100 rounded"><UserPen size={14} /></button>
      </div>
    </div>
  );
}
