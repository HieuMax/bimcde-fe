'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import DetailView2D from '@/app/components/DataComponent/view2DManagement/viewHome';
import DetailToolbar from '@/app/components/DataComponent/view2DManagement/toolbar2D';

export default function Page() {
  const params = useParams() as { id: string; viewId: string };
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== TOP TOOLBAR ===== */}
      <DetailToolbar
        name="Loading..."
        onBack={() => router.push(`/project/${params.id}`)}
        onDownload={() => {}}
      />

      {/* ===== 2D MANAGEMENT (API REAL) ===== */}
      <div className="flex-1">
        <DetailView2D />
      </div>
    </div>
  );
}
