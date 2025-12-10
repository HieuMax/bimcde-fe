import "./global.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
