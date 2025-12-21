"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/app/hooks/useApi";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* =======================
   Schema
======================= */
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  thumbnail: z.string().optional(),
  createdAt: z.string().optional(),
  createdBy: z.object({ fullName: z.string() }).optional(),
  modifiedBy: z.object({ fullName: z.string() }).optional(),
  lastModifiedOn: z.string().optional(),
  size: z.string().optional(),
  folderCount: z.number().optional(),
  filesCount: z.number().optional(),
  userCount: z.number().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
/* =======================
   Page
======================= */
export default  function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { get, put, delete: del } = useApi();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null); // State để lưu trữ thumbnail
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref cho input file
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Xử lý khi người dùng chọn tệp
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Cập nhật giá trị thumbnail khi tệp đã được chọn
        setThumbnail(reader.result as string);
        setValue("thumbnail", reader.result as string);
      };
      reader.readAsDataURL(file); // Đọc tệp dưới dạng base64
    }
  };

  // Kích hoạt file input khi nhấn nút
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: null,
      endDate: null,
      thumbnail: "",
      createdAt: "",
      createdBy: { fullName: "" },
      modifiedBy: { fullName: "" },
      lastModifiedOn: "",
      size: "0 MB",
      folderCount: 0,
      filesCount: 0,
      userCount: 0,
    } as ProjectFormData, // Ép kiểu defaultValues ở đây
  });

  const { control, handleSubmit, reset, setValue, formState } = form;

  const size = useWatch({ control, name: "size" });
  const folderCount = useWatch({ control, name: "folderCount" });
  const filesCount = useWatch({ control, name: "filesCount" });
  const userCount = useWatch({ control, name: "userCount" });
  const createdAt = useWatch({ control, name: "createdAt" });
  const createdBy = useWatch({ control, name: "createdBy" });
  const modifiedBy = useWatch({ control, name: "modifiedBy" });
  const lastModifiedOn = useWatch({ control, name: "lastModifiedOn" });

  /* ---------- Load project ---------- */

  async function loadProjects() {
    setLoading(true);
    const projectId = (await params).projectId;
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      const res = await get(`/projects/getProject/${projectId}`);
      if (res.success) {
        reset({
          ...res.result,
          startDate: res.result.startDate
            ? new Date(res.result.startDate)
            : null,
          endDate: res.result.endDate ? new Date(res.result.endDate) : null,
        });
        setThumbnail(res.result.thumbnail || null);
      } else {
        setErrorMessage(res.error);
      }
    } catch (e: any) {
      setErrorMessage(e.response.data.error);

      console.error("Failed to load topics list:", e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadProjects();
  }, []);
  /* ---------- Submit ---------- */
  const onSubmit = async (data: ProjectFormData) => {
    const id = localStorage.getItem("selectedProjectId");
    if (!id) return;
    console.log(data);

    setActionLoading(true);
    console.log("SAVE:", data);
    await put(`/projects/updateProject/${id}`, data);
    setActionLoading(false);
  };

  const leaveProject = async () => {
    const id = localStorage.getItem("selectedProjectId");
    if (!id) return;
    setActionLoading(true);
    const response = await put(`/projects/leaveProject/${id}`);

    if (response.success) {
      window.location.href = "/pages/projects";
    } else {
      alert(response.error);
    }
    setActionLoading(false);
  };

  const deleteProject = async () => {
    const id = localStorage.getItem("selectedProjectId");
    if (!id) return;
    setActionLoading(true);
    const response = await del(`/projects/deleteProject/${id}`);
    window.location.href = "/pages/projects";
  };

  const formatDateTimeBy = (value?: string, name?: string) => {
    if (!value) return "--";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "--";
    return `${format(d, "MMM dd, yyyy hh:mm a")} By ${name ?? "Unknown"}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-8 bg-[#f4f5f8] min-h-screen space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Project Details</h1>
            <Button
              type="submit"
              disabled={!formState.isDirty || actionLoading}>
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-4">
                    <Image
                      src={
                        thumbnail ||
                        "https://resources.connect.trimble.com/thumb/project.png"
                      }
                      width={64}
                      height={64}
                      alt="thumb"
                      className="rounded border"
                      loading="eager"
                    />
                    <div className="flex items-center gap-4">
                      {/* Button Upload new */}
                      <Button
                        className="hover:bg-blue-200 text-blue-500 hover:no-underline"
                        variant="link"
                        onClick={handleButtonClick}>
                        Upload new
                      </Button>

                      {/* Ẩn input file nhưng dùng ref để kích hoạt */}
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden" // Ẩn input file
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Created</strong>
                      <br />
                      {formatDateTimeBy(createdAt, createdBy?.fullName)}
                    </p>
                    <p className="mt-2">
                      <strong>Last modified</strong>
                      <br />
                      {formatDateTimeBy(lastModifiedOn, modifiedBy?.fullName)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SETTINGS */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {(["startDate", "endDate"] as const).map((name) => (
                    <FormField
                      key={name}
                      control={control}
                      name={name}
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              {name === "startDate" ? "Start date" : "End date"}
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {(() => {
                                    // Logic kiểm tra và ép kiểu nhanh ngay tại chỗ
                                    const dateValue =
                                      field.value instanceof Date
                                        ? field.value
                                        : field.value
                                        ? new Date(field.value as string)
                                        : null;

                                    if (
                                      dateValue &&
                                      !isNaN(dateValue.getTime())
                                    ) {
                                      return format(dateValue, "MMM dd, yyyy");
                                    }
                                    return "Pick a date";
                                  })()}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0">
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value instanceof Date
                                      ? field.value
                                      : undefined
                                  }
                                  onSelect={field.onChange} // QUAN TRỌNG: Phải có field.onChange
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        );
                      }}
                    />
                  ))}

                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-2 gap-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Storage</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>Size: {size}</p>
                  <p>Folders: {folderCount}</p>
                  <p>Files: {filesCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{userCount}</p>
                </CardContent>
              </Card>

              {/* LEAVE */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="border border-gray-300 bg-whie"
                    variant="secondary">
                    Leave project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will no longer have access.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={leaveProject}>
                      Leave
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* DELETE */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    Delete project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">
                      Delete project?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={deleteProject}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
