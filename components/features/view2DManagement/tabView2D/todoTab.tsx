'use client';
import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, 
  MoreVertical, Trash2, Edit, Share2, ChevronDown, ChevronUp
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // State quản lý việc mở/đóng danh sách Closed
  const [isClosedExpanded, setIsClosedExpanded] = useState(true);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // priority
  const getDotColor = (priority?: string) => {
     switch(priority) {
        case 'Critical': return 'bg-[#d13438]'; 
        case 'High': return 'bg-[#ff8c00]';   
        case 'Low': return 'bg-[#00bfff]';   
        case 'Normal': 
        default: return 'bg-[#005a9e]';
     }
  }

  // 1. Lọc theo user và search
  const filtered = todos.filter(t => {
      const matchUser = filter === 'mine' ? t.assignee === currentUser : true;
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUser && matchSearch;
  });

  // 2. Tách thành 2 danh sách: Đang mở và Đã đóng
  const activeTodos = filtered.filter(t => t.status !== 'Closed');
  const closedTodos = filtered.filter(t => t.status === 'Closed');

  // 3. Hàm render UI cho 1 item Todo (Tái sử dụng cho cả 2 danh sách)
  const renderTodoItem = (t: TodoItem) => {
    return (
      <div 
        key={t._id} 
        onClick={() => onSelectTodo(t)} 
        className={`group cursor-pointer border-b border-gray-100 hover:bg-[#f3f2f1] transition-all bg-white p-3 relative flex items-start gap-3 ${t.status === 'Closed' ? 'opacity-70 bg-gray-50/50' : ''}`}
      >
        {/* Dấu chấm Priority (Cột trái) */}
        <div className="pt-1 shrink-0">
          <div className={`w-3.5 h-3.5 rounded-full ${getDotColor(t.priority)}`} />
        </div>

        {/* Nội dung Todo (Cột phải) */}
        <div className="flex-1 min-w-0 pr-6 space-y-0.5">
          {/* ID của Todo */}
          <div className="text-[13px] text-gray-700 font-medium">
            {(t as any).code || `THEB-${t._id.slice(-4).toUpperCase()}`}
          </div>
          
          {/* Title */}
          <div className="text-[14px] text-[#005a9e] font-normal truncate" title={t.title}>
            {t.title}
          </div>
          
          {/* Status */}
          <div className="text-[12px] text-gray-500">
            {t.status || 'Open'}
          </div>
          
          {/* Assignee */}
          <div className="text-[12px] text-gray-500 truncate">
            {t.assignee ? `Assigned To ${t.assignee}` : 'Unassigned'}
          </div>
        </div>

        {/* Nút Menu (3 chấm) */}
        <div className={`absolute right-2 top-3 ${activeMenuId === t._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === t._id ? null : t._id);
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
            >
                <MoreVertical size={16} />
            </button>

            {/* Dropdown Menu */}
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
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#005a9e] flex items-center gap-2"
                    >
                        <Edit size={12} /> Edit
                    </button>
                    {/* <button 
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#005a9e] flex items-center gap-2"
                        onClick={() => setActiveMenuId(null)}
                    >
                        <Share2 size={12} /> Share
                    </button> */}
                    <div className="h-[1px] bg-gray-100 my-0.5" />
                    <button 
                        onClick={() => {
                            if(confirm(`Delete "${t.title}"?`)) {
                                onDeleteTodo?.(t._id);
                            }
                            setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#d13438] hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 size={12} /> Delete
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">ToDos ({todos.length})</h3>
        <button onClick={onCreateTodo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#005a9e] text-white hover:bg-[#004578] transition-colors shadow-sm">
          <Plus size={14} /><span className="text-xs font-bold">New</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="p-3 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-2">
        <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" placeholder="Search todos..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#005a9e] focus:ring-1 focus:ring-[#005a9e]"
            />
        </div>
        <div className="flex items-center gap-2">
            <Filter size={12} className="text-gray-400" />
            <select
                className="flex-1 bg-transparent text-xs font-medium text-gray-600 focus:outline-none cursor-pointer hover:text-[#005a9e]"
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'mine')}
            >
                <option value="all">All ToDos</option>
                <option value="mine">Assigned to me</option>
            </select>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
             <span className="text-xs">No tasks found</span>
           </div>
        ) : (
           <div className="flex flex-col pb-4">
              {/* Danh sách Active */}
              <div className="flex flex-col">
                  {activeTodos.map(t => renderTodoItem(t))}
              </div>

              {/* Danh sách Closed (Accordion) */}
              {closedTodos.length > 0 && (
                 <div className="mt-2">
                    <button 
                       onClick={() => setIsClosedExpanded(!isClosedExpanded)}
                       className="flex items-center justify-between w-full py-2.5 px-4 text-[13px] font-bold text-gray-800 hover:bg-gray-50 transition-colors border-y border-gray-200 bg-white"
                    >
                       <span>Closed ({closedTodos.length})</span>
                       {isClosedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {isClosedExpanded && (
                       <div className="flex flex-col bg-gray-50/30">
                          {closedTodos.map(t => renderTodoItem(t))}
                       </div>
                    )}
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}