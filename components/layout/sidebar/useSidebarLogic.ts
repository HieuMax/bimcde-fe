import { usePathname, useParams } from "next/navigation";
import { useCallback } from "react";

export function useSidebarLogic() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params?.projectId as string;

  const basePath = projectId ? `/projects/${projectId}` : "";

  const checkIsActive = useCallback(
    (pathSegment: string) => {
      if (!pathname || !basePath) return false;
      const targetPath = `${basePath}/${pathSegment}`;
      return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
    },
    [pathname, basePath]
  );

  return {
    projectId,
    basePath,
    pathname,
    checkIsActive,
  };
}
