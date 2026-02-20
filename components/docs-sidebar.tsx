"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocLink {
  slug: string;
  title: string;
  description?: string;
}

export function DocsSidebar({ docs }: { docs: DocLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/50 p-6 lg:block sticky top-14 self-start max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
      <nav className="space-y-1">
        <Link
          href="/docs"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/docs"
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Overview
        </Link>
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === `/docs/${doc.slug}`
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            {doc.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
