// projects/[projectId]/viewer/layout.tsx
export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#F3F3F7] overflow-hidden">
      {children}
    </div>
  );
}
