import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/app/context/SidebarProvider";
import Sidebar from "@/components/layout/sidebar";

// Đây là Server Component (mặc định)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[#F3F3F7] relative transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
