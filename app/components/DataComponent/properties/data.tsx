// app/components/PropertiesPanel.tsx
'use client';

import React, { useState } from 'react';
import { X, MoreHorizontal, Download, UserPen, MoreVertical, Plus } from 'lucide-react';

import * as C from '../../UI/pannelClassName'

type Attachment = { id: string; name: string; url?: string };
type Selected = {
  id: string;
  name?: string;
  description?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
  size?: string;
  fileType?: string;
  attachments?: Attachment[];
  thumbnail?: string;
  type?: string;
};

export default function PropertiesPanel({
  selected,
  onClose,
  onDownload,
  onPermission,
}: {
  selected: Selected | null;
  onClose?: () => void;
  onDownload?: (s: Selected) => void;
  onPermission?: (s: Selected) => void;
  onShare?: (s: Selected) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  if (!selected) return <div className={C.PANEL_WRAPPER}>No selection</div>;

  return (
    <div className={C.PANEL_WRAPPER}>
      {/* Header */}
      <div className={C.PANEL_HEADER}>
        <div className="flex-1 min-w-0">
          <div className={C.PANEL_HEADER_TITLE}>{selected.type ?? 'File'}</div>
          <h3 className={C.PANEL_HEADER_MAIN}>{selected.name ?? ''}</h3>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button onClick={() => setMoreOpen(!moreOpen)} className={C.ACTION_ICON_BTN}><MoreHorizontal size={16} /></button>
          <button onClick={() => onClose?.()} className="p-1 rounded hover:bg-gray-100 text-gray-600"><X size={18} /></button>
        </div>
      </div>

      {/* Preview + actions (keeps fixed) */}
      <div className={C.PREVIEW_CONTAINER}>
        <div className={C.PREVIEW_WRAPPER}>
          {selected.thumbnail ? <img src={selected.thumbnail} alt={selected.name} className={C.PREVIEW_IMG} /> :
            <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">No preview available</div>}
        </div>

        <div className={C.ACTION_ROW}>
          <div className="flex-1">
            <button className={C.ACTION_PRIMARY}>Download</button>
          </div>
          <button className={C.ACTION_ICON_BTN}><UserPen size={16} /></button>
          <button className={C.ACTION_ICON_BTN}><MoreVertical size={16} /></button>
        </div>
      </div>

      {/* ===== Content scroll wrapper: DETAILS + ATTACHMENTS + COMMENTS =====
          This is the key: make this area take remaining height and scroll internally.
      */}
      <div className="flex-1 overflow-y-auto min-h-0 px-0 py-0 side-panel-scrollbar">
        <div className={C.DETAILS_SECTION}>
          <div className={C.DETAILS_TITLE}>Details</div>
          <div className={C.DETAILS_LIST}>
            <div>
              <div className={C.DETAILS_LABEL}>Description</div>
              <div className={C.DETAILS_VALUE}>{selected.description ?? '--'}</div>
            </div>
            <div>
              <div className={C.DETAILS_LABEL}>File type</div>
              <div className={C.DETAILS_VALUE}>{selected.fileType ?? '--'}</div>
            </div>
            <div>
              <div className={C.DETAILS_LABEL}>Size</div>
              <div className={C.DETAILS_VALUE}>{selected.size ?? '--'}</div>
            </div>
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

        <div className={C.ATTACH_SECTION}>
          <div className="flex items-center justify-between">
            <div className={C.DETAILS_TITLE}>Attachments</div>
            <div className="flex items-center gap-2">
              <button title="Download" className="p-1 rounded hover:bg-gray-100" onClick={() => onDownload?.(selected)}><Download size={16} /></button>
              <button title="Permissions" className="p-1 rounded hover:bg-gray-100" onClick={() => onPermission?.(selected)}><MoreHorizontal size={16} /></button>
            </div>
          </div>

          <div className={C.ATTACH_LIST}>
            {(selected.attachments && selected.attachments.length > 0) ?
              selected.attachments.map(a => (
                <div key={a.id} className={C.ATTACH_ITEM}>
                  <div className="flex items-center gap-2">
                    <div className={C.ATTACH_THUMB}>
                      {a.url ? <img src={a.url} alt={a.name} className="w-full h-full object-cover" /> : a.name.slice(0,2)}
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
          <div className="space-y-2 mb-4">{/* comments list */}</div>
        </div>
      </div>

      {/* Comment input (sticky bottom) */}
      <div className={`${C.COMMENT_INPUT_ROW} sticky bottom-0 bg-white z-10`}>
        <button className={C.COMMENT_BUTTON}><Plus size={14} /></button>
        <input placeholder="Add a comment..." className={C.COMMENT_INPUT} />
        <button className="p-2 bg-gray-100 rounded"><UserPen size={14} /></button>
      </div>
    </div>
  );
}
