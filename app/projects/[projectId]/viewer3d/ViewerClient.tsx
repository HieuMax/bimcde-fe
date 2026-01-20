'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { Box, Layers, ClipboardCheck } from 'lucide-react';

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams()
  const searchParams = useSearchParams();

  const [state, setState] = React.useState('models');
  const ctaBtn = [
    { icon: <Box />, label: 'models' },
    { icon: <Layers />, label: 'layers' },
    { icon: <ClipboardCheck />, label: 'todos' },
  ];

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

    router.replace(`/projects/${projectId}/viewer3d`, { scroll: false });
  }, [ifcUrls, router]);

  return (
    // <div className="w-full h-full">
    //   <IfcViewer ifcUrls={ifcUrls} />
    // </div>

    <div className="flex ">
      <div className="w-10 min-h-full bg-gray-200">
        <div className="mt-[150]">
          {ctaBtn.map((item, index) => {
            const isActive = state == item.label;

            return (
              <span
                key={index}
                className={`flex justify-center cursor-pointer py-3 mb-2 ${
                  isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-black hover:bg-slate-600 hover:text-white'
                }`}
                onClick={() => setState(item.label)}
              >
                {item.icon}
              </span>
            );
          })}
        </div>
      </div>
      <div className="w-full h-full overflow-hidden">
        <IfcViewer
          ifcUrls={ifcUrls}
          state={state}
          projectId={projectId} />
      </div>
    </div>
  );
}
