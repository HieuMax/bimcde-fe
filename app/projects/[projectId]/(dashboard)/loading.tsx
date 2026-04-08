import { Skeleton } from "@/components/ui/skeleton";
export default function DashboardLoading() {
  return (
    <div className="min-h-[40vh] p-4 md:p-6" aria-busy aria-label="Loading page">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-56 bg-white/80" />
        <Skeleton className="h-4 w-3/4 max-w-md bg-white/80" />
        <Skeleton className="h-[min(50vh,420px)] w-full rounded-lg bg-white/80" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          <Skeleton className="h-24 rounded-lg bg-white/80" />
          <Skeleton className="h-24 rounded-lg bg-white/80" />
          <Skeleton className="h-24 rounded-lg bg-white/80 sm:col-span-2 lg:col-span-1" />
        </div>
      </div>
    </div>
  );
}