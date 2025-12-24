import Image from "next/image";
import { Folder } from "lucide-react";
import { IFile, IFolder } from "@/types/explorer";

export default function ThumbnailSection({ item }: { item: IFile | IFolder }) {
  const isFile = "mimeType" in item;

  return (
    <div className="flex items-center justify-center h-[150px] bg-slate-50">
      {isFile ? (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={item.thumbnail || "/placeholder-image.png"}
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
