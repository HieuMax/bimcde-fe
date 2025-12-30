"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { EllipsisVertical, Edit2, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IComment } from "@/types/comment";

interface Props {
  comment: IComment;
  isOwner: boolean;
  onUpdate: (data: { id: string; content: string }) => void;
  onDelete: (id: string) => void;
}

export default function CommentItem({
  comment,
  isOwner,
  onUpdate,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSave = () => {
    if (!editContent.trim()) return;
    onUpdate({ id: comment._id, content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const author = comment.createdBy;
  // --- MODE 1: EDITING ---
  if (isEditing) {
    return (
      <div className="flex gap-3 animate-in fade-in duration-200">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>
            {author?.fullName?.substring(0, 1).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="bg-slate-50 rounded-[14px] border-slate-200 focus-visible:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <div className="flex gap-3 text-sm ml-1">
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-700 hover:underline font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editContent.trim()}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium disabled:opacity-50 disabled:no-underline transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MODE 2: VIEWING ---
  return (
    <div className="flex gap-3 group relative hover:bg-slate-50/50 p-1 -ml-1 rounded-lg transition-colors">
      <Avatar className="h-8 w-8 mt-0.5 border border-slate-100">
        <AvatarImage src={author?.avatar} />
        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
          {author?.fullName?.substring(0, 2).toUpperCase() || "UN"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header: Name + Time */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-slate-900 truncate">
            {author?.fullName}
          </span>
          <span
            className="text-xs text-slate-400 shrink-0"
            title={format(new Date(comment.createdAt), "PPpp")}
          >
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap wrap-break-words leading-relaxed">
          {comment.content}
        </p>
      </div>

      {/* Action Menu */}
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all absolute right-1 top-1 focus:opacity-100 data-[state=open]:opacity-100 hover:bg-slate-200"
            >
              <EllipsisVertical className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(comment._id)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
