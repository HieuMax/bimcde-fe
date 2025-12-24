'use client';

import { useParams, useRouter } from 'next/navigation';
import DetailView2D from '@/app/components/DataComponent/view2DManagement/viewHome';
import DetailToolbar from '@/app/components/DataComponent/view2DManagement/toolbar2D';

export default function FileViewerPage() {
  const params = useParams() as {
    id: string;
    fileId: string;
  };
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <DetailToolbar
        name="File viewer"
        onBack={() => router.push(`/project/${params.id}`)}
        onDownload={() => {}}
      />

      <div className="flex-1">
        <DetailView2D mode="file" fileId={params.fileId} />
      </div>
    </div>
  );
}
