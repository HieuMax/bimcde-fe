"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MoreVertical, Pencil, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/app/hooks/useApi";

// -------------------- Page --------------------
export default function TopicsSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { get, post, put, delete: del } = useApi();
  const [tags, setTags] = useState<{ tag: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  useEffect(() => {
    const fetchTags = async () => {
      const projectId = (await params).projectId;
      if (!projectId) {
        setLoading(false);
        return;
      }
      setProjectId(projectId);

      try {
        const response = await get(`/tags/getAll/${projectId}`);
        if (response.success) {
          setTags(response.result || []);
        } else {
          console.error("Failed to fetch tags:", response.error);
        }
      } catch (e: any) {
        setErrorMessage(e.response.data.error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleSave = () => {
    const payload = { tags };
    // TODO: call API to save settings
    console.log("SAVE TO DB:", payload);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-muted min-h-screen">
      <Header
        setData={setTags}
        removeAll={async () => {
          const projectId = (await params).projectId;

          try {
            const response = await del(`/tags/removeAll/${projectId}`);
            if (response.success) {
              setTags([]);
            } else {
              alert(response.error || "Failed to remove all tags");
            }
          } catch (error) {
            alert("Error removing all tags");
          }
        }}
      />

      <TopicTypesSection data={tags} setData={setTags} projectId={projectId} />
    </div>
  );
}

//#region DIALOG
function EditNameDialog({
  open,
  value,
  onClose,
  onSave,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  const [name, setName] = useState(value);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
          <DialogDescription>
            Update the name of the selected item.
          </DialogDescription>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(name)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  open,
  title = "Delete item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
//#endregion

//#region header
function Header({
  setData,
  removeAll,
}: {
  setData: React.Dispatch<React.SetStateAction<{ tag: string }[]>>;
  removeAll: () => Promise<void>;
}) {
  const handleRemoveAll = async () => {
    await removeAll();
  };
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Tags</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleRemoveAll}>
            Remove all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
//#endregion

//#region TAGS
function TopicTypesSection({
  data,
  setData,
  projectId,
}: {
  data: any;
  setData: any;
  projectId: string | null;
}) {
  const { post, put, delete: del } = useApi();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isDuplicate = data.some(
    (item: any) => item.name.toLowerCase() === newTag.trim().toLowerCase()
  );

  const handleAddType = async () => {
    if (!newTag.trim() || isDuplicate) return;

    setLoading(true);
    try {
      const response = await post(`/tags/create/${projectId}`, {
        name: newTag.trim(),
      });
      if (response.success) {
        setData([...data, response.result]);
        setNewTag("");
      } else {
        alert(response.error || "Failed to add tag");
      }
    } catch (error) {
      alert("Error adding tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tag Manager</CardTitle>

        <div className="flex items-center gap-1">{/* Collapse */}</div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <p className="text-sm text-muted-foreground mb-2">Add custom tag</p>
          <div className="flex gap-2">
            <Input
              placeholder="Add new topic type..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <Button
              onClick={handleAddType}
              disabled={isDuplicate || loading || !newTag.trim()}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
          {isDuplicate && newTag.trim() && (
            <p className="text-sm text-red-500 mt-1">Tag already exists</p>
          )}
        </div>

        {/* Table takes up 1 column */}
        <div className="col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((item: any, i: number) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditIndex(i)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteIndex(i)}>
                      <X size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editIndex !== null && (
        <EditNameDialog
          open
          value={data[editIndex].name}
          onClose={() => setEditIndex(null)}
          onSave={async (v) => {
            setLoading(true);
            try {
              const response = await put(
                `/tags/update/${data[editIndex]._id}`,
                {
                  name: v,
                }
              );
              if (response.success) {
                const clone = [...data];
                clone[editIndex].name = v;
                setData(clone);
                setEditIndex(null);
              } else {
                alert(response.error || "Failed to update tag");
              }
            } catch (error) {
              alert("Error updating tag");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}

      {deleteIndex !== null && (
        <ConfirmDeleteDialog
          open
          title="Delete tag"
          description="This tag will be removed."
          onCancel={() => setDeleteIndex(null)}
          onConfirm={async () => {
            setLoading(true);
            try {
              const response = await del(
                `/tags/delete/${data[deleteIndex]._id}`
              );
              if (response.success) {
                const clone = [...data];
                clone.splice(deleteIndex, 1);
                setData(clone);
                setDeleteIndex(null);
              } else {
                alert(response.error || "Failed to delete tag");
              }
            } catch (error) {
              alert("Error deleting tag");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </Card>
  );
}
//#endregion
