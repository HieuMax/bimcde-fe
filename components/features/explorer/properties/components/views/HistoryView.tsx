"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Folder,
  Download,
  FolderOpen,
  Loader2,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { filesize } from "filesize";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { IFile, IFolder } from "@/types/explorer";
import { explorerService } from "@/services/explorer.service";
import {
  buildFileHistoryRows,
  getAllFolderVersionsSortedNewestFirst,
} from "@/lib/explorer/fileVersionHistory";
import {
  resolveVersionRowThumbnailSrc,
  type VersionThumbRow,
} from "@/lib/explorer/fileThumbnail";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/explorer/uploadConstraints";

interface Props {
  item: IFile | IFolder;
  /** Project scope — required to open a revision in the project 2D/3D viewer. */
  projectId: string;
  onBack: () => void;
  /** When set, each file revision row can open Share pre-locked to that version. */
  onShareVersion?: (version: number) => void;
}

export default function HistoryView({
  item,
  projectId,
  onBack,
  onShareVersion,
}: Props) {
  const router = useRouter();
  const isFile = "mimeType" in item;
  const [resolvedFile, setResolvedFile] = useState<IFile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isFile) {
      setResolvedFile(null);
      setLoadingDetail(false);
      return;
    }
    const id = (item as IFile)._id;
    setResolvedFile(null);
    let cancelled = false;
    setLoadingDetail(true);
    explorerService
      .getFileDetail(id)
      .then((d) => {
        if (!cancelled) setResolvedFile(d as IFile);
      })
      .catch(() => {
        if (!cancelled) setResolvedFile(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFile, isFile ? (item as IFile)._id : ""]);

  const fileForList = isFile ? (resolvedFile ?? (item as IFile)) : null;
  const folderItem = !isFile ? (item as IFolder) : null;
  const currentVersionNum = isFile
    ? Number(fileForList?.currentVersion ?? (item as IFile).currentVersion ?? 0)
    : Number(
        folderItem?.currentVersion ??
          (folderItem?.versions?.length
            ? Math.max(...folderItem.versions.map((v) => v.version))
            : 0),
      );

  const fileHistoryRows =
    isFile && fileForList ? buildFileHistoryRows(fileForList) : [];
  const folderVersions = !isFile
    ? getAllFolderVersionsSortedNewestFirst(item as IFolder)
    : [];

  const handleOpenFileVersion = (ver: (typeof fileHistoryRows)[number]) => {
    if (!fileForList?._id || !projectId) {
      toast.error("Missing project context to open the viewer.");
      return;
    }

    const fileExt = fileForList.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return;

    const IFC_SET = new Set(["ifc"]);
    const DOC_SET = new Set<string>(
      ALLOWED_FILE_EXTENSIONS.filter((e) => e !== "ifc"),
    );

    if (IFC_SET.has(fileExt)) {
      const url = ver.location || fileForList.location;
      if (!url) {
        toast.error("No URL for this version.");
        return;
      }
      let locationUrl = url;
      try {
        const decoded = decodeURIComponent(url);
        if (/^https?:\/\//i.test(decoded)) {
          locationUrl = decoded;
        }
      } catch {
        /* keep original */
      }
      router.push(
        `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(JSON.stringify([locationUrl]))}`,
      );
      return;
    }

    if (DOC_SET.has(fileExt)) {
      const v = Number(ver.version);
      router.push(
        `/projects/${projectId}/viewer/${fileForList._id}?viewVersion=${encodeURIComponent(String(v))}`,
      );
      return;
    }

    toast.error("This file type cannot be opened in the project viewer.");
  };

  const handleDownloadFileVersion = async (
    ver: (typeof fileHistoryRows)[number],
  ) => {
    if (!fileForList?._id) return;

    try {
      await explorerService.downloadFileVersion(
        fileForList._id,
        Number(ver.version),
        ver.fileName || fileForList.name,
      );
    } catch (error) {
      console.error("Download version failed:", error);
      toast.error("Could not download this version");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border h-[70px] shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-2 text-foreground hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-medium text-foreground">
            Version history
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isFile && loadingDetail && (
            <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground text-xs border-b border-border/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Syncing full version list from server…
            </div>
          )}

          {isFile && fileHistoryRows.length > 0 ? (
            fileHistoryRows.map((ver, index) => {
              const versionUser = (() => {
                const uploader = ver.uploadedBy;
                if (typeof uploader === "string") return uploader;
                if (uploader && typeof uploader === "object") {
                  return uploader.fullName || uploader.email || "Unknown";
                }
                return "Unknown";
              })();
              const versionDate = ver.createdAt;
              const isCurrent = Number(ver.version) === currentVersionNum;

              return (
                <div key={`v-${ver.version}`}>
                  <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 relative overflow-hidden shrink-0 bg-slate-100 rounded-full flex items-center justify-center border">
                      <Image
                        src={
                          resolveVersionRowThumbnailSrc(
                            ver as VersionThumbRow,
                          ) ||
                          ver.location ||
                          "/placeholder-image.png"
                        }
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-medium text-sm text-foreground">
                          <span className="truncate inline align-middle">
                            V.{ver.version}
                            {ver.stageLabels.map((lab) => (
                              <span
                                key={lab}
                                className="ml-1.5 text-xs font-normal text-sky-800 bg-sky-100/90 px-1.5 py-0.5 rounded"
                              >
                                ({lab})
                              </span>
                            ))}
                            {" • "}
                            <span className="font-normal text-muted-foreground">
                              {ver.fileName}
                            </span>
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {versionUser}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-normal text-blue-600">
                            (current)
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground/70 text-xs mt-0.5">
                        {format(
                          new Date(versionDate ?? ver.createdAt ?? Date.now()),
                          "MMM dd, yyyy HH:mm",
                        )}
                        {` • ${filesize(ver.size ?? 0)}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenFileVersion(ver)}
                        title="Open this version"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => void handleDownloadFileVersion(ver)}
                        title="Download this version"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {onShareVersion && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => onShareVersion(Number(ver.version))}
                          title="Share this revision"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < fileHistoryRows.length - 1 && <Separator />}
                </div>
              );
            })
          ) : !isFile && folderVersions.length > 0 ? (
            folderVersions.map((ver, index) => {
              const isCurrent = Number(ver.version) === currentVersionNum;
              return (
                <div key={`v-${ver.version}`}>
                  <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 relative overflow-hidden shrink-0 bg-slate-100 rounded-full flex items-center justify-center border">
                      <Folder
                        size={20}
                        className="fill-gray-900 text-gray-900"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-medium text-sm text-foreground truncate">
                          V.{ver.version}
                          {isCurrent && (
                            <span className="ml-2 text-xs font-normal text-blue-600">
                              (current)
                            </span>
                          )}
                          {" • "}
                          <span className="font-normal text-muted-foreground">
                            {ver.name}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ver.updatedBy}
                      </p>
                      <p className="text-muted-foreground/70 text-xs mt-0.5">
                        {format(new Date(ver.createdAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  {index < folderVersions.length - 1 && <Separator />}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No history available.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
