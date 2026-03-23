'use client';

import { MessageSquarePlus, Paperclip } from 'lucide-react';
import { useState } from 'react';

export default function TodoDetailPanel({
  todo,
  onClose,
}: {
  todo: any;
  onClose: () => void;
}) {
  if (!todo) return null;

  /* ===== STATE ===== */
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: number }[]
  >([]);

  const [comments, setComments] = useState<
    {
      id: string;
      text: string;
      author: string;
      createdAt: string;
      attachments?: { name: string; size: number }[];
    }[]
  >([]);

  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

  return (
    <aside className="w-80 h-full bg-white border-l border-gray-300 flex flex-col">
      {/* ===== Header ===== */}
      <div className="p-4 border-b border-gray-300 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">{todo.code}</div>
          <div className="font-semibold text-lg">{todo.title}</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          ✕
        </button>
      </div>

      {/* ===== Scrollable content ===== */}
      <div className="flex-1 overflow-y-auto">
        {/* Body */}
        <div className="p-4 text-sm space-y-3">
          <div>
            <div className="text-gray-500">Status</div>
            <div>{todo.status}</div>
          </div>

          <div>
            <div className="text-gray-500">Assigned to</div>
            <div>{todo.assignee ?? 'Unassigned'}</div>
          </div>

          <div>
            <div className="text-gray-500">Created by</div>
            <div>{todo.createdBy}</div>
          </div>
        </div>

        {/* ===== ATTACHMENTS ===== */}
        <div className="mt-4 border-t px-4 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-gray-600 text-sm">Attachments</div>

            <label className="cursor-pointer text-blue-900 hover:text-blue-700">
              <Paperclip size={16}/>
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  if (!e.target.files) return;
                  const files = Array.from(e.target.files).map(f => ({
                    id: crypto.randomUUID(),
                    name: f.name,
                    size: f.size,
                  }));
                  setAttachments(prev => [...files, ...prev]);
                }}
              />
            </label>
          </div>

          {attachments.length === 0 ? (
            <div className="text-sm text-gray-400">No attachments</div>
          ) : (
            <div className="space-y-2">
              {attachments.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-blue-600">
                    <Paperclip/> {a.name}
                  </div>
                  <button className="text-gray-400 hover:text-gray-700">
                    ⋮
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== COMMENTS LIST ===== */}
        {comments.length > 0 && (
          <div className="mt-6 border-t px-4 pt-4 space-y-4">
            <div className="text-gray-500 text-sm">Comments</div>

            {comments.map(c => (
              <div key={c.id} className="text-sm">
                <div className="font-medium text-gray-800">{c.author}</div>
                <div className="text-gray-700 mt-1">{c.text}</div>

                {c.attachments && c.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {c.attachments.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        📎 {a.name}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-1">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== COMMENT COMPOSER ===== */}
      <div className="border-t p-4">
        {!isCommenting ? (
          <button
            onClick={() => setIsCommenting(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <span className="w-6 h-6 rounded text-blue-900 flex items-center justify-center">
              <MessageSquarePlus/>
            </span>
            Add a comment…
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              autoFocus
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Comment attachments */}
            <div className="flex justify-end gap-2">
              <div className="flex items-center gap-3 text-sm">
              
                <label className="flex items-center gap-2 text-blue-900 cursor-pointer hover:underline">
                  <Paperclip size={16} />
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      if (!e.target.files) return;
                      setCommentAttachments(prev => [
                        ...prev,
                        ...Array.from(e.target.files),
                      ]);
                    }}
                  />
                </label>

                {commentAttachments.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {commentAttachments.length} file(s)
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setIsCommenting(false);
                  setCommentText('');
                  setCommentAttachments([]);
                }}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                disabled={!commentText.trim()}
                onClick={() => {
                  setComments(prev => [
                    {
                      id: crypto.randomUUID(),
                      text: commentText.trim(),
                      author: 'loc loc',
                      createdAt: new Date().toISOString(),
                      attachments: commentAttachments.map(f => ({
                        name: f.name,
                        size: f.size,
                      })),
                    },
                    ...prev,
                  ]);
                  setCommentText('');
                  setCommentAttachments([]);
                  setIsCommenting(false);
                }}
                className="px-4 py-1.5 text-sm rounded bg-blue-600
                           text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
