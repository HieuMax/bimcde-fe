"use client";

import React, { useState } from "react";
import { IView } from "@/types/view";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Pencil, 
  Trash2, 
  Box, 
  FileText, 
  MoreVertical,
  Calendar,
  User,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ViewPropertiesPanelProps {
  view: IView;
  onClose: () => void;
  onRename: (view: IView, newName: string) => void;
  onDelete: (view: IView) => void;
  onOpen: (view: IView) => void;
}

export const ViewPropertiesPanel: React.FC<ViewPropertiesPanelProps> = ({
  view,
  onClose,
  onRename,
  onDelete,
  onOpen,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(view.name);

  const handleSaveRename = () => {
    if (newName.trim() !== view.name) {
      onRename(view, newName);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[60px]">
        {isEditing ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
            className="flex-1 border border-blue-500 rounded px-2 py-1 text-sm mr-2 focus:outline-none"
            autoFocus
          />
        ) : (
          <h2 className="text-base font-medium text-gray-900 truncate pr-2" title={view.name}>
            {view.name}
          </h2>
        )}
        
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-6">
          {/* Thumbnail Section */}
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
            {view.thumbnailUrl ? (
              <img
                src={view.thumbnailUrl}
                alt={view.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                {view.type === "3D" ? (
                   <Box className="w-16 h-16 mb-2 text-blue-300" />
                ) : (
                   <FileText className="w-16 h-16 mb-2 text-red-300" />
                )}
                <span className="text-sm">No Thumbnail</span>
              </div>
            )}
            
            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Button 
                    className="bg-white/90 text-black hover:bg-white shadow-sm"
                    onClick={() => onOpen(view)}
                >
                    Open View
                </Button>
            </div>
          </div>

          <Separator />

          {/* Actions Toolbar */}
          <div className="flex items-center justify-around p-2 bg-gray-50/50">
             <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-blue-50 hover:text-blue-600" onClick={() => onOpen(view)}>
                <Box className="h-5 w-5" />
                <span className="text-[10px] uppercase font-semibold">Open</span>
             </Button>
             <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(view)}>
                <Trash2 className="h-5 w-5" />
                <span className="text-[10px] uppercase font-semibold">Delete</span>
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5" />
                        <span className="text-[10px] uppercase font-semibold">More</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    {/* Add more actions here if needed */}
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          <Separator />

          {/* Details Section */}
          <div className="p-4 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Details</h3>
            
            <div className="space-y-4">
                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <Box className="h-3 w-3" /> Type
                    </p>
                    <p className="text-gray-900 font-medium pl-5">{view.type} View</p>
                </div>

                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                         <FileText className="h-3 w-3" /> Description
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                        {view.description || <span className="text-gray-400 italic">No description</span>}
                    </p>
                </div>

                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                         <User className="h-3 w-3" /> Created By
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                        {(view.createdBy as any)?.fullName || "Unknown"}
                    </p>
                </div>

                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Created Date
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                        {format(new Date(view.createdAt), "MMM dd, yyyy HH:mm")}
                    </p>
                </div>

                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Last Modified
                    </p>
                    <p className="text-gray-900 font-medium pl-5">
                        {format(new Date(view.updatedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                </div>

                <div className="text-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <Share2 className="h-3 w-3" /> Shared With
                    </p>
                    <div className="pl-5">
                        {view.sharedWith?.isPublic ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Public
                            </span>
                        ) : (
                            <span className="text-gray-600">
                                {view.sharedWith?.users?.length 
                                    ? `${view.sharedWith.users.length} users` 
                                    : "Private (Only me)"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
