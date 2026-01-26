"use client";

import { useState, useEffect } from "react";
import { TodoItem } from "@/types/explorer";

export default function CreateTodoPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Partial<TodoItem>) => void;
}) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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
    assignee: "",
    tags: [],
    createdBy: "Unknown",
  });

  const [tagInput, setTagInput] = useState("");

  /* Sync assignee + createdBy */
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        assignee: currentUser,
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

    onSave({
      ...formData,
      createdBy: currentUser || "Unknown",
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
            <option value="Issue">Issue</option>
            <option value="Comment">Comment</option>
            <option value="Undefined">Undefined</option>
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
            <option value="Urgent">Urgent</option>
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

        {/* Assignee */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Assignee
          </label>
          <input
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Please enter users, groups"
            value={formData.assignee}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignee: e.target.value,
              })
            }
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-1 text-sm text-gray-600">
            Tags
          </label>
          <input
            className="w-full h-9 border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                setFormData((prev) => ({
                  ...prev,
                  tags: [...(prev.tags || []), tagInput.trim()],
                }));
                setTagInput("");
              }
            }}
          />

          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs border border-gray-200 flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags?.filter(
                          (_, i) => i !== idx
                        ),
                      }))
                    }
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
