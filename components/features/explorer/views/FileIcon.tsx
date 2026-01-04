import { FileText, FileImage, FileCode, FileSpreadsheet } from "lucide-react";

export default function FileIcon({
  mimeType,
  className,
}: {
  mimeType?: string;
  className?: string;
}) {
  if (!mimeType) return <FileText className={className} />;

  if (mimeType.startsWith("image/"))
    return <FileImage className={`${className} text-black`} />;
  if (mimeType.includes("pdf"))
    return <FileText className={`${className} text-red-500`} />;
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className={`${className} text-green-600`} />;

  return <FileCode className={`${className} text-blue-600`} />;
}
