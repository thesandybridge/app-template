"use client";

import Link from "next/link";
import { ThemePicker } from "@/components/theme-picker";

export function Navbar() {
  return (
    <nav className="border-border/50 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="font-semibold">
          {{project_name}}
        </Link>

        <div className="flex items-center gap-2">
          <ThemePicker />
        </div>
      </div>
    </nav>
  );
}
