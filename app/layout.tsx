import { AuthProvider } from "./context/authContext";
import "./globals.css";
import type { Metadata } from "next";
import QueryProvider from "@/components/providers/QueryProvider";
import { Roboto } from "next/font/google";

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
    <html lang="en" className={`${roboto.variable} h-full`}>
      <body className="h-full overflow-hidden">
        <QueryProvider>
          <AuthProvider>
            <div className="w-full h-full min-h-0">
              {children}
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
