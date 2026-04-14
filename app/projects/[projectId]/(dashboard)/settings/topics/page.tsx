"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, MoreVertical, Pencil, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/app/hooks/useApi";
import { useMemo } from "react";

// -------------------- Types --------------------
type TopicsInterfaces = {
  _id: string;
  projectId: string;
  icon: string;
  name: string;
  color: string;
  visible: boolean;
  isDefault: boolean;
};

// -------------------- Page --------------------
export default function TopicsSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [topicTypes, setTopicTypes] = useState<TopicsInterfaces[]>([]);
  const [topicStatuses, setTopicStatuses] = useState<TopicsInterfaces[]>([]);
  const [topicPriorities, setTopicPriorities] = useState<TopicsInterfaces[]>(
    [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { get, put } = useApi();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      const projectId = (await params).projectId;

      setLoading(true);
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const res = await get(`/topics/getAll/${projectId}`);

        if (res.success) {
          setTopicTypes(res.result.topicTypes || []);
          setTopicStatuses(res.result.topicStatuses || []);
          setTopicPriorities(res.result.topicPriorities || []);
        } else {
          console.error("Failed to fetch permissions:", res.error);
        }
      } catch (e: any) {
        setErrorMessage(e.response.data.error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Hàm save tổng (cần thiết để Header hoạt động)
  const handleSave = async () => {
    const projectId = (await params).projectId;

    try {
      await put(`/topics/update/${projectId}`, {
        topicTypes,
        topicStatuses,
        topicPriorities,
      });
      alert("Settings saved successfully!");
    } catch (e) {
      console.error("Save failed", e);
    }
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
      <Header save={handleSave} />
      <TopicTypesSection data={topicTypes} setData={setTopicTypes} />
      <TopicStatusSection data={topicStatuses} setData={setTopicStatuses} />
      <TopicPrioritySection
        data={topicPriorities}
        setData={setTopicPriorities}
      />
      <TopicIdentifierSection />
    </div>
  );
}

//#region DIALOGS (Giữ nguyên)
function EditNameDialog({ open, value, onClose, onSave }: any) {
  const [name, setName] = useState(value);
  // Cập nhật name khi value thay đổi (nếu cần)
  useEffect(() => {
    setName(value ?? "");
  }, [value]);
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
          <Button
            className="bg-[#406D87] hover:bg-[#345a70]"
            onClick={() => onSave(name)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadIconDialog({ open, onClose, onUpload }: any) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    };
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Tạo preview để người dùng xem trước
      const base64 = await fileToBase64(selectedFile);
      setPreview(base64);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onUpload(preview); // Gửi chuỗi base64 về
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload new icon</DialogTitle>
          <DialogDescription>
            Select an image file (PNG, JPG) to use as icon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex flex-col items-center">
          {preview && (
            <div className="w-16 h-16 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <Input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!preview}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: any) {
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

function Header({ save }: { save: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-normal text-gray-800">BCF Topics</h1>
      <Button
        className="bg-[#406D87] hover:bg-[#345a70] px-6 py-4 rounded text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

//#region topic type
function TopicTypesSection({ data, setData }: any) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);
  const [newType, setNewType] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleReset = () => setData([]);
  const handleRemoveAll = () => setData([]);

  const handleAddType = () => {
    if (!newType.trim()) return;
    const defaultIcon = data[0]?.icon ?? "🌀";
    setData([...data, { icon: defaultIcon, name: newType.trim() }]);
    setNewType("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic types</CardTitle>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReset}>
                Reset to default
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleRemoveAll}>
                Remove all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▾" : "▴"}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <p className="text-sm text-muted-foreground mb-2">
              Add custom types
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add new topic type..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <Button
                className="bg-[#406D87] hover:bg-[#345a70]"
                onClick={handleAddType}>
                Add
              </Button>
            </div>
          </div>
          <div className="col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Icon</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>
                      <button
                        className="flex items-center justify-center p-1 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => setUploadIndex(i)}
                        title="Click để đổi icon">
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 text-xs">
                            +
                          </div>
                        )}
                      </button>
                    </TableCell>
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
      )}

      {editIndex !== null && (
        <EditNameDialog
          open={true}
          value={data[editIndex].name}
          onClose={() => setEditIndex(null)}
          onSave={(v: string) => {
            const clone = [...data];
            clone[editIndex].name = v;
            setData(clone);
            setEditIndex(null);
          }}
        />
      )}
      {uploadIndex !== null && (
        <UploadIconDialog
          open={true}
          onClose={() => setUploadIndex(null)}
          onUpload={(base64: string) => {
            const clone = [...data];
            clone[uploadIndex].icon = base64;
            setData(clone);
            setUploadIndex(null);
          }}
        />
      )}
      {deleteIndex !== null && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete topic type"
          onCancel={() => setDeleteIndex(null)}
          onConfirm={() => {
            setData(
              data.filter((_: any, index: number) => index !== deleteIndex),
            );
            setDeleteIndex(null);
          }}
        />
      )}
    </Card>
  );
}
//#endregion

