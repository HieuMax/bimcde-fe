"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Header() {
  return (
    <header className="h-14 border-b bg-white flex items-center px-4 sticky top-0 z-50">
      <Link href="/projects">
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>
    </header>
  );
}
