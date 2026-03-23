'use client';
import React from 'react';
import {
  ArrowLeft,
  Hand,
  MousePointerSquareDashed,
  Download,
  MoreHorizontal,
  Maximize,
} from 'lucide-react';

export default function DetailToolbar({
  name,
  onBack,
  onDownload,
  onToggleFullscreen,
}: {
  name: string;
  onBack: () => void;
  onDownload: () => void;
  onToggleFullscreen?: () => void;
}) {
  return (
    <header
      className="
        w-full h-14 px-6
        bg-white border-b-2 border-slate-300
        flex items-center justify-between
        shadow-sm
      "
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="
            flex items-center gap-2 px-3 py-2 rounded-lg
            hover:bg-gray-100 transition
            text-gray-700
          "
        >
          <ArrowLeft size={18} className="text-gray-700" />
          <span className="font-medium">Back</span>
        </button>

        {/* Mode indicator / Title box */}
        <div
          className="
            flex items-center gap-2
            px-3 py-2 rounded-lg
            bg-gray-50
            border border-gray-200
            text-gray-700
            text-sm
            shadow-inner
          "
        >
          <Hand size={18} className="text-gray-500" />
          <MousePointerSquareDashed size={18} className="text-gray-500" />

          <span className="font-medium truncate max-w-[32vw]">
            {name}
          </span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-1">
        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="
            w-12 h-10 flex items-center justify-center
            rounded-lg hover:bg-gray-100
            transition text-gray-700
          "
          title="Fullscreen"
        >
          <Maximize size={18} />
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          className="
            w-10 h-10 flex items-center justify-center
            rounded-lg hover:bg-gray-100
            transition text-gray-700
          "
          title="Download"
        >
          <Download size={18} />
        </button>

        {/* More */}
        <button
          className="
            w-10 h-10 flex items-center justify-center
            rounded-lg hover:bg-gray-100
            transition text-gray-700
          "
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  );
}
