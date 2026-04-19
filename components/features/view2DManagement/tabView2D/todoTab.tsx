'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  ChevronUp,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { TodoItem } from '@/types/explorer';
import { useApi } from '@/app/hooks/useApi';

export default function TodosTab({
  todos,
  projectId,
  currentUser,
  onSelectTodo,
  onCreateTodo,
  onDeleteTodo,
}: {
  todos: TodoItem[];
  projectId?: string;
  currentUser: string;
  onSelectTodo: (todo: TodoItem) => void;
  onCreateTodo: () => void;
  onDeleteTodo?: (todoId: string) => void;
}) {
  const api = useApi();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [closedExpanded, setClosedExpanded] = useState(true);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<
    { userId?: string; fullName?: string; name?: string }[]
  >([]);

  /**
   * Toàn bộ todo 2D trong project (API).
   * null = chưa có projectId; [] có thể là đang tải xong nhưng rỗng — khi có projectId,
   * mergedTodos vẫn overlay `todos` từ parent cho đến khi API trả về.
   */
  const [projectTodos, setProjectTodos] = useState<TodoItem[] | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProjectTodos(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/todos2d/project/${projectId}`);
        if (!cancelled) setProjectTodos(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProjectTodos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // todos.length: refetch sau tạo/xóa ở parent để danh sách đồng bộ
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useApi stable enough for this screen
  }, [projectId, todos.length]);

  /** Gộp todo toàn project + bản cục bộ từ parent (ưu tiên field mới hơn từ parent) */
  const mergedTodos = useMemo(() => {
    if (!projectId) return todos;
    if (projectTodos === null) return todos;
    const map = new Map<string, TodoItem>();
    for (const t of projectTodos) {
      if (t?._id) map.set(t._id, t);
    }
    for (const t of todos) {
      if (!t?._id) continue;
      const prev = map.get(t._id);
      map.set(t._id, prev ? { ...prev, ...t } : t);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [projectId, projectTodos, todos]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get(`/projects/${projectId}/members`);
        if (!cancelled) setProjectMembers(response.result || []);
      } catch {
        if (!cancelled) setProjectMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useApi returns new object each render
  }, [projectId]);

  const getMemberName = (userId: string | undefined) => {
    if (!userId) return '';
    const member = projectMembers.find((m) => m.userId === userId);
    return member?.fullName || member?.name || '';
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'New':
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: <HelpCircle size={12} />,
        };
      case 'Done':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: <CheckCircle2 size={12} />,
        };
      case 'In Progress':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <Clock size={12} />,
        };
      case 'Closed':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-200',
          icon: <CheckCircle2 size={12} />,
        };
      case 'On Hold':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          icon: <AlertCircle size={12} />,
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          icon: <HelpCircle size={12} />,
        };
    }
  };

  const getPriorityDotColor = (p?: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-red-500 shadow-sm shadow-red-200';
      case 'High':
        return 'bg-orange-500 shadow-sm shadow-orange-200';
      case 'Normal':
        return 'bg-blue-500';
      case 'Low':
        return 'bg-slate-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getTodoCode = (todo: TodoItem) => {
    const c = todo.code?.trim();
    if (c) return c;
    return '—';
  };

  /** Tên file khi API populate; không có thì null. */
  const getLinkedFileLabel = (todo: TodoItem): string | null => {
    const f = todo.fileId;
    if (f && typeof f === 'object' && 'name' in f && (f as { name?: string }).name?.trim()) {
      return (f as { name: string }).name.trim();
    }
    return null;
  };

  const getAssigneeIds = (todo: TodoItem): string[] => {
    if (Array.isArray(todo.assignees) && todo.assignees.length > 0) {
      return todo.assignees
        .map((a) => (typeof a === 'string' ? a : (a as { _id?: string })?._id))
        .filter(Boolean) as string[];
    }
    if (todo.assignee) {
      const id =
        typeof todo.assignee === 'string'
          ? todo.assignee
          : (todo.assignee as { _id?: string })?._id;
      return id ? [id] : [];
    }
    return [];
  };

  /** "Assigned to …" với tên (nếu resolve được), hoặc "Unassigned". */
  const getAssignmentLine = (todo: TodoItem) => {
    const ids = getAssigneeIds(todo);
    if (ids.length === 0) return 'Unassigned';
    const names = ids.map((id) => getMemberName(id) || id);
    return `Assigned to ${names.join(', ')}`;
  };

  const filtered = mergedTodos.filter((t) => {
    const matchUser =
      filter === 'mine'
        ? getAssigneeIds(t).some((id) => {
            const name = getMemberName(id);
            return id === currentUser || name === currentUser;
          })
        : true;
    const q = searchQuery.toLowerCase();
    const fileQ = (getLinkedFileLabel(t) || '').toLowerCase();
    const matchSearch =
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      getTodoCode(t).toLowerCase().includes(q) ||
      fileQ.includes(q);
    return matchUser && matchSearch;
  });

  const activeTodos = filtered.filter((t) => t.status !== 'Closed');
  const closedTodos = filtered.filter((t) => t.status === 'Closed');

  const renderTodoMenu = (t: TodoItem, compact = false) => (
    <div
      className={`absolute right-1 ${compact ? 'top-3' : 'top-2'} ${
        activeMenuId === t._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } transition-opacity`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveMenuId(activeMenuId === t._id ? null : t._id);
        }}
        className="p-1 rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700"
      >
        <MoreVertical size={16} />
      </button>

      {activeMenuId === t._id && (
        <div
          className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onSelectTodo(t);
              setActiveMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
          >
            <Edit size={12} /> Edit
          </button>
          <button
            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
            onClick={() => setActiveMenuId(null)}
          >
            <Share2 size={12} /> Share
          </button>
          <div className="h-[1px] bg-gray-100 my-0.5" />
          <button
            onClick={() => {
              if (confirm(`Delete "${t.title}"?`)) {
                onDeleteTodo?.(t._id);
              }
              setActiveMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );

  const renderTodoBody = (t: TodoItem, compactClosed = false) => {
    const style = getStatusStyle(t.status);
    const desc = (t.description || '').trim();
    const fileLabel = getLinkedFileLabel(t);

    return (
      <>
        <div className="flex items-center justify-between mb-1.5">
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {style.icon} {t.status || 'Open'}
          </div>
          <div
            className="flex items-center gap-1.5"
            title={`Priority: ${t.priority || 'Normal'}`}
          >
            <div
              className={`${compactClosed ? 'h-5 w-5' : 'w-2.5 h-2.5'} rounded-full ${getPriorityDotColor(t.priority)} ring-1 ring-white shrink-0`}
            />
          </div>
        </div>

        <div className="text-[11px] font-mono text-gray-500 mb-0.5">{getTodoCode(t)}</div>

        {fileLabel ? (
          <div
            className="text-[10px] text-gray-500 truncate mb-1 flex items-center gap-1 min-w-0"
            title={fileLabel}
          >
            <FileText size={10} className="shrink-0 opacity-70" />
            <span className="truncate">{fileLabel}</span>
          </div>
        ) : null}

        <div
          className={`${compactClosed ? 'text-[14px]' : 'text-sm'} font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors`}
        >
          {t.title}
        </div>

        {desc ? (
          <div className="text-[11px] text-gray-600 line-clamp-2 mb-1.5 leading-snug">{desc}</div>
        ) : (
          <div className="text-[11px] text-gray-400 italic mb-1.5">No description</div>
        )}

        <div className="text-[11px] text-gray-700 mb-1.5">
          {getAssignmentLine(t)}
        </div>

        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
          <div className="flex items-center gap-1 min-w-0">
            <User size={10} />
            <span className="truncate max-w-[100px]">
              {typeof t.createdBy === 'string'
                ? t.createdBy
                : (t.createdBy as unknown as { fullName?: string } | undefined)?.fullName ||
                  'Unknown'}
            </span>
          </div>
          {t.dueDate && (
            <div
              className={`flex items-center gap-1 shrink-0 ${
                new Date(t.dueDate) < new Date() ? 'text-red-500 font-medium' : ''
              }`}
            >
              <Calendar size={10} />
              <span>{new Date(t.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {t.completion !== undefined && t.completion > 0 && (
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${t.completion}%` }} />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-700">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            ToDos ({mergedTodos.length})
          </h3>
        </div>
        <button
          onClick={onCreateTodo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span className="text-xs font-bold">New</span>
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search todos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-gray-400" />
          <select
            className="flex-1 bg-transparent text-xs font-medium text-gray-600 focus:outline-none cursor-pointer hover:text-blue-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'mine')}
          >
            <option value="all">All ToDos</option>
            <option value="mine">Assigned to me</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
            <CheckCircle2 size={24} strokeWidth={1.5} className="opacity-20" />
            <span className="text-xs">No tasks found</span>
          </div>
        ) : (
          <>
            {activeTodos.map((t) => (
              <div
                key={t._id}
                onClick={() => onSelectTodo(t)}
                className="group cursor-pointer rounded-lg border border-transparent border-b-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all bg-white p-3 relative pr-8"
              >
                {renderTodoBody(t, false)}
                {renderTodoMenu(t)}
              </div>
            ))}

            <div className="pt-1">
              <button
                onClick={() => setClosedExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-gray-200 text-left text-[15px] font-semibold text-[#1f2a44] bg-white"
              >
                <span>Closed ({closedTodos.length})</span>
                {closedExpanded ? (
                  <ChevronUp size={16} className="text-[#5b6478]" />
                ) : (
                  <ChevronDown size={16} className="text-[#5b6478]" />
                )}
              </button>

              {closedExpanded && (
                <div className="bg-white">
                  {closedTodos.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400 italic">No closed tasks</div>
                  ) : (
                    closedTodos.map((t, index) => (
                      <div
                        key={t._id}
                        onClick={() => onSelectTodo(t)}
                        className={`group relative cursor-pointer px-4 py-3 transition-colors hover:bg-[#f3f5fb] ${
                          index === 0 ? 'bg-[#f3f5fb]' : 'bg-white'
                        } ${index < closedTodos.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="min-w-0 flex-1 pr-6">{renderTodoBody(t, true)}</div>
                        {renderTodoMenu(t, true)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
