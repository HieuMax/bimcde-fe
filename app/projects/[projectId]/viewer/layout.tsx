// projects/[projectId]/viewer/layout.tsx
export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#F3F3F7] overflow-hidden">
      {children}
    </div>
  );
}
