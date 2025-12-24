"use client";

import { useState, use } from "react"; // 1. Import 'use' từ react
import {
  MoreVertical,
  Pencil,
  X,
  Loader2,
  Plus,
  Tag as TagIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { ITag } from "@/types/tag";
import { useTags } from "@/components/features/explorer/hooks/useTags";

// 2. Cập nhật Interface: params bây giờ là Promise
interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function TagsPage({ params }: PageProps) {
  // 3. Dùng use() để lấy projectId từ Promise params
  const { projectId } = use(params);

  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<ITag | null>(null);
  const [editName, setEditName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use the shared hook
  const { tags, isLoading, createTag, updateTag, deleteTag } =
    useTags(projectId);

  // --- HANDLERS ---

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setIsSubmitting(true);
    try {
      await createTag({
        name: newTag.trim(),
        projectId: projectId,
      });
      setNewTag("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;

    setDeletingId(id);
    try {
      await deleteTag(id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (tag: ITag) => {
    setEditingTag(tag);
    setEditName(tag.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingTag) return;
    setIsSubmitting(true);
    try {
      await updateTag({
        id: editingTag._id,
        data: { name: editName.trim() },
      });
      setEditingTag(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Page */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tags</h1>
          <p className="text-sm text-slate-500">
            Manage tags for project categorization.
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5 text-slate-500" />
        </Button>
      </div> */}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-blue-500" />
            Tag Manager
          </CardTitle>
          <CardDescription>Create and manage tags used within </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Add Tag Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Create New Tag
                </h3>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="e.g. Architectural, Draft..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={isSubmitting || !newTag.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Tag
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Tags help organize files and folders across your project.
                </p>
              </div>
            </div>

            {/* Right Column: Tag List Table */}
            <div className="lg:col-span-2">
              <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">
                        Tag Name
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span>Loading tags...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tags && tags.length > 0 ? (
                      tags.map((tag) => (
                        <TableRow
                          key={tag._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <TableCell className="font-medium text-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              {tag.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                onClick={() => handleEditClick(tag)}
                                disabled={deletingId === tag._id}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                onClick={() => handleDeleteTag(tag._id)}
                                disabled={deletingId === tag._id}
                              >
                                {deletingId === tag._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                            <TagIcon className="h-8 w-8 opacity-20" />
                            <p>No tags found.</p>
                            <p className="text-xs">
                              Create your first tag to get started.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
