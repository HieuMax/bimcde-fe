import { AuthProvider } from "./context/authContext";
import "./global.css";
import type { Metadata } from "next";
import QueryProvider from "@/components/providers/QueryProvider";
import { Roboto } from "next/font/google";
import { Toaster } from 'sonner';

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIM CDE",
  description: "Building Information Modeling - Common Data Environment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" style={{ zIndex: 99999 }} />
      </body>
    </html>
  );
}
