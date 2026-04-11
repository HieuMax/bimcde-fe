"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { List, Grid, Loader2, CalendarIcon } from "lucide-react";
import { Project } from "@/app/types/projectTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { CdeWorkflowMode } from "@/types/explorer";
import { useApi } from "@/app/hooks/useApi";
import { useRouter } from "next/navigation";

// ========================
// DEFAULT THUMBNAIL
// ========================
const DEFAULT_THUMBNAIL =
  "https://resources.connect.trimble.com/thumb/project.png";

//#region MAIN PAGE COMPONENT
export default function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const { get } = useApi();

  async function loadProjects() {
    try {
      const res = await get("/projects/getAllProject");
      if (res.success) {
        setProjects(res.result || []);
      } else {
        console.error("Failed to load project list:", res.data.message);
      }
    } catch (e) {
      console.error("Failed to load project list:", e);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen bg-[#f2f3f7] p-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium">Projects</h1>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setView("grid")}
            className={view === "grid" ? "bg-gray-300" : ""}
          >
            <Grid size={18} />
          </Button>

          <Button
            variant="ghost"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-gray-300" : ""}
          >
            <List size={18} />
          </Button>

          <NewProjectDialog onCreated={loadProjects} />
        </div>
      </div>

      <p className="text-sm font-medium mb-4 flex items-center gap-1">
        Asia <span className="text-gray-500">▼</span>
      </p>

      {view === "grid" && <GridView projects={projects} />}
      {view === "list" && <ListView projects={projects} />}
    </div>
  );
}
//#endregion

//#region popup menu
function PopoverProject() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="py-2 px-4 rounded hover:bg-gray-300">⋮</button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-3 flex flex-col gap-2">
        <p className="hover:bg-gray-100 p-2 rounded cursor-pointer">
          Use as template for a new project
        </p>
        <p className="hover:bg-gray-100 p-2 rounded cursor-pointer">
          Leave project
        </p>
      </PopoverContent>
    </Popover>
  );
}
//#endregion

//#region DIALOG FOR NEW PROJECT
function NewProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    thumbnail: null as string | null,
    workflowMode: "NORMAL" as CdeWorkflowMode,
  });
  const { post } = useApi();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Đặt giới hạn kích thước hình ảnh (ví dụ 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    // Tiến hành đọc và upload tệp nếu không vượt quá giới hạn
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        thumbnail: reader.result as string, // Base64 string
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!formData.startDate || !formData.endDate) {
      setDateError("Please select both start date and end date.");
      return;
    }
    if (formData.endDate < formData.startDate) {
      setDateError("End date must be on or after start date.");
      return;
    }
    setDateError(null);

    const newProject: Project = {
      name: formData.name,
      size: "0 MB",
      thumbnail: formData.thumbnail ?? DEFAULT_THUMBNAIL,
      lastAccessed: new Date().toString(),
      lastModifiedOn: new Date().toString(),
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: format(formData.endDate, "yyyy-MM-dd"),
      description: formData.description,
      workflowMode: formData.workflowMode,
    };
    try {
      const reponse = await post("/projects/createProject", newProject);
      if (reponse.success) {
        // reset form
        setFormData({
          name: "",
          description: "",
          startDate: undefined,
          endDate: undefined,
          thumbnail: null,
          workflowMode: "NORMAL",
        });
        setDateError(null);

        setOpen(false);
        onCreated();
      }
    } catch {
      console.error("Failed to create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0f6cbd] text-white px-5">New</Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl" aria-describedby="dialog-desc">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-sm">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="text-sm font-medium">Project Thumbnail</label>
            <Input type="file" accept="image/*" onChange={handleUpload} />

            {(formData.thumbnail ?? DEFAULT_THUMBNAIL) && (
              <img
                src={formData.thumbnail ?? DEFAULT_THUMBNAIL}
                className="w-32 h-32 rounded border mt-2 object-cover"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* CDE workflow mode */}
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Workflow mode
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose before creating the project; it cannot be changed from
                this screen later.
              </p>
            </div>
            <RadioGroup
              value={formData.workflowMode}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  workflowMode: v as CdeWorkflowMode,
                }))
              }
              className="grid gap-3"
            >
              <div className="flex items-start gap-3 rounded-md border border-transparent bg-white p-3 shadow-sm">
                <RadioGroupItem
                  value="NORMAL"
                  id="wf-normal"
                  className="mt-0.5"
                />
                <div className="grid gap-0.5 flex-1">
                  <Label
                    htmlFor="wf-normal"
                    className="font-medium cursor-pointer"
                  >
                    Normal
                  </Label>
                  <p className="text-xs text-slate-500">
                    Flexible permissions per folder and file (ACL), similar to a
                    shared drive.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-transparent bg-white p-3 shadow-sm">
                <RadioGroupItem
                  value="ISO_19650"
                  id="wf-iso"
                  className="mt-0.5"
                />
                <div className="grid gap-0.5 flex-1">
                  <Label
                    htmlFor="wf-iso"
                    className="font-medium cursor-pointer"
                  >
                    ISO 19650 (CDE)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Four stages: WIP → Shared → Published → Archived; standard
                    root folders; promote creates copies; only admins create
                    teams and team folders under WIP/Shared.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm">Start date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData((prev) => {
                        const next = { ...prev, startDate: date };
                        if (date && prev.endDate && prev.endDate < date) {
                          next.endDate = undefined;
                        }
                        return next;
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <label className="text-sm">End date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(formData.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    disabled={(date) =>
                      !!formData.startDate && date < formData.startDate
                    }
                    onSelect={(date) => {
                      setFormData((prev) => ({ ...prev, endDate: date }));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {dateError && (
            <p className="text-sm text-red-600" role="alert">
              {dateError}
            </p>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="bg-[#0f6cbd] text-white w-24 ml-auto"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//#endregion

//#region GRID VIEW
function GridView({ projects }: { projects: Project[] }) {
  const router = useRouter();

  const handleProjectClick = (id: any) => {
    router.push(`/projects/${id}`);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {projects.map((p) => (
        <div
          key={p._id}
          className="bg-white shadow rounded overflow-hidden cursor-pointer"
          onClick={() => handleProjectClick(p._id)}
        >
          <div className="h-40 bg-gray-200">
            <Image
              src={p.thumbnail || DEFAULT_THUMBNAIL}
              alt={p.name || "Project Thumbnail"}
              width={300}
              height={200}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <p className="font-medium cursor-pointer">{p.name}</p>
            <div onClick={(e) => e.stopPropagation()}>
              <PopoverProject />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
//#endregion

//#region LIST VIEW
function ListView({ projects }: { projects: Project[] }) {
  const router = useRouter();

  const handleProjectClick = (id: any) => {
    router.push(`/projects/${id}`);
  };
  return (
    <div className="bg-white shadow rounded">
      <div className="grid grid-cols-[40%_15%_15%_15%_15%] p-3 text-sm font-medium border-b">
        <div>Name</div>
        <div>Size</div>
        <div>Last visited</div>
        <div>Modified on</div>
        <div></div>
      </div>

      {projects.map((p) => (
        <div
          key={p._id}
          className="grid grid-cols-[40%_15%_15%_15%_15%] items-center p-3 hover:bg-gray-100 cursor-pointer"
          onClick={() => handleProjectClick(p._id)}
        >
          <div className="flex items-center gap-2">
            <Image
              src={p.thumbnail || DEFAULT_THUMBNAIL}
              alt={p.name || "Project Thumbnail"}
              width={40}
              height={40}
              className="rounded"
              loading="eager"
            />
            {p.name}
          </div>

          <div>{p.size}</div>
          <div>
            {p.lastAccessed
              ? new Date(p.lastAccessed).toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : ""}
          </div>

          <div>
            {p.lastModifiedOn && !isNaN(new Date(p.lastModifiedOn).getTime())
              ? new Date(p.lastModifiedOn).toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "No Date Available"}
          </div>

          <div className="flex justify-end">
            <PopoverProject />
          </div>
        </div>
      ))}
    </div>
  );
}
//#endregion
