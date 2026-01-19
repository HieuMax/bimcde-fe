/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { MessageSquarePlus, Paperclip } from "lucide-react";
import { useState } from "react";

export default function ViewDetailPanel({
  view,
  onClose,
}: {
  view: any;
  onClose?: () => void;
}) {
  if (!view) return null;

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
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: string }[]
  >([]);

  return (
    <div className="w-80">
      <aside className="w-80 h-full bg-white shadow flex flex-col">
        {/* ===== Header ===== */}
        <div className="p-4 border-b border-gray-300 flex items-center justify-between">
          <div className="font-semibold text-lg">{view.name}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* ===== Scrollable content ===== */}
        <div className="flex-1 overflow-y-auto">
          {/* Thumbnail */}
          <div className="p-4">
            <div className="w-full h-full bg-gray-100 rounded overflow-hidden">
              {view.previewSrc && (
                <img
                  src={view.previewSrc}
                  className="w-full h-full object-cover"
                  alt={view.name}
                />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="px-4 text-sm space-y-3">
            <div>
              <div className="text-gray-500">Description</div>
              <div>{view.description ?? "--"}</div>
            </div>

            <div>
              <div className="text-gray-500">Created</div>
              <div>
                {view.createdOn} by {view.createdBy}
              </div>
            </div>

            <div>
              <div className="text-gray-500">Modified</div>
              <div>
                {view.modifiedOn} by {view.modifiedBy}
              </div>
            </div>

            <div>
              <div className="text-gray-500">
                Shared with ({view.sharedWith?.length ?? 0})
              </div>
              <div>--</div>
            </div>
          </div>
          {/* ===== ATTACHMENTS ===== */}
          <div className="mt-6 border-t border-gray-300 px-4 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Attachments</div>

              <label className="cursor-pointer text-gray-600 hover:text-blue-900">
                <Paperclip size={16} />
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => {
                    if (!e.target.files) return;
                    const files = Array.from(e.target.files).map((f) => ({
                      id: crypto.randomUUID(),
                      name: f.name,
                      size: f.size,
                    }));
                    setAttachments((prev) => [...files, ...prev]);
                  }}
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <div className="text-sm text-gray-400">No attachments</div>
            ) : (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-blue-600">
                      <Paperclip size={14} /> {a.name}
                    </div>

                    <button className="text-gray-400 hover:text-gray-700">
                      ⋮
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== COMMENTS LIST (CHỈ HIỆN KHI CÓ) ===== */}
          {comments.length > 0 && (
            <div className="mt-6 border-t border-gray-300 px-4 pt-4 space-y-4">
              <div className="text-gray-500 text-sm">Comments</div>

              {comments.map((c) => (
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

        {/* ===== COMMENT COMPOSER (BOTTOM) ===== */}
        <div className="border-t border-gray-300 p-4">
          {!isCommenting ? (
            <button
              onClick={() => setIsCommenting(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-800"
            >
              <span className="w-6 h-6 rounded text-blue-950 flex items-center justify-center">
                <MessageSquarePlus />
              </span>
              Add a comment…
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                autoFocus
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                className="w-full border border-slate-600 rounded px-3 py-2 text-sm resize-none
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Actions */}
              <div className="flex gap-2 items-center justify-end">
                <div className="flex gap-3 text-sm">
                  <label className="flex items-start gap-2 text-blue-900 cursor-pointer hover:underline">
                    <Paperclip size={18} />
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => {
                        if (!e.target.files) return;
                        setAttachments((prev) => [
                          ...prev,
                          ...Array.from(e.target.files),
                        ]);
                      }}
                    />
                  </label>

                  {attachments.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {attachments.length} file(s)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsCommenting(false);
                    setCommentText("");
                    setAttachments([]);
                  }}
                  className="px-3 py-1.5 items-end text-sm border rounded hover:bg-red-900 transition-colors hover:text-white"
                >
                  Cancel
                </button>

                <button
                  disabled={!commentText.trim()}
                  onClick={() => {
                    setComments((prev) => [
                      {
                        id: crypto.randomUUID(),
                        text: commentText.trim(),
                        author: "Hao Nguyen",
                        createdAt: new Date().toISOString(),
                        attachments: attachments.map((f) => ({
                          name: f.name,
                          size: f.size,
                        })),
                      },
                      ...prev,
                    ]);
                    setCommentText("");
                    setAttachments([]);
                    setIsCommenting(false);
                  }}
                  className="px-4 py-1.5 text-sm rounded bg-blue-600
                                text-white disabled:opacity-50 "
                >
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
