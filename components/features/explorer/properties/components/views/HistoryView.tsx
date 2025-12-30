"use client";

import Image from "next/image";
import { ArrowLeft, Folder, Download } from "lucide-react";
import { format } from "date-fns";
import { filesize } from "filesize";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { IFile, IFolder, IFileVersion, IFolderVersion } from "@/types/explorer";

interface Props {
  item: IFile | IFolder;
  onBack: () => void;
}

export default function HistoryView({ item, onBack }: Props) {
  const isFile = "mimeType" in item;

  const versions = [...(item.versions || [])].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Header History */}
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
          {versions.length > 0 ? (
            versions.map((ver, index) => {
              // Type Guard & Casting
              const isFileVersion = isFile;

              const versionName = isFileVersion
                ? (ver as IFileVersion).fileName
                : (ver as IFolderVersion).name;

              const versionUser = isFileVersion
                ? (ver as IFileVersion).uploadedBy
                : (ver as IFolderVersion).updatedBy;

              const versionSize = isFileVersion
                ? (ver as IFileVersion).size
                : 0;
              const versionDate = ver.createdAt;
              const versionLocation = isFileVersion
                ? (ver as IFileVersion).location
                : null;

              return (
                <div key={index}>
                  <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    {/* Thumbnail / Icon Version */}
                    <div className="w-10 h-10 relative overflow-hidden shrink-0 bg-slate-100 rounded-full flex items-center justify-center border">
                      {isFile ? (
                        <Image
                          src={item.thumbnail || "/placeholder-image.png"}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Folder
                          size={20}
                          className="fill-gray-900 text-gray-900"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-medium text-sm text-foreground truncate">
                          V.{ver.version} •{" "}
                          <span className="font-normal text-muted-foreground">
                            {versionName}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {versionUser}
                      </p>
                      <p className="text-muted-foreground/70 text-xs mt-0.5">
                        {format(new Date(versionDate), "MMM dd, yyyy HH:mm")}
                        {isFile && ` • ${filesize(versionSize)}`}
                      </p>
                    </div>

                    {/* Download Action */}
                    {isFile && versionLocation && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(versionLocation, "_blank")}
                        title="Download this version"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {index < versions.length - 1 && <Separator />}
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
