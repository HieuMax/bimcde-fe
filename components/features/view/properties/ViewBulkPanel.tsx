"use client";

import React from "react";
import { IView } from "@/types/view";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Box, FileText } from "lucide-react";

interface ViewBulkPanelProps {
  selectedViews: IView[];
  onClose: () => void;
  onDeselect: (id: string) => void;
  onDelete: (views: IView[]) => void;
}

export const ViewBulkPanel: React.FC<ViewBulkPanelProps> = ({
  selectedViews,
  onClose,
  onDeselect,
  onDelete,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-l shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          {selectedViews.length} Selected Items
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Actions List */}
      <div className="p-4 space-y-2 border-b border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
          onClick={() => onDelete(selectedViews)}
        >
          <Trash2 className="h-5 w-5" />
          Delete ({selectedViews.length})
        </Button>
      </div>

      {/* Selected Items List */}
      <div className="p-4 pb-2">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Selected Views
        </h3>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {selectedViews.map((view) => (
            <div
              key={view._id}
              className="flex items-center justify-between group py-2 px-2 hover:bg-gray-50 rounded transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Icon */}
                {view.type === "3D" ? (
                  <Box className="h-5 w-5 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500 shrink-0" />
                )}
                
                <span className="text-sm text-gray-700 truncate font-medium">
                  {view.name}
                </span>
              </div>

              {/* Deselect Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                onClick={() => onDeselect(view._id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
