'use client';

import { 
  MessageSquarePlus, Paperclip, X, Edit2, ArrowLeft, Save, Loader2, Plus, MoreVertical,
  TagIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApi } from '@/app/hooks/useApi';

import { useComments } from '@/components/features/explorer/hooks/useComments';
import CommentList from '@/components/features/explorer/properties/components/comments/CommentList';
import CommentInput from '@/components/features/explorer/properties/components/comments/CommentInput';
import { todo2DService } from '@/services/todo2d.service';
import { RecipientSelector, RecipientOption } from '@/components/features/release/RecipientSelector';
import { useTags } from '@/components/features/explorer/hooks/useTags';

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export default function TodoDetailPanel({
  todo,
  projectId, // 👈 THÊM PROP NÀY ĐỂ TRUYỀN VÀO RECIPIENT SELECTOR
  onClose,
  onUpdateSuccess,
  initialEditMode = false
}: {
  todo: any;
  projectId: string; // Khai báo type
  onClose: () => void;
  onUpdateSuccess?: (updatedTodo: any) => void;
  initialEditMode?: boolean;
}) {

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: '',
    priority: 'Normal',
    status: 'Open',
    completion: 0,
    assignees: [] as string[], // Changed to array of IDs
    tags: [] as string[]
  });

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
  } = useComments(todo?._id || todo?.id || "", "todo" as any);

  const { tags: availableTags, isLoading: isTagsLoading } = useTags(projectId);
  const api = useApi();
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch project members for name mapping
  useEffect(() => {
    if (!projectId) return;
    
    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const response = await api.get(`/projects/${projectId}/members`);
        setProjectMembers(response.result || []);
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setMembersLoading(false);
      }
    };
    
    fetchMembers();
  }, [projectId]);

  // Helper: Get member name from ID
  const getMemberName = (userId: string | any) => {
    if (!userId) return 'Unknown';
    const id = typeof userId === 'string' ? userId : userId._id;
    const member = projectMembers.find(m => m.userId === id);
    return member?.fullName || member?.name || 'Unknown';
  };

  useEffect(() => {
    if (todo) {
      // Extract assignees as array of IDs safely
      const assigneesArray = Array.isArray(todo.assignees) ? todo.assignees : 
                            (todo.assignee ? [todo.assignee] : []);
      setEditForm({
        title: todo.title || '',
        description: todo.description || '',
        dueDate: formatDateForInput(todo.dueDate),
        type: todo.type || 'Undefined',
        priority: todo.priority || 'Normal',
        status: todo.status || 'New',
        completion: todo.completion || 0,
        assignees: assigneesArray.map(a => typeof a === 'string' ? a : a._id),
        tags: todo.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || []
      });
      setIsEditing(initialEditMode);
    }
  }, [todo, initialEditMode]);

  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: number }[]
  >([]);

  if (!todo) return null;

  const priorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Normal': return 'bg-[#005a9e]'; // Màu xanh khớp với ảnh
      case 'Low': return 'bg-gray-400';
      default: return 'bg-[#005a9e]';
    }
  };

  const handleSaveDetails = async () => {
    if (!editForm.title.trim()) {
      alert("Title is required!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        dueDate: editForm.dueDate || undefined,
        type: editForm.type.trim(),
        priority: editForm.priority,
        status: editForm.status,
        completion: Number(editForm.completion),
        // Support both assignees (array) and assignee (string) for backward compatibility
        assignees: editForm.assignees,
        assignee: editForm.assignees[0] || undefined,
        tags: editForm.tags
      };

      const updated = await todo2DService.updateTodo(todo._id || todo.id, payload);
      setIsEditing(false);
      onUpdateSuccess?.(updated);
    } catch (error) {
      console.error("Update Todo failed:", error);
      alert("Failed to update Todo");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const assigneesArray = Array.isArray(todo.assignees) ? todo.assignees : 
                          (todo.assignee ? [todo.assignee] : []);
    setEditForm({
      title: todo.title || '',
      description: todo.description || '',
      dueDate: formatDateForInput(todo.dueDate),
      type: todo.type || 'Undefined',
      priority: todo.priority || 'Normal',
      status: todo.status || 'New',
      completion: todo.completion || 0,
      assignees: assigneesArray.map(a => typeof a === 'string' ? a : a._id),
      tags: todo.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || []
    });
  };

  // ==========================================
  // GIAO DIỆN EDIT (SỬA LẠI ĐỂ CÓ RECIPIENT SELECTOR)
  // ==========================================
  if (isEditing) {
    return (
      <aside className="w-80 h-full bg-white border-l border-gray-300 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <header className="shrink-0 h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-800">Edit Todo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Title (Required)</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              autoFocus
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Description (Required)</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Due date</label>
            <input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Type</label>
            <select
              value={editForm.type}
              onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Comment">Comment</option>
              <option value="Undefined">Undefined</option>
              <option value="Issue">Issue</option>
              <option value="Request">Request</option>
              <option value="Fault">Fault</option>
              <option value="Inquiry">Inquiry</option>
              <option value="Solution">Solution</option>
              <option value="Clash">Clash</option>
              <option value="Remark">Remark</option>
                           
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Priority</label>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Completion %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editForm.completion}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                setEditForm({ ...editForm, completion: value });
              }}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* ===== ASSIGNEE (RecipientSelector) ===== */}
          <div>
            <label className="block mb-1 text-sm text-gray-500">
              Assigned To ({editForm.assignees.length})
            </label>
            <RecipientSelector
              projectId={projectId}
              initialOptions={editForm.assignees.map(id => ({
                id,
                label: getMemberName(id),
                type: 'USER' as const,
              }))}
              onChange={(selectedIds) => {
                setEditForm({
                  ...editForm,
                  assignees: selectedIds,
                });
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1 flex items-center gap-1.5">
              <TagIcon size={14} /> Tags
            </label>
            
            <div className="p-3 border border-gray-300 rounded-sm bg-gray-50 flex flex-wrap gap-2 min-h-[60px]">
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
  // GIAO DIỆN XEM CHI TIẾT (KHỚP VỚI ẢNH BẠN ĐƯA)
  // ==========================================
  return (
    <aside className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* ===== HEADER ===== */}
      <div className="p-4 border-b border-gray-200 flex items-start justify-between bg-white sticky top-0 z-30">
        <div className="flex-1 pr-4">
          <div className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {todo.code || 'THEB-16'}
          </div>
          <div className="font-semibold text-lg text-gray-800 leading-tight">
            {todo.title || '10deg'}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-[#005a9e] p-1 rounded transition-all"
            title="Edit Todo"
          >
            <Edit2 size={16} />
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ===== DETAILS ===== */}
        <div className="p-4 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-2">Details</h3>

          <div className="space-y-4">
            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Description</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {todo.description || '--'}
              </div>
            </div>

              {todo.tags && todo.tags.length > 0 && (
              <div>
                <div className="text-[13px] text-gray-500 mb-1">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {todo.tags.map((t: any) => {
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
              </div>
            )}
            
            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Due date</div>
              <div className="text-sm text-gray-800">
                {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '--'}
              </div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Type</div>
              <div className="text-sm text-gray-800">{todo.type || 'Undefined'}</div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Priority</div>
              <div className="flex items-center gap-1.5 text-sm text-gray-800">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityColor(todo.priority)}`} />
                {todo.priority || 'Normal'}
              </div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Status</div>
              <div className="text-sm text-gray-800">{todo.status || 'New'}</div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Completion %</div>
              <div className="text-sm text-gray-800">{todo.completion ?? 0}</div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Assigned To ({(() => {
                const assigneesArray = Array.isArray(todo.assignees) ? todo.assignees : 
                                      (todo.assignee ? [todo.assignee] : []);
                return assigneesArray.length;
              })()})</div>
              <div className="text-sm text-gray-800">
                {(() => {
                  const assigneesArray = Array.isArray(todo.assignees) ? todo.assignees : 
                                        (todo.assignee ? [todo.assignee] : []);
                  if (assigneesArray.length === 0) {
                    return '--';
                  }
                  return assigneesArray.map((user: any, index: number) => {
                    const name = getMemberName(user);
                    return (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 rounded px-1.5 py-0.5 text-xs mr-1"
                      >
                        {name}
                      </span>
                    );
                  });
                })()}
              </div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Created</div>
              <div className="text-sm text-gray-800">
                {todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'} By{' '}
                {typeof todo.createdBy === 'string' ? todo.createdBy : todo.createdBy?.fullName || 'Unknown'}
              </div>
            </div>

            <div>
              <div className="text-[13px] text-gray-500 mb-0.5">Modified</div>
              <div className="text-sm text-gray-800">
                {todo.updatedAt ? new Date(todo.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'} By{" "}
                {typeof todo.updatedBy === 'string' ? todo.updatedBy : todo.updatedBy?.fullName || '--'}
              </div>
            </div>
          </div>
        </div>

        {/* ===== ATTACHMENTS ===== */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-gray-800">Attachments</h3>
            <div className="flex items-center gap-2 text-gray-500">
              <label className="cursor-pointer hover:text-gray-800 transition-colors p-1">
                <Plus size={18} />
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
              <button className="hover:text-gray-800 transition-colors p-1">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div className="text-sm text-gray-400 italic">No attachments</div>
          ) : (
            <div className="space-y-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 text-gray-800 truncate pr-2">
                    <span className="truncate">{a.name}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-700 shrink-0">
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== COMMENTS LIST ===== */}
        <div className="border-t border-gray-200 pt-4 pb-4">
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
      </div>

      {/* ===== COMMENT COMPOSER ===== */}
      <div className="border-t border-gray-200 bg-white z-10 shrink-0">
        <CommentInput
          value={commentInput}
          onChange={setCommentInput}
          onSend={addComment}
          isSending={isAddingComment}
        />
      </div>
    </aside>
  );
}