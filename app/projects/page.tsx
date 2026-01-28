"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { List, Grid, Loader2 } from "lucide-react";
import { Project } from "@/app/types/projectTypes";
import { useApi } from "@/app/hooks/useApi";
import { useRouter } from "next/navigation";

// ========================
// DEFAULT THUMBNAIL
// ========================
const DEFAULT_THUMBNAIL =
  "https://resources.connect.trimble.com/thumb/project.png";

// ========================
// MAIN PAGE
// ========================
export default function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const { get } = useApi();

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await get("/projects/getAllProject");
      if (res.success) {
        setProjects(res.result || []);
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    // 🔑 ROOT FIX: không cho body scroll
    <div className="h-screen w-full bg-[#f2f3f7] overflow-hidden flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="px-10 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Projects</h1>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setView("grid")}
            className={view === "grid" ? "bg-gray-300" : ""}>
            <Grid size={18} />
          </Button>

          <Button
            variant="ghost"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-gray-300" : ""}>
            <List size={18} />
          </Button>

            <NewProjectDialog onCreated={loadProjects} />
          </div>
        </div>

        <p className="text-sm font-medium flex items-center gap-1">
          Asia <span className="text-gray-500">▼</span>
        </p>
      </div>

      {/* ================= CONTENT (SCROLL HERE) ================= */}
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {view === "grid" && <GridView projects={projects} />}
        {view === "list" && <ListView projects={projects} />}
      </div>
    </div>
  );
}

// ========================
// POPOVER
// ========================
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

// ========================
// NEW PROJECT DIALOG
// ========================
function NewProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { post } = useApi();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    thumbnail: null as string | null,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        thumbnail: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    const newProject = {
      name: formData.name,
      thumbnail: formData.thumbnail ?? DEFAULT_THUMBNAIL,

      lastAccessed: new Date().toString(),
      lastModifiedOn: new Date().toString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
    };

    console.log("📤 Sending project data:", newProject);

    try {
      const res = await post("/projects/createProject", newProject);
      console.log("📥 Response from server:", res);

      if (res.success) {
        console.log("✅ Project created successfully:", res.result);
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          thumbnail: null,
        });
        onCreated();
      } else {
        console.error("❌ Failed to create project:", res.error || res.message);
        alert(`Error: ${res.error || res.message}`);
      }
    } catch (e) {
      console.error("❌ Failed to create project:", e);
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0f6cbd] text-white px-5">New</Button>
      </DialogTrigger>

      {/* 🔑 FIX: dialog scroll nội bộ */}
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Project Thumbnail</label>
            <Input type="file" accept="image/*" onChange={handleUpload} />
            <img
              src={formData.thumbnail ?? DEFAULT_THUMBNAIL}
              className="w-32 h-32 rounded border mt-2 object-cover"
            />
          </div>

          <div>
            <label className="text-sm">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm">Start date</label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm">End date</label>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="bg-[#0f6cbd] text-white w-24 ml-auto">
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========================
// GRID VIEW
// ========================
function GridView({ projects }: { projects: Project[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {projects.map((p) => (
        <div
          key={p._id}
          className="bg-white shadow rounded overflow-hidden cursor-pointer"
          onClick={() => handleProjectClick(p._id)}>
          <div className="h-40 bg-gray-200">
            <Image
              src={p.thumbnail || DEFAULT_THUMBNAIL}
              alt={p.name}
              width={300}
              height={200}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <p className="font-medium truncate">{p.name}</p>
            <div onClick={(e) => e.stopPropagation()}>
              <PopoverProject />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================
// LIST VIEW
// ========================
function ListView({ projects }: { projects: Project[] }) {
  const router = useRouter();

  const handleProjectClick = (id: any) => {
    router.push(`/projects/${id}`);
  };
  return (
    <div className="bg-white shadow rounded overflow-hidden">
      <div className="grid grid-cols-[40%_15%_15%_15%_15%] p-3 text-sm font-medium border-b bg-gray-50 sticky top-0 z-10">
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
          onClick={() => handleProjectClick(p._id)}>
          <div className="flex items-center gap-2">
            <Image
              src={p.thumbnail || DEFAULT_THUMBNAIL}
              alt={p.name}
              width={40}
              height={40}
              className="rounded shrink-0"
            />
            <span className="truncate">{p.name}</span>
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