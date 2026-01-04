"use client";

import { useState, use } from "react";
import { Pencil, X, Loader2, Plus, Tag as TagIcon } from "lucide-react";

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

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function TagsPage({ params }: PageProps) {
  const { projectId } = use(params);

  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<ITag | null>(null);
  const [editName, setEditName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="p-6 space-y-6 mx-auto bg-[#F0F4F6] min-h-screen">
      <Card className="shadow-sm border-gray-200 bg-white">
        {/* Header Card với màu nền nhẹ của System Blue */}
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-[#0F2332] flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-[#1D3F52]" />
            Tag Manager
          </CardTitle>
          <CardDescription className="text-[#0F2332]/60">
            Create and manage tags used within your project structure.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Add Tag Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#F0F4F6] p-4 rounded-lg border border-gray-200/60">
                <h3 className="text-sm font-bold text-[#0F2332] mb-3">
                  Create New Tag
                </h3>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="e.g. Architectural, Draft..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white border-gray-300 focus:border-[#1D3F52] focus:ring-[#1D3F52]/20 text-[#0F2332]"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={isSubmitting || !newTag.trim()}
                    // Nút Primary dùng màu Brand #1D3F52
                    className="w-full bg-[#1D3F52] hover:bg-[#1D3F52]/90 text-white transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Tag
                  </Button>
                </div>
                <p className="text-xs text-[#0F2332]/50 mt-3">
                  Tags help organize files and folders across your project.
                </p>
              </div>
            </div>

            {/* Right Column: Tag List Table */}
            <div className="lg:col-span-2">
              <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
                <Table>
                  {/* Table Header dùng nền màu Brand nhạt */}
                  <TableHeader className="bg-[#1D3F52]/5">
                    <TableRow className="border-gray-200 hover:bg-[#1D3F52]/5">
                      <TableHead className="font-bold text-[#1D3F52]">
                        Tag Name
                      </TableHead>
                      <TableHead className="text-right font-bold text-[#1D3F52] w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-[#0F2332]/60">
                            <Loader2 className="h-6 w-6 animate-spin text-[#1D3F52]" />
                            <span>Loading tags...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tags && tags.length > 0 ? (
                      tags.map((tag) => (
                        <TableRow
                          key={tag._id}
                          // Hover row dùng màu Brand nhạt
                          className="hover:bg-[#1D3F52]/5 transition-colors border-gray-100"
                        >
                          <TableCell className="font-medium text-[#0F2332]">
                            <div className="flex items-center gap-2">
                              {/* Dot chỉ thị màu Brand */}
                              <div className="w-2 h-2 rounded-full bg-[#1D3F52]" />
                              {tag.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#0F2332]/50 hover:text-[#1D3F52] hover:bg-[#1D3F52]/10"
                                onClick={() => handleEditClick(tag)}
                                disabled={deletingId === tag._id}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#0F2332]/50 hover:text-red-600 hover:bg-red-50"
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
                          <div className="flex flex-col items-center justify-center gap-1 text-[#0F2332]/40">
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
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-[#0F2332]">Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[#0F2332]">
                Tag Name
              </Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                className="bg-white border-gray-300 focus:border-[#1D3F52] focus:ring-[#1D3F52]/20 text-[#0F2332]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTag(null)}
              className="border-gray-300 text-[#0F2332] hover:bg-[#F0F4F6]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="bg-[#1D3F52] hover:bg-[#1D3F52]/90 text-white"
            >
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
