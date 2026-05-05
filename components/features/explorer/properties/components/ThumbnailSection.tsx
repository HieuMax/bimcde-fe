import { Folder, File } from "lucide-react";
import { IFile, IFolder } from "@/types/explorer";

export default function ThumbnailSection({ item }: { item: IFile | IFolder }) {
  const isFile = "mimeType" in item;

  return (
    <div className="flex items-center justify-center h-[150px] bg-slate-50">
      {isFile ? (
        <File size={64} className="text-gray-900" />
      ) : (
        <Folder size={64} className="fill-gray-900 text-gray-900" />
      )}
    </div>
  );
}