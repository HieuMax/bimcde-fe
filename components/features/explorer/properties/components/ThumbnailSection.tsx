import Image from "next/image";
import { Folder } from "lucide-react";
import { IFile, IFolder } from "@/types/explorer";
import {
  resolveExplorerFileThumbnailSrc,
  shellFileThumbnailKey,
} from "@/lib/explorer/fileThumbnail";

export default function ThumbnailSection({ item }: { item: IFile | IFolder }) {
  const isFile = "mimeType" in item;

  const fileSrc = isFile
    ? resolveExplorerFileThumbnailSrc(item as IFile)
    : "/placeholder-image.png";

  const fileVersionKey = isFile
    ? shellFileThumbnailKey(item as IFile)
    : (item as IFolder)._id;

  return (
    <div className="flex items-center justify-center h-[150px] bg-slate-50">
      {isFile ? (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            key={fileVersionKey}
            src={fileSrc}
            alt={item.name}
            fill
            sizes="300px"
            className="object-cover"
          />
        </div>
      ) : (
        <Folder size={64} className="fill-gray-900 text-gray-900" />
      )}
    </div>
  );
}
