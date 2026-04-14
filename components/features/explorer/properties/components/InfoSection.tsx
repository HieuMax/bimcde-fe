import { format } from "date-fns";
import { filesize } from "filesize";
import { useQuery } from "@tanstack/react-query";
import { IFile, IFolder } from "@/types/explorer";
import { explorerService } from "@/services/explorer.service";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <div className="text-foreground font-normal">{children}</div>
    </div>
  );
}

function fileCreatedByLabel(file: IFile): string {
  const v0 = file.versions?.[0];
  if (!v0?.uploadedBy) return "Unknown";
  if (typeof v0.uploadedBy === "string") return v0.uploadedBy;
  return v0.uploadedBy.fullName || "Unknown";
}

export default function InfoSection({
  item,
  onOpenHistory,
  projectId,
}: {
  item: IFile | IFolder;
  onOpenHistory: () => void;
  /** Required for folder “Modified” (subtree activity) */
  projectId?: string;
}) {
  const isFile = "mimeType" in item;
  const fileSize = isFile ? (item as IFile).size : (item as IFolder).totalSize;

  const file = isFile ? (item as IFile) : null;
  const folder = !isFile ? (item as IFolder) : null;

  const createdDate = file
    ? file.versions?.length
      ? file.versions[0].createdAt
      : file.updatedAt
    : folder?.createdAt ?? folder?.updatedAt ?? item.updatedAt;

  const { data: subtreeActivity, isLoading: subtreeLoading } = useQuery({
    queryKey: ["folder-subtree-activity", projectId, item._id],
    queryFn: () =>
      explorerService.getFolderSubtreeActivity(projectId!, item._id),
    enabled: !isFile && !!projectId && !!item._id,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const modifiedDateStr = file?.updatedAt ?? item.updatedAt;
  const modifiedByFile = file?.modifiedBy || "Unknown";
  const modifiedDateFolder =
    subtreeActivity?.lastModifiedAt ?? folder?.updatedAt ?? modifiedDateStr;
  const modifiedByFolder =
    subtreeActivity?.lastModifiedBy ??
    folder?.createdBy ??
    "Unknown";

  const createdAtIso = createdDate ?? item.updatedAt;

  return (
    <div className="p-4 space-y-5">
      <h3 className="text-base font-medium text-foreground">Details</h3>
      <div className="space-y-4">
        <DetailItem label="Version">
          <div className="flex items-center gap-1">
            <span>
              {(item as IFile).currentVersion ||
                (item as IFolder).versions?.length ||
                1}
            </span>
            <button
              onClick={onOpenHistory}
              className="text-blue-600 hover:underline ml-1 font-normal cursor-pointer"
            >
              See history
            </button>
          </div>
        </DetailItem>
        <DetailItem label="Size">
          {filesize(fileSize || 0) as string}
        </DetailItem>
        <DetailItem label="Created">
          {format(new Date(createdAtIso ?? ""), "MMM dd, yyyy HH:mm")}{" "}
          by{" "}
          {isFile
            ? fileCreatedByLabel(file!)
            : folder?.createdBy || "Unknown"}
        </DetailItem>
        <DetailItem label="Modified">
          {isFile ? (
            <>
              {format(
                new Date(modifiedDateStr ?? ""),
                "MMM dd, yyyy HH:mm",
              )}{" "}
              by {modifiedByFile}
            </>
          ) : subtreeLoading ? (
            <span className="text-muted-foreground">Loading…</span>
          ) : (
            <>
              {format(
                new Date(modifiedDateFolder ?? ""),
                "MMM dd, yyyy HH:mm",
              )}{" "}
              by {modifiedByFolder}
            </>
          )}
        </DetailItem>
      </div>
    </div>
  );
}
