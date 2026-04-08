import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useTags } from "@/components/features/explorer/hooks/useTags";
import { ITag } from "@/types/tag";
import { toast } from "sonner";
import { explorerService } from "@/services/explorer.service";

interface Props {
  fileIds?: string[];
  folderIds?: string[];
  initialTags?: ITag[];
  onBack: () => void;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
}

export default function TagsView({
  fileIds = [],
  folderIds = [],
  initialTags = [],
  onBack,
  onSuccess,
  projectId,
}: Props) {
  const { tags: allTags, isLoading, createTag } = useTags(projectId);
  const [search, setSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const initialTagsSignature = useMemo(
    () => (initialTags ?? []).map((t) => t._id).sort().join(","),
    [initialTags],
  );

  useEffect(() => {
    const ids = initialTagsSignature
      ? initialTagsSignature.split(",").filter(Boolean)
      : [];
    setSelectedTagIds(new Set(ids));
  }, [initialTagsSignature]);

  const filteredTags = allTags?.filter((tag: ITag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (tagId: string) => {
    const newSet = new Set(selectedTagIds);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    setSelectedTagIds(newSet);
  };

  const handleSave = async () => {
    try {
      const tags = Array.from(selectedTagIds);
      const promises = [];

      if (fileIds.length > 0) {
        promises.push(explorerService.assignTags(fileIds, tags));
      }
      if (folderIds.length > 0) {
        promises.push(explorerService.assignFolderTags(folderIds, tags));
      }

      await Promise.all(promises);
      toast.success("Tags updated successfully");
      if (onSuccess) onSuccess();
      onBack();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update tags");
    }
  };

  const handleQuickCreate = async () => {
    if (!search.trim()) return;
    setIsCreating(true);
    try {
      // Create tag
      const response = await createTag({ name: search, projectId: projectId });
      setSelectedTagIds((prev) => new Set(prev).add(response._id));
      setSearch("");
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Add Tags</h3>
      </div>

      {/* Search */}
      <div className="p-4 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search or create tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredTags?.length === 0) {
                handleQuickCreate();
              }
            }}
          />
        </div>
        {search && filteredTags?.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleQuickCreate}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" /> Create &quot;{search}&quot;
          </Button>
        )}
      </div>

      {/* Tag List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            filteredTags?.map((tag: ITag) => (
              <div
                key={tag._id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer"
                onClick={() => handleToggle(tag._id)}
              >
                <Checkbox
                  checked={selectedTagIds.has(tag._id)}
                  onCheckedChange={() => handleToggle(tag._id)}
                  id={`tag-${tag._id}`}
                />
                <label
                  htmlFor={`tag-${tag._id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer flex items-center gap-2"
                >
                  {tag.name}
                </label>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
