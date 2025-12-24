import { format } from "date-fns";
import { filesize } from "filesize";
import { IFile, IFolder } from "@/types/explorer";

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

export default function InfoSection({
  item,
  onOpenHistory,
}: {
  item: IFile | IFolder;
  onOpenHistory: () => void;
}) {
  const isFile = "mimeType" in item;
  const fileSize = isFile ? (item as IFile).size : (item as IFolder).totalSize;
  const createdDate =
    isFile && (item as IFile).versions?.length > 0
      ? (item as IFile).versions[0].createdAt
      : item.updatedAt;

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
          {format(new Date(createdDate), "MMM dd, yyyy HH:mm")} by{" "}
          {(item as IFile).modifiedBy || "Unknown"}
        </DetailItem>
        <DetailItem label="Modified">
          {format(new Date(item.updatedAt), "MMM dd, yyyy HH:mm")} by{" "}
          {(item as IFile).modifiedBy || "Unknown"}
        </DetailItem>
      </div>
    </div>
  );
}
