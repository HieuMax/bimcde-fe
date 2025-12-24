// detailTab.tsx
'use client';

import { FileItem, ViewItem } from "@/app/types/api";

type Props = {
  file?: FileItem | null;
  view?: ViewItem | null;
};

export default function FileDetailTab({ file, view }: Props) {

  if (!file && !view) {
    return <div className="p-4 text-sm text-gray-500">No item selected</div>;
  }

  // ===== ƯU TIÊN VIEW =====
  if (view) {
    return (
      <div className="p-4 text-sm">
        <h3 className="text-lg font-semibold mb-3">View details</h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500">Name</div>
            <div className="font-medium">{view.name}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Description</div>
            <div>{view.description || '--'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Assigned to</div>
            <div>{view.assignedTo || '--'}</div>
          </div>

          {/* <div>
            <div className="text-xs text-gray-500">Created</div>
            <div>{view.createdAt || '--'}</div>
          </div> */}
        </div>
      </div>
    );
  }

  // ===== FALLBACK FILE =====
  return (
    <div className="p-4 text-sm">
      <h3 className="text-lg font-semibold mb-3">File details</h3>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <div className="font-medium">{file!.name}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Description</div>
          <div>{file!.description || '--'}</div>
        </div>
      </div>
    </div>
  );
}
