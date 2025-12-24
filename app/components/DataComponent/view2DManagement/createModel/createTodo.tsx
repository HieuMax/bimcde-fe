'use client';

import { TodoItem } from "@/app/types/api";

export default function CreateTodoPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: TodoItem) => void;
}) {


  return (
    <aside className="w-80 bg-white shadow flex flex-col">
      <div className="p-4 border-b border-gray-300 flex items-center justify-between">
        <div className="text-lg font-semibold">New ToDo</div>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="p-4 space-y-4 text-sm flex-1 overflow-auto">
        <div>
          <label className="block mb-1">Title (Required)</label>
          <input className="w-full border border-slate-300 p-2" />
        </div>

        <div>
          <label className="block mb-1">Description (Required)</label>
          <textarea className="w-full border border-slate-300 p-2" />
        </div>

        <div>
          <label className="block mb-1">Due date</label>
          <input type="date" className="w-full border border-slate-300 p-2 " />
        </div>

        <div>
          <label className="block mb-1">Type</label>
          <select className="w-full border border-slate-300 p-2 ">
            <option>Issue</option>
            <option>Question</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Priority</label>
          <select className="w-full border border-slate-300 p-2 ">
            <option>Low</option>
            <option selected>Normal</option>
            <option>High</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Completion %</label>
          <input type="number" className="w-full border border-slate-300 p-2 " />
        </div>

        <div>
          <label className="block mb-1">Assignee</label>
          <input
            className="w-full border border-slate-300 p-2  text-gray-500"
            placeholder="Please enter users, groups"
          />
        </div>

        <div>
          <label className="block mb-1">Tags</label>
          <input
            className="w-full border border-slate-300 p-2 "
            placeholder="Add tags"
          />
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button
          onClick={() => onSave({})}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </aside>
  );
}
