import { AuthProvider } from "./context/authContext";
import "./global.css";
import type { Metadata } from "next";
import QueryProvider from "@/components/providers/QueryProvider";

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
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
