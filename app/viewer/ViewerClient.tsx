'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';

export default function ViewerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ifcUrls = useMemo(() => {
    const raw = searchParams.get('urls');
    if (!raw) return [];

    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return [];
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ifcUrls.length) return;

    router.replace('/viewer', { scroll: false });
  }, [ifcUrls, router]);

  return (
    <div className="w-full h-full">
      <IfcViewer ifcUrls={ifcUrls} />
    </div>
  );
}
