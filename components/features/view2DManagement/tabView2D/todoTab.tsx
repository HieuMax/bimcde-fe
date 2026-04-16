'use client';
import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Calendar, 
    User, AlertCircle, CheckCircle2, Clock, HelpCircle,
    MoreVertical, Trash2, Edit, Share2, ChevronUp, ChevronDown
} from 'lucide-react';
import { TodoItem } from '@/types/explorer';

export default function TodosTab({
  todos,
  currentUser,
  onSelectTodo,
  onCreateTodo,
  onDeleteTodo,
}: {
  todos: TodoItem[];
  currentUser: string;
  onSelectTodo: (todo: TodoItem) => void;
  onCreateTodo: () => void;
  onDeleteTodo?: (todoId: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [closedExpanded, setClosedExpanded] = useState(true);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const getStatusStyle = (status?: string) => {
      switch(status) {
          case 'New': return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: <HelpCircle size={12}/> };
          case 'Done': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle2 size={12}/> };
          case 'In Progress': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Clock size={12}/> };
          case 'Closed': return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: <CheckCircle2 size={12}/> };
          case 'On Hold': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <AlertCircle size={12}/> };
          default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: <HelpCircle size={12}/> };
      }
  }

  const getPriorityDotColor = (p?: string) => {
     switch(p) {
        case 'Urgent': return 'bg-red-500 shadow-sm shadow-red-200';
        case 'High': return 'bg-orange-500 shadow-sm shadow-orange-200';
        case 'Normal': return 'bg-blue-500';
        case 'Low': return 'bg-slate-400';
        default: return 'bg-gray-300';
     }
  }

  const getTodoCode = (todo: TodoItem) => {
    if (todo.code?.trim()) return todo.code.trim();
    if (todo._id) return todo._id.slice(-8).toUpperCase();
    return 'TODO';
  };

  const getAssigneeLabel = (todo: TodoItem) => {
    return todo.assignee?.trim() || 'Unassigned';
  };

  const filtered = todos.filter(t => {
      const matchUser = filter === 'mine' ? t.assignee === currentUser : true;
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUser && matchSearch;
  });

  const activeTodos = filtered.filter(t => t.status !== 'Closed');
  const closedTodos = filtered.filter(t => t.status === 'Closed');

  const renderTodoMenu = (t: TodoItem, compact = false) => (
    <div className={`absolute right-1 ${compact ? 'top-3' : 'top-2'} ${activeMenuId === t._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
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
              if(confirm(`Delete "${t.title}"?`)) {
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

  return (
    <div className="flex flex-col h-full bg-white text-slate-700">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">ToDos ({todos.length})</h3>
        <button onClick={onCreateTodo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={14} /><span className="text-xs font-bold">New</span>
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-2">
        <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" placeholder="Search todos..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
        </div>
        <div className="flex items-center gap-2">
            <Filter size={12} className="text-gray-400" />
            <select
                className="flex-1 bg-transparent text-xs font-medium text-gray-600 focus:outline-none cursor-pointer hover:text-blue-600"
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'mine')}
            >
                <option value="all">All ToDos</option>
                <option value="mine">Assigned to me</option>
            </select>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
             <CheckCircle2 size={24} strokeWidth={1.5} className="opacity-20" /><span className="text-xs">No tasks found</span>
           </div>
        ) : (
            <>
            {activeTodos.map(t => {
                const style = getStatusStyle(t.status);
                return (
                <div 
                    key={t._id} 
                    onClick={() => onSelectTodo(t)} 
                    className="group cursor-pointer rounded-lg border border-transparent border-b-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all bg-white p-3 relative pr-8"
                >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                            {style.icon} {t.status || 'Open'}
                        </div>
                        {t.priority && (
                             <div className="flex items-center gap-1.5" title={`Priority: ${t.priority}`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${getPriorityDotColor(t.priority)} ring-1 ring-white`} />
                             </div>
                        )}
                    </div>

                    {/* Title */}
                    <div className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {t.title}
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                            <User size={10} />
                            <span className="truncate max-w-[80px]">
                              {typeof t.createdBy === 'string' 
                                ? t.createdBy 
                                : (t.createdBy as any)?.fullName || 'Unknown'}
                            </span>
                        </div>
                        {t.dueDate && (
                             <div className={`flex items-center gap-1 ${new Date(t.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}`}>
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

                    {renderTodoMenu(t)}
                </div>
                );
            })}

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
                    <div className="px-4 py-4 text-sm text-gray-400 italic">
                      No closed tasks
                    </div>
                  ) : (
                    closedTodos.map((t, index) => (
                      <div
                        key={t._id}
                        onClick={() => onSelectTodo(t)}
                        className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[#f3f5fb] ${index === 0 ? 'bg-[#f3f5fb]' : 'bg-white'} ${index < closedTodos.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <span className={`mt-1 h-5 w-5 shrink-0 rounded-full ${getPriorityDotColor(t.priority)}`} />

                        <div className="min-w-0 flex-1 pr-6">
                          <div className="text-[13px] leading-5 text-[#4f5d80]">
                            {getTodoCode(t)}
                          </div>
                          <div className="text-[14px] leading-5 font-medium text-[#1f2a44] break-words">
                            {t.title}
                          </div>
                          <div className="mt-1 text-[13px] leading-5 text-[#5b6478]">
                            Closed
                          </div>
                          <div className="text-[13px] leading-5 text-[#5b6478] truncate">
                            {getAssigneeLabel(t)}
                          </div>
                        </div>

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
