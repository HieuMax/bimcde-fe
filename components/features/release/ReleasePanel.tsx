"use client";

import React, { useState, useEffect } from "react";
import { IRelease } from "@/types/release";
import ReleaseDetailsView from "./views/ReleaseDetailsView";
import ReleaseEditView from "./views/ReleaseEditView";

interface ReleasePanelProps {
  release: IRelease;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  onUpdate: () => void;
}

export const ReleasePanel: React.FC<ReleasePanelProps> = ({
  release,
  onClose,
  onRename,
  onUpdate,
}) => {
  const [view, setView] = useState<"details" | "edit">("details");

  useEffect(() => {
    setView("details");
  }, [release._id]);

  return (
    <div className="w-full h-full flex flex-col bg-white border-l">
      {view === "details" ? (
        <ReleaseDetailsView
          release={release}
          onClose={onClose}
          onEdit={() => setView("edit")}
          onUpdate={onUpdate}
        />
      ) : (
        <ReleaseEditView
          release={release}
          onBack={() => setView("details")}
          onClose={onClose}
          onSave={async (newName) => {
            await onRename(newName);
            setView("details");
          }}
        />
      )}
    </div>
  );
};
