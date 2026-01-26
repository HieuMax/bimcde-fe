'use client';

import { useState, useEffect } from 'react';
import { 
  Edit2, MessageSquarePlus, Paperclip, 
  X, Send} from 'lucide-react';
import { viewService } from '@/services/view.service';

// --- Types ---
interface Attachment {
  id: string;
  name: string;
  size: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  attachments?: Attachment[];
}

// --- Sub-components ---

const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
    {children}
  </div>
);

const DetailItem = ({ label, value, subValue }: { label: string; value: string; subValue?: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-tight">{label}</span>
    <span className="text-sm text-gray-700 font-medium truncate">{value || '--'}</span>
    {subValue && <span className="text-[10px] text-gray-400">{subValue}</span>}
  </div>
);

export default function ViewDetailPanel({
  view,
  onClose,
  onUpdateSuccess
}: {
  view: any;
  onClose?: () => void;
  onUpdateSuccess?: (updatedView: any) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (view) {
      setTempName(view.name || '');
      setIsEditingName(false);
    }
  }, [view]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUpdateName = async () => {
    if (!tempName.trim() || tempName === view?.name) {
      setIsEditingName(false);
      setTempName(view?.name || '');
      return;
    }
    setLoading(true);
    try {
      const updated = await viewService.updateView(view._id, { name: tempName.trim() });
      setIsEditingName(false);
      onUpdateSuccess?.(updated);
    } catch (error) {
      console.error(error);
      setTempName(view?.name || '');
    } finally {
      setLoading(false);
    }
  };

  if (!view) return null;

  return (
    <aside className="w-[320px] h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* --- HEADER --- */}
      <header className="shrink-0 h-14 px-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex-1 min-w-0 pr-4">
          {isEditingName ? (
            <div className="flex items-center gap-2 group">
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                onBlur={handleUpdateName}
                autoFocus
                className="w-full text-sm font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent py-0.5"
                disabled={loading}
              />
            </div>
          ) : (
            <div 
              className="group flex items-center gap-2 cursor-pointer transition-all"
              onClick={() => setIsEditingName(true)}
            >
              <h2 className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600">
                {tempName}
              </h2>
              <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </header>

      {/* --- MAIN CONTENT (SCROLLABLE) --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">

      {/* Preview */}
      <div className="px-4 pt-4">
        <div className="relative h-[110px] rounded-md border border-gray-100 bg-gray-50 overflow-hidden">
          {view.previewSrc ? (
            <img
              src={view.previewSrc}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Paperclip size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-5">

        {/* Description */}
        <section>
          <div className="text-[11px] text-gray-400 uppercase mb-1">
            Description
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {view.description || '—'}
          </div>
        </section>

        {/* Details */}
        <section className="space-y-3">
          <div>
            <div className="text-[11px] text-gray-400 uppercase">Created</div>
            <div className="text-sm text-gray-700">
              {new Date(view.createdAt).toLocaleDateString()} By{' '}
              {typeof view.createdBy === 'string'
                ? view.createdBy
                : (view.createdBy as any)?.fullName || 'Unknown'}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-400 uppercase">Modified</div>
            <div className="text-sm text-gray-700">
              {new Date(view.updatedAt || view.createdAt).toLocaleDateString()} By{' '}
              {typeof view.updatedBy === 'string'
                ? view.updatedBy
                : (view.updatedBy as any)?.fullName || 'Unknown'}

            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-400 uppercase">Shared with</div>
            <div className="text-sm text-gray-700">
              {view.sharedWith?.length || 0}
            </div>
          </div>
        </section>

        {/* Attachments */}
        {view.attachments?.length > 0 && (
          <section className="pt-2">
            <SectionHeader title="View Attachments" />
            <div className="space-y-1">
              {view.attachments.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md border border-gray-100 bg-white text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[11px] text-gray-400">
                    {formatSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <section className="pt-4 pb-8">
            <SectionHeader title={`Comments (${comments.length})`} />
            <div className="space-y-4 mt-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {c.author.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-gray-900">
                        {c.author}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">
                      {c.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>

      {/* --- FOOTER / COMMENT BOX --- */}
      <footer className="shrink-0 border-t border-gray-100 bg-white p-4 z-40">
        {!isCommenting ? (
          <button
            onClick={() => setIsCommenting(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 group"
          >
            <MessageSquarePlus size={16} className="group-hover:text-blue-500" />
            <span className="text-xs font-medium">Add a comment...</span>
          </button>
        ) : (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative">
              <textarea
                autoFocus
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="What do you think?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors">
                <Paperclip size={18} />
                <input type="file" multiple hidden onChange={(e) => {
                  if (!e.target.files) return;
                  const newFiles = Array.from(e.target.files).map(f => ({
                    id: crypto.randomUUID(), name: f.name, size: f.size
                  }));
                  setAttachments(prev => [...prev, ...newFiles]);
                  e.target.value = '';
                }} />
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => { setIsCommenting(false); setCommentText(''); setAttachments([]); }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!commentText.trim()}
                  onClick={() => {
                    const newComment = {
                      id: crypto.randomUUID(),
                      text: commentText.trim(),
                      author: 'You',
                      createdAt: new Date().toISOString(),
                      attachments: [...attachments],
                    };
                    setComments(prev => [newComment, ...prev]);
                    setCommentText(''); setAttachments([]); setIsCommenting(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </footer>
    </aside>
  );
}
