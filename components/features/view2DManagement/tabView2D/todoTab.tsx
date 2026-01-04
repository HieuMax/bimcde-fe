'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function TodosTab({
  todos,
  currentUser,
  onSelectTodo,
  onCreateTodo,
}: {
  todos: any[];
  currentUser: string;
  onSelectTodo: (todo: any) => void;
  onCreateTodo: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filtered =
    filter === 'mine'
      ? todos.filter(t => t.assignee === currentUser)
      : todos;

  return (
    <div className="p-4">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-3 uppercase">ToDos</h3>

        <button
          onClick={onCreateTodo}
          className="flex items-center gap-1 px-2 py-1
                     rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
          title="New ToDo"
        >
          <Plus size={16} />
          <span>New</span>
        </button>
      </div>

      {/* ===== Filter ===== */}
      <select
        className="mt-3 w-full rounded border border-gray-300 px-2 py-1.5
                   text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={filter}
        onChange={e => setFilter(e.target.value as 'all' | 'mine')}
      >
        <option value="all">All ToDos in project</option>
        <option value="mine">Assigned to me</option>
      </select>

      {/* ===== List ===== */}
      <div className="mt-4 space-y-2">
        {filtered.map(t => (
          <div
            key={t._id}
            onClick={() => onSelectTodo(t)}
            className="cursor-pointer rounded border border-gray-300
                       px-3 py-2 hover:bg-gray-100"
          >
            {/* Code + Status */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{t.code}</div>

              <span
                className={`text-xs px-2 py-0.5 rounded-full
                  ${
                    t.status === 'Done'
                      ? 'bg-green-100 text-green-700'
                      : t.status === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {t.status}
              </span>
            </div>

            {/* Title */}
            <div className="mt-0.5 font-medium text-gray-900">
              {t.title}
            </div>

            {/* Assignee */}
            <div className="text-xs text-gray-500">
              Assigned to {t.assignee ?? 'Unassigned'}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-gray-500">
            No ToDos found
          </div>
        )}
      </div>
    </div>
  );
}
