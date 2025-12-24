"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Tag as TagIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTags } from "@/components/features/explorer/hooks/useTags";

// Mock Project ID (should be from context)
const PROJECT_ID = "656e9c30a4d8c830219b1232";

export default function TagManager() {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTags(PROJECT_ID);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    await createTag({ name: newTagName, projectId: PROJECT_ID });
    setNewTagName("");
    setIsDialogOpen(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateTag({ id, data: { name: editName } });
    setEditingTagId(null);
  };

  const startEdit = (tag: any) => {
    setEditingTagId(tag._id);
    setEditName(tag.name);
  };

  if (isLoading) return <div>Loading tags...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TagIcon className="h-6 w-6" /> Tag Management
          </h2>
          <p className="text-muted-foreground">
            Manage tags for this project. These tags can be assigned to files.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Tag Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tags?.map((tag: any) => (
          <div
            key={tag._id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {editingTagId === tag._id ? (
              <div className="flex items-center gap-2 flex-1 mr-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={() => handleUpdate(tag._id)}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingTagId(null)}>
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || "#000" }}
                />
                <span className="font-medium">{tag.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(tag)}
                disabled={!!editingTagId}
              >
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this tag?")) {
                    deleteTag(tag._id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        {tags?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
            No tags found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
