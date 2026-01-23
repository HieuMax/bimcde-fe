import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateViewDTO, IView, UpdateViewDTO } from "@/types/view";
import { Switch } from "@/components/ui/switch";

interface CreateViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateViewDTO | UpdateViewDTO) => Promise<void>;
  initialData?: IView;
  projectId: string;
}

export const CreateViewModal = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  projectId
}: CreateViewModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateViewDTO>>({
    name: "",
    description: "",
    type: "3D",
    sharedWith: { isPublic: false, users: [] }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        type: initialData.type,
        sharedWith: initialData.sharedWith,
        // Keep existing viewState for updates
        viewState: initialData.viewState
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "3D",
        sharedWith: { isPublic: false, users: [] },
        // Default viewState for new views created from Dashboard (Placeholder)
        viewState: {
            camera: {
                position: { x: 0, y: 0, z: 0 },
                target: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 1, z: 0 },
                projection: "PERSPECTIVE"
            }
        }
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        projectId,
        // Ensure sharedWith structure is correct
        sharedWith: formData.sharedWith || { isPublic: false, users: [] }
      } as CreateViewDTO);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit View" : "Create New View"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Living Room Perspective"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(val: "2D" | "3D") => setFormData({ ...formData, type: val })}
                    disabled={!!initialData} // Cannot change type after creation
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3D">3D View</SelectItem>
                        <SelectItem value="2D">2D View</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2 flex flex-col justify-end pb-2">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="public" 
                        checked={formData.sharedWith?.isPublic}
                        onCheckedChange={(checked) => setFormData({
                            ...formData,
                            sharedWith: { ...formData.sharedWith!, isPublic: checked }
                        })}
                    />
                    <Label htmlFor="public">Public View</Label>
                </div>
             </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (initialData ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
