"use client";



import { useLayoutEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { explorerService } from "@/services/explorer.service";

import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Folder, ChevronRight, ArrowLeft, Loader2, X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";



interface Props {

  projectId: string;

  onBack: () => void;

  onClose: () => void;

  onConfirm: (destinationFolderId: string) => Promise<void>;

  isPromoting?: boolean;

}



/**
 * Pick the destination folder under 3. Published (after confirming the pre-publish checklist in the modal).
 */

export default function PromoteDestinationView({

  projectId,

  onBack,

  onClose,

  onConfirm,

  isPromoting,

}: Props) {

  const targetStage = "PUBLISHED" as const;

  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);

  const [rootFolderId, setRootFolderId] = useState<string | null>(null);

  const [navReady, setNavReady] = useState(false);



  const { data: rootData } = useQuery({

    queryKey: ["cde-root-folder", projectId, targetStage],

    queryFn: () =>

      explorerService.getCdeRootFolderId(projectId, targetStage),

  });



  useLayoutEffect(() => {

    if (rootData === undefined) {

      setNavReady(false);

      return;

    }

    const id = rootData.folderId ?? null;

    setRootFolderId(id);

    setBrowseFolderId(id);

    setNavReady(true);

  }, [rootData]);



  const { data, isLoading } = useQuery({

    queryKey: ["explorer-promote-nav", projectId, browseFolderId],

    queryFn: () =>

      explorerService.getContent(projectId, browseFolderId, "name", "asc"),

    enabled: navReady && browseFolderId !== null,

  });



  const subFolders = data?.subFolders || [];

  const currentFolderName =

    data?.currentFolder?.name ?? "3. Published";

  const parentId = data?.currentFolder?.parentId ?? null;



  const handlePromoteHere = async () => {

    if (browseFolderId == null) return;

    await onConfirm(browseFolderId);

  };



  const handleBackNav = () => {

    if (browseFolderId != null && rootFolderId != null && browseFolderId === rootFolderId) {

      onBack();

      return;

    }

    if (!browseFolderId) {

      onBack();

    } else if (parentId) {

      setBrowseFolderId(parentId);

    } else {

      onBack();

    }

  };



  const title = "Promote to Published";



  return (

    <div className="flex flex-col h-full min-h-0 bg-white">

      <div className="flex items-center justify-between p-4 border-b border-border h-[60px] shrink-0">

        <div className="flex items-center gap-2">

          <Button

            variant="ghost"

            size="icon"

            onClick={handleBackNav}

            className="h-8 w-8 -ml-2"

          >

            <ArrowLeft className="h-5 w-5" />

          </Button>

          <h2 className="text-lg font-semibold text-foreground truncate max-w-[200px]">

            {title}

          </h2>

        </div>

        <Button

          variant="ghost"

          size="icon"

          onClick={onClose}

          className="h-8 w-8 -mr-2"

        >

          <X className="h-5 w-5 text-muted-foreground" />

        </Button>

      </div>



      <div className="px-4 py-2 border-b border-border bg-slate-50 text-sm font-medium text-slate-700">

        {currentFolderName}

      </div>



      <div className="bg-amber-50 p-3 m-4 mb-2 rounded border border-amber-100 text-xs text-amber-950 leading-relaxed space-y-1">

        <p>

          Choose a folder under 3. Published. A copy of the file will be created there; the Shared file stays in place.

        </p>

        {rootData && !rootData.folderId && (

          <p className="text-red-700">

            CDE root folder not found. Ask an admin to verify project setup.

          </p>

        )}

      </div>



      <ScrollArea className="flex-1 min-h-0">

        <div className="flex flex-col p-2">

          {isLoading || !navReady || browseFolderId === null ? (

            <div className="space-y-2 p-2">

              <Skeleton className="h-8 w-full" />

              <Skeleton className="h-8 w-full" />

              <Skeleton className="h-8 w-full" />

            </div>

          ) : (

            subFolders.map((folder) => (

              <div

                key={folder._id}

                onClick={() => setBrowseFolderId(folder._id)}

                className="flex items-center justify-between p-3 rounded cursor-pointer transition-colors hover:bg-slate-100"

              >

                <div className="flex items-center gap-3 overflow-hidden">

                  <Folder className="size-5 text-slate-400 fill-slate-400 shrink-0" />

                  <span className="text-sm text-slate-700 truncate">{folder.name}</span>

                </div>

                <ChevronRight className="size-4 text-slate-400" />

              </div>

            ))

          )}



          {navReady &&

            browseFolderId !== null &&

            !isLoading &&

            subFolders.length === 0 && (

              <div className="text-center text-xs text-slate-400 py-10">

                No sub-folders — promote into this folder, or go back

              </div>

            )}

        </div>

      </ScrollArea>



      <div className="p-4 border-t border-border bg-white shrink-0">

        <Button

          className="w-full bg-amber-700 hover:bg-amber-800"

          onClick={handlePromoteHere}

          disabled={

            isPromoting ||

            !navReady ||

            browseFolderId === null ||

            (rootData !== undefined && !rootData.folderId)

          }

        >

          {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

          Promote here

        </Button>

      </div>

    </div>

  );

}

