import "./global.css";

import type { Metadata } from "next";
import Header from "./components/UI/header";
import { SidebarProvider } from "./components/UI/sidebarProvider";

export const metadata: Metadata = {
  title: "BIM CDE",
  description: "Building Information Modeling - Common Data Environment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <SidebarProvider>

          <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">

            <div className="h-16 flex-none fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
              <Header />
            </div>

            <div className="flex-1 flex overflow-hidden pt-16">

              <main className="flex-1 overflow-hidden">
                {children}
              </main>

            </div>
          </div>

        </SidebarProvider>
      </body>
    </html>
  );
}
