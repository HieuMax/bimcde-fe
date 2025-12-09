import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold text-neutral-500">Welcome to BIM CDE</h1>
      <p className="text-gray-600">Building Information Modeling - Common Data Environment</p>
      <Button>3D View</Button>
    </main>
  );
}