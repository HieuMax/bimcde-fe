"use client";

export default function CreateTodoPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col">

      {/* ===== HEADER (FIXED) ===== */}
      <div className="shrink-0 p-4 border-b border-gray-300 flex items-center justify-between">
        <div className="text-lg font-semibold">New ToDo</div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-lg"
        >
          ✕
        </button>
      </div>

      {/* ===== BODY (SCROLLABLE) ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm">
        <div>
          <label className="block mb-1 font-medium">Title (Required)</label>
          <input className="w-full border border-slate-300 p-2 rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description (Required)</label>
          <textarea
            rows={3}
            className="w-full border border-slate-300 p-2 rounded resize-none"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Due date</label>
          <input type="date" className="w-full border border-slate-300 p-2 rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select className="w-full border border-slate-300 p-2 rounded">
            <option>Issue</option>
            <option>Question</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Priority</label>
          <select
            defaultValue="Normal"
            className="w-full border border-slate-300 p-2 rounded"
          >
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Completion %</label>
          <input
            type="number"
            className="w-full border border-slate-300 p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Assignee</label>
          <input
            className="w-full border border-slate-300 p-2 rounded text-gray-500"
            placeholder="Please enter users, groups"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Tags</label>
          <input
            className="w-full border border-slate-300 p-2 rounded"
            placeholder="Add tags"
          />
        </div>
      </div>

      {/* ===== FOOTER (FIXED) ===== */}
      <div className="shrink-0 p-4 border-t bg-gray-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </aside>
  );
}