//#region topic status
function TopicStatusSection({ data, setData }: any) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleReset = () => setData([]);
  const handleRemoveAll = () => setData([]);
  const handleAddStatus = () => {
    if (!newStatus.trim()) return;
    setData([
      ...data,
      {
        name: newStatus.trim(),
        color: "#000000",
        active: true,
        default: false,
      },
    ]);
    setNewStatus("");
  };

  const handleSetDefault = (id: string) => {
    setData(
      data.map((item: any) => ({
        ...item,
        isDefault: item._id === id,
      })),
    );
  };

  const currentDefaultId = useMemo(() => {
    return data.find((s: any) => s.isDefault === true)?._id;
  }, [data]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic statuses</CardTitle>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReset}>
                Reset to default
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleRemoveAll}>
                Remove all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▾" : "▴"}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Add custom statuses
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add new status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              />
              <Button
                className="bg-[#406D87] hover:bg-[#345a70]"
                onClick={handleAddStatus}>
                Add
              </Button>
            </div>
          </div>
          <div className="col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Default</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: TopicsInterfaces, i: number) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <RadioGroup
                        value={currentDefaultId}
                        onValueChange={(value) => handleSetDefault(value)}>
                        <RadioGroupItem value={item._id} />
                      </RadioGroup>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={item.visible}
                        onCheckedChange={(checked) => {
                          const clone = [...data];
                          clone[i].visible = !!checked;
                          setData(clone);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="color"
                        value={item.color}
                        onChange={(e) => {
                          const clone = [...data];
                          clone[i].color = e.target.value;
                          setData(clone);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        {item.name}
                        {item.name === "Closed" && (
                          <p className="text-xs text-muted-foreground">
                            Topics with this status will be removed from the
                            active list.
                          </p>
                        )}
                      </div>
                    </TableCell>
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
      )}
      {editIndex !== null && (
        <EditNameDialog
          open={true}
          value={data[editIndex].name}
          onClose={() => setEditIndex(null)}
          onSave={(v: string) => {
            const clone = [...data];
            clone[editIndex].name = v;
            setData(clone);
            setEditIndex(null);
          }}
        />
      )}
      {deleteIndex !== null && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete status"
          onCancel={() => setDeleteIndex(null)}
          onConfirm={() => {
            setData(
              data.filter((_: any, index: number) => index !== deleteIndex),
            );
            setDeleteIndex(null);
          }}
        />
      )}
    </Card>
  );
}
//#endregion

//#region topic priority (Tương tự Status)
function TopicPrioritySection({ data, setData }: any) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleReset = () =>
    setData([
      { id: 1, name: "Low", color: "#22c55e" },
      { id: 2, name: "Normal", color: "#3b82f6" },
      { id: 3, name: "High", color: "#facc15" },
      { id: 4, name: "Critical", color: "#ef4444" },
    ]);

  const handleAddPriority = () => {
    if (!newPriority.trim()) return;
    setData([
      ...data,
      { id: Date.now(), name: newPriority.trim(), color: "#000000" },
    ]);
    setNewPriority("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic priorities</CardTitle>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReset}>
                Reset to default
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setData([])}>
                Remove all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▾" : "▴"}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Add custom priorities
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add new priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              />
              <Button
                className="bg-[#406D87] hover:bg-[#345a70]"
                onClick={handleAddPriority}>
                Add
              </Button>
            </div>
          </div>
          <div className="col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Color</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: TopicsInterfaces, i: number) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <input
                        type="color"
                        value={item.color}
                        onChange={(e) => {
                          const clone = [...data];
                          clone[i].color = e.target.value;
                          setData(clone);
                        }}
                      />
                    </TableCell>
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
      )}
      {editIndex !== null && (
        <EditNameDialog
          open={true}
          value={data[editIndex].name}
          onClose={() => setEditIndex(null)}
          onSave={(v: string) => {
            const clone = [...data];
            clone[editIndex].name = v;
            setData(clone);
            setEditIndex(null);
          }}
        />
      )}
    </Card>
  );
}

// -------------------- Topic Identifier (Logic hóa) --------------------
function TopicIdentifierSection() {
  const [collapsed, setCollapsed] = useState(false);
  const [prefix, setPrefix] = useState("THEBU");
  const [isAuto, setIsAuto] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic identifier</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "▾" : "▴"}
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="grid grid-cols-3 gap-6">
          <div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={isAuto} onCheckedChange={setIsAuto} />
                <span className="text-sm">
                  Automatically set topic identifier prefix
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Typically the first five letters of the project name (e.g.
                PROJX-001)
              </p>
            </div>
          </div>
          <div className="col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Prefix</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                      />
                    ) : (
                      prefix
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
