'use client';

import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ViewerPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const raw = searchParams.get('urls');

  const ifcUrls: string[] = raw ? JSON.parse(decodeURIComponent(raw)) : [];

    useEffect(() => {
      if (!ifcUrls?.length) return;
  
      router.replace('/viewer', { scroll: false });
    }, []);
  return (
    <div className="w-full h-full">
      <IfcViewer ifcUrls={ifcUrls} />
    </div>
  );
}
