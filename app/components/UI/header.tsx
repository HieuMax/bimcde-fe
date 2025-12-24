"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BellDot, LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectMeta = {
  id: string;
  title?: string;
  name?: string
};

export default function Header() {
  const pathname = usePathname() || "/";
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  const [loadingTitle, setLoadingTitle] = useState(false);

  const match = pathname.match(/^\/(projects?)\/([^\/]+)(?:\/|$)/);
  const projectId = match ? match[2] : null;

  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    async function load() {
      setProjectTitle(null);
      if (!projectId) return;
      setLoadingTitle(true);

      try {
        const res = await fetch(`/projects/${projectId}`);
        if (!mounted) return;
        if (res.ok) {
          const json: ProjectMeta = await res.json();
          if (json?.title) {
            setProjectTitle(json.title);
            setLoadingTitle(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load project meta", err);
      }

      if (mounted) {
        setProjectTitle(`Project ${projectId}`);
        setLoadingTitle(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

    const handleAllProjects = () => {
      router.push('/');
    };

  return (
    <header className="w-full bg-white border-b-gray-900 shadow-sm flex items-center justify-between px-4 h-18 shrink-0 ">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleAllProjects}>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-blue-950"><LoaderPinwheel size={30}/></div>
          <div className="text-lg font-semibold">BIM HEHEHE</div>
        {title && <span className="ml-4 text-sm italic">{title}</span>}
        </div>

        {projectId && (
          <div className="ml-4">
            {loadingTitle ? (
              <div className="text-sm text-gray-500 italic">Loading project...</div>
            ) : (
              <div className="text-sm font-medium italic"></div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button title="Notifications" className="p-2 rounded hover:bg-gray-100"><BellDot className="text-yellow-500 font-bold"/></button>

        <div className="flex items-center gap-3 px-2 py-1 rounded hover:bg-gray-50">
          <img src="/img/URV.png" alt="avatar" className="w-9 h-9 rounded-full object-cover" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" fill="%23999"/><text x="50%" y="55%" font-size="16" fill="white" text-anchor="middle" font-family="Arial">TU</text></svg>'; }} />
        </div>
      </div>
    </header>
  );
}
