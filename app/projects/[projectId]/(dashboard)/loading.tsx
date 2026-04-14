import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      className="min-h-[40vh] flex flex-col items-center justify-center p-4 md:p-6"
      aria-busy
      aria-label="Loading page"
    >
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
