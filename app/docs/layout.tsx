import { getAllDocs } from "@/lib/docs";
import { DocsSidebar } from "@/components/docs-sidebar";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await getAllDocs();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1">
      <DocsSidebar docs={docs} />
      <div className="min-w-0 flex-1 px-6 py-8">
        {children}
      </div>
    </div>
  );
}
