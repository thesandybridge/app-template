import Link from "next/link";
import { getAllDocs } from "@/lib/docs";

export const metadata = {
  title: "Documentation",
  description: "Project documentation",
};

export default async function DocsPage() {
  const docs = await getAllDocs();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Documentation</h1>

      {docs.length === 0 ? (
        <p className="text-muted-foreground">
          No documentation found. Add MDX files to <code>content/docs/</code>.
        </p>
      ) : (
        <div className="grid gap-4">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <h2 className="font-semibold mb-1">{doc.title}</h2>
              {doc.description && (
                <p className="text-sm text-muted-foreground">{doc.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
