"use client";

import { useState, useEffect } from "react";
import { TodoItem } from "@/types/explorer";
import {
  RecipientSelector,
  RecipientOption,
} from "../../release/RecipientSelector";
import { useTags } from "@/components/features/explorer/hooks/useTags";
import { TagIcon, Loader2 } from "lucide-react";

export default function CreateTodoPanel({
  projectId, 
  onClose,
  onSave,
}: {
  projectId: string;
  onClose: () => void;
  onSave: (data: Partial<TodoItem>) => void;
}) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { tags: availableTags, isLoading: isTagsLoading } = useTags(projectId);
  /* ===== CURRENT USER ===== */
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user.fullName || user.email || "Unknown");
      }
    } catch (err) {
      console.error("Failed to read current user", err);
    }
  }, []);

  /* ===== FORM STATE ===== */
  const [formData, setFormData] = useState<Partial<TodoItem>>({
    title: "",
    description: "",
    dueDate: "",
    type: "Issue",
    priority: "Normal",
    status: "Open",
    completion: 0,
    tags: [],
    createdBy: "Unknown",
  });

  const [selectedAssignees, setSelectedAssignees] = useState<RecipientOption[]>(
    [],
  );

  const [tagInput, setTagInput] = useState("");

  /* Sync createdBy */
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        createdBy: currentUser,
      }));
    }
  }, [currentUser]);

  /* ===== SUBMIT ===== */
  const handleSubmit = () => {
    if (!formData.title?.trim()) {
      alert("Title is required");
      return;
    }

    const assigneeIds = selectedAssignees.map((o) => o.id);

    onSave({
      ...formData,
      createdBy: currentUser || "Unknown",
      assignees: assigneeIds,
      assignee: assigneeIds[0],
    });
  };

  /* ===== UI ===== */
  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="shrink-0 p-4 border-b border-gray-300 flex items-center justify-between">
        <div className="text-base font-semibold text-gray-800">
          New ToDo
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>
      </div>

      {/* ===== BODY ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm">
        {/* Title */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Title (Required)
          </label>
          <input
            autoFocus
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Description (Required)
          </label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 px-2 py-1.5 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* Due date */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Due date
          </label>
          <input
            type="date"
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value,
              })
            }
          />
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Type
          </label>
          <select
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value })
            }
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

        {/* Priority */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Priority
          </label>
          <select
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value as any,
              })
            }
          >
            
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Completion */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Completion %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.completion}
            onChange={(e) => {
              const value = Math.max(
                0,
                Math.min(100, Number(e.target.value) || 0)
              );
              setFormData({ ...formData, completion: value });
            }}
          />
        </div>

        {/* ===== ASSIGNEE ===== */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Assignee
          </label>
          <div className="border rounded-md p-1 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
            <RecipientSelector
              projectId={projectId}
              initialOptions={selectedAssignees}
              onChange={(selectedIds, options) => {
                setSelectedAssignees(options ?? []);
              }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Optional — choose project members to assign
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1.5">
            <TagIcon size={14} /> Tags
          </label>
          
          <div className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex flex-wrap gap-2 min-h-[60px] bg-gray-50/50">
            {isTagsLoading ? (
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Loading tags...
              </div>
            ) : availableTags?.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No tags available in this project.</div>
            ) : (
              availableTags?.map((tag: any) => {
                const isSelected = formData.tags?.includes(tag._id);
                return (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => {
                      const currentTags = formData.tags || [];
                      if (isSelected) {
                        setFormData({ ...formData, tags: currentTags.filter(t => t !== tag._id) });
                      } else {
                        setFormData({ ...formData, tags: [...currentTags, tag._id] });
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

        {/* Created by */}
        {currentUser && (
          <div className="text-xs text-gray-500">
            Created by{" "}
            <span className="font-medium text-gray-700">
              {currentUser}
            </span>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="shrink-0 p-4 border-t bg-white flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-blue-600 hover:underline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </aside>
  );
}