import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold text-neutral-500">Welcome to BIM CDE</h1>
      <p className="text-gray-600">Building Information Modeling - Common Data Environment</p>
      <Link href="/viewer">
        <Button>3D View</Button>
      </Link>
    </main>
  );
}