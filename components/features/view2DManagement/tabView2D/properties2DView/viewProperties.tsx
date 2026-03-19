'use client';

import { useState, useEffect } from 'react';
import { 
  Edit2, Paperclip, X, ArrowLeft, Save, Loader2,
  TagIcon,
  RotateCw
} from 'lucide-react';
import { view2DService } from '@/services/view2d.service';
import { useComments } from '@/components/features/explorer/hooks/useComments';
import CommentList  from '@/components/features/explorer/properties/components/comments/CommentList';
import CommentInput from '@/components/features/explorer/properties/components/comments/CommentInput';

import { RecipientSelector } from '@/components/features/release/RecipientSelector';
import { useTags } from '@/components/features/explorer/hooks/useTags';
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

export default function ViewDetailPanel({
  view,
  onClose,
  onUpdateSuccess,
  initialEditMode = false,
  projectId,
  onJumpToView,
  onUpdateSnapshot
}: {
  view: any;
  onClose?: () => void;
  onUpdateSuccess?: (updatedView: any) => void;
  initialEditMode?: boolean;
  projectId: string;
  onJumpToView?: () => void;
  onUpdateSnapshot?: () => Promise<void>;
}) {

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingSnapshot, setIsUpdatingSnapshot] = useState(false); 
  const [editForm, setEditForm] = useState({ 
    name: '', 
    description: '',
    shareWith: '',
    tags: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);

  const {
    comments,
    totalComments,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment,
    isAdding: isAddingComment,
    updateComment,
    deleteComment,
    currentUserId,
  } = useComments(view?._id || "", "view"); 

  const { tags: availableTags, isLoading: isTagsLoading } = useTags(projectId);  
  
  useEffect(() => {
    if (view) {
      setEditForm({
        name: view.name || '',
        description: view.description || '',
        shareWith: view.sharedWith?.join(', ') || '',
        // tags: view.tags?.join(', ') || ''
        tags: view.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || []
      });
      setIsEditing(initialEditMode);
    }
  }, [view, initialEditMode]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSaveDetails = async () => {
    if (!editForm.name.trim()) {
       alert("Title is required");
       return;
    }
    
    setLoading(true);
    try {
      const updated = await view2DService.updateView(view._id, { 
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        shareWithUser: editForm.shareWith,
        tags: editForm.tags,
        // TODO: Xử lý thêm shareWith và tags nếu API hỗ trợ
      });
      setIsEditing(false);
      onUpdateSuccess?.(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset lại form về giá trị ban đầu
    setEditForm({
      name: view?.name || '',
      description: view?.description || '',
      shareWith: view?.sharedWith?.join(', ') || '',
      // tags: view?.tags?.join(', ') || ''
      tags: view?.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || []
    });
  };

  const renderSharedWithNames = (sharedArray: any[]) => {
    if (!sharedArray || sharedArray.length === 0) return '--';
    return sharedArray.map((user: any) => {
      if (typeof user === 'string') return user;
      return user.fullName || user.name || user.email || 'Unknown';
    }).join(', ');
  };
  if (!view) return null;
  const cleanPreviewSrc = view.previewSrc?.split('#coords:')[0];

  if (isEditing) {
    return (
      <aside className="w-[320px] h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* HEADER: <- Edit ... X */}
        <header className="shrink-0 h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancelEdit} 
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-800">Edit</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* BODY: Form fields */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          <div className="px-4 pt-4">
          <div 
            className="relative h-[110px] rounded-md border border-gray-100 bg-gray-50 overflow-hidden group cursor-pointer"
            onClick={onJumpToView}
            title="Click to jump to this View position"
          >
            {cleanPreviewSrc ? (
              <img src={cleanPreviewSrc} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Paperclip size={18} /></div>
            )}
          </div>
        </div>
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Title (Required)
            </label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              autoFocus
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Description (Required)
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              rows={4}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              disabled={loading}
            />
          </div>

          {/* Share with */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Share with
            </label>
            <RecipientSelector
              projectId={projectId}
              onChange={(selectedIds, selectedOptions) => {
                setEditForm({
                  ...editForm,
                  shareWith: selectedIds.join(','), 
                });
              }}
            />
            {view?.sharedWith?.length > 0 && (
              <div className="mt-1 text-xs text-gray-400 truncate">
                Current: {view.sharedWith.join(', ')}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-gray-500 mb-1 flex items-center gap-1.5">
              <TagIcon size={14} /> Tags
            </label>
            
            <div className="p-3 border border-gray-200 rounded-sm bg-gray-50 flex flex-wrap gap-2 min-h-[60px]">
              {isTagsLoading ? (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Loading tags...
                </div>
              ) : availableTags?.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No tags available in this project.</div>
              ) : (
                availableTags?.map((tag: any) => {
                  const isSelected = editForm.tags.includes(tag._id);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag._id) });
                        } else {
                          setEditForm({ ...editForm, tags: [...editForm.tags, tag._id] });
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all"
                      style={{
                        backgroundColor: isSelected ? (tag.color || '#3b82f6') : 'white',
                        color: isSelected ? 'white' : '#4b5563',
                        borderColor: isSelected ? (tag.color || '#3b82f6') : '#d1d5db',
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: isSelected ? 'white' : (tag.color || '#000') }}
                      />
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Click to select/unselect tags</div>
          </div>
        </main>

        {/* FOOTER: Cancel | Save */}
        <footer className="shrink-0 border-t border-gray-200 bg-white p-4 flex items-center justify-end gap-4 z-40">
          <button
            onClick={handleCancelEdit}
            disabled={loading}
            className="text-sm font-semibold text-[#005a9e] hover:text-[#004578] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDetails}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#005a9e] rounded hover:bg-[#004578] transition-colors disabled:opacity-70 shadow-sm"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </footer>
      </aside>
    );
  }

  // ==========================================
  // GIAO DIỆN XEM CHI TIẾT (VIEW DETAIL)
  // ==========================================
  return (
    <aside className="w-[320px] h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* --- HEADER VIEW --- */}
      <header className="shrink-0 h-14 px-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-gray-800 truncate" title={view.name}>
            {view.name}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-[#005a9e] p-1.5 rounded transition-all"
            title="Edit View"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT (SCROLLABLE) --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">

        {/* Preview */}
        {/* Preview Image & Nút Cập Nhật */}
        <div className="pt-2">
          <div className="px-1">
            <div 
              className="relative h-[130px] border border-gray-200 bg-white overflow-hidden group cursor-pointer"
              onClick={onJumpToView}
              title="Click to jump to this View position"
            >
              {cleanPreviewSrc ? (
                <img src={cleanPreviewSrc} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Paperclip size={18} /></div>
              )}
            </div>
          </div>
          
          <div className="px-1 mt-1 flex">
            <button
              onClick={async () => {
                if (onUpdateSnapshot) {
                  setIsUpdatingSnapshot(true);
                  await onUpdateSnapshot();
                  setIsUpdatingSnapshot(false);
                }
              }}
              disabled={isUpdatingSnapshot}
              className="p-2 bg-[#e5e7eb] hover:bg-[#d1d5db] text-gray-700 rounded transition-colors disabled:opacity-50"
              title="Update view with current screen"
            >
              <RotateCw size={18} className={isUpdatingSnapshot ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-4 space-y-5">
          <section>
            <div className="text-[11px] text-gray-400 uppercase mb-1">
              Description
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {view.description || '—'}
            </div>
          </section>

          {view.tags && view.tags.length > 0 && (
            <section>
               <div className="text-[11px] text-gray-400 uppercase mb-1">Tags</div>
               <div className="flex flex-wrap gap-1.5">
                 {view.tags.map((t: any) => {
                    const tagId = typeof t === 'string' ? t : t._id;
                    const foundTag = availableTags?.find((at: any) => at._id === tagId);
                    const tagName = foundTag?.name || (typeof t === 'string' ? t : t.name) || 'Unknown Tag';
                    const tagColor = foundTag?.color || '#9ca3af';

                    return (
                      <span 
                        key={tagId} 
                        className="px-2 py-0.5 text-[10px] font-semibold rounded text-white shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: tagColor }}
                      >
                        <TagIcon size={10} />
                        {tagName}
                      </span>
                    );
                 })}
               </div>
            </section>
          )}

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
              <div className="text-[11px] text-[#005a9e] uppercase">
                Shared with ({view.sharedWith?.length || 0})
              </div>
              <div className="text-sm text-gray-800 font-medium">
                {renderSharedWithNames(view.sharedWith)}
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

          {/* Comments Section */}
          <section className="pt-4 pb-8 border-t border-gray-100">
            <SectionHeader title="Comments"/>
            <div className="mt-3">
              <CommentList
                comments={comments}
                totalComments={totalComments}
                isLoading={isCommentsLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                currentUserId={currentUserId}
                onUpdate={updateComment}
                onDelete={deleteComment}
              />
            </div>
          </section>

        </div>
      </main>

      {/* --- FOOTER / COMMENT BOX --- */}
      <footer className="shrink-0 border-t border-gray-100 bg-white z-40">
        <CommentInput
          value={commentInput}
          onChange={setCommentInput}
          onSend={addComment}
          isSending={isAddingComment}
        />
      </footer>
    </aside>
  );
}