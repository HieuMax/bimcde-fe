import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import ExplorerClient from "@/components/features/explorer/ExplorerClient";
import { explorerService } from "@/services/explorer.service";

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DataIndexPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const projectId = resolvedParams.projectId;

  const folderId = resolvedSearchParams.folderId || null;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["explorer", projectId, folderId],
    queryFn: () => explorerService.getContent(projectId, folderId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplorerClient projectId={projectId} folderId={folderId} />
    </HydrationBoundary>
  );
}
