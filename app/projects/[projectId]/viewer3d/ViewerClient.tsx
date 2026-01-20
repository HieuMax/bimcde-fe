'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { Box, Layers, ClipboardCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar/Navbar';

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams()
  const searchParams = useSearchParams();

  const [state, setState] = React.useState('models');
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const handleBack = () => {
    router.push(`/projects/${projectId}/data`);
  };

  const handleRefresh = () => {
    console.log("Refresh Action Clicked");
  };

  const handleAction = () => {
    console.log("Primary Action Clicked");
  };

  useEffect(() => {
    if (!ifcUrls.length) return;

    router.replace(`/projects/${projectId}/viewer3d`, { scroll: false });
  }, [ifcUrls, router]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAction={handleAction}
      />
      {/* handle navbar and extend when click item can create todo related to it */}
      <div className="flex">
        <div className="w-10 min-h-full bg-gray-200">
          <div className="mt-[150]">
            <span
              className={`flex justify-center cursor-pointer py-3 mb-2 text-black hover:bg-slate-600 hover:text-white`}
            >
              {isCollapsed ? (
                <ChevronRight
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsCollapsed(false)}
                />
              ) : (
                <ChevronLeft style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)} />
              )}
            </span>

            {ctaBtn.map((item, index) => {
              const isActive = state == item.label;

              return (
                <span
                  key={index}
                  className={`flex justify-center cursor-pointer py-3 mb-2 ${isActive
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
            isCollapsed={isCollapsed}
            ifcUrls={ifcUrls}
            state={state}
            projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
