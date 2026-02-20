import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDocBySlug, getDocSlugs } from "@/lib/docs";
import { MDXContent } from "@thesandybridge/ui/mdx";
import { docsMDXComponents } from "@/lib/mdx-components";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return { title: "Not Found" };
  }

  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <>
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to docs
      </Link>

      <div className="space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
          {doc.description && (
            <p className="text-muted-foreground">{doc.description}</p>
          )}
        </div>
        <MDXContent source={doc.content} components={docsMDXComponents} />
      </div>
    </>
  );
}
