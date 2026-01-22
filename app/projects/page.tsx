// bimcde-fe\app\projects\page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
import { List, Grid, Loader2 } from "lucide-react";
import { Project } from "@/app/types/projectTypes";
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
        console.error("Lỗi khi tải danh sách dự án:", (res as any)?.data?.message ?? res?.message);
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    thumbnail: null as string | null,
  });
  const { post } = useApi();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    const newProject: Project = {
      name: formData.name,
      size: "0 MB",
      thumbnail: formData.thumbnail ?? DEFAULT_THUMBNAIL,
      lastVisitedOn: new Date().toString(),
      lastModifiedOn: new Date().toString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
    };
    const formDataToSend = new FormData();
    formDataToSend.append("project", JSON.stringify(newProject));
    if (formData.thumbnail) {
      // Chuyển thumbnail về tệp nếu có
      const thumbnailFile = dataURLToFile(formData.thumbnail);
      formDataToSend.append("thumbnail", thumbnailFile);
    }
    try {
      const reponse = await post("/projects/createProject", newProject);
      if (reponse.success) {
        // reset form
        setFormData({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          thumbnail: null,
        });

        setOpen(false);
        onCreated();
      }
    } catch {
      console.error("Failed to create project");
    }
  }
  // Hàm chuyển đổi Base64 thành File object
  function dataURLToFile(dataURL: string) {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
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

          {/* Dates */}
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
    localStorage.setItem("selectedProjectId", id);
    router.push(`/pages/${id}`);
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
          <div>{p.lastVisitedOn?.toString()}</div>
          <div>{p.lastModifiedOn?.toString()}</div>

          <div className="flex justify-end">
            <PopoverProject />
          </div>
        </div>
      ))}
    </div>
  );
}
//#endregion
