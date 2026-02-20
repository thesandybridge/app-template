import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDocBySlug, getDocSlugs } from "@/lib/docs";
import { MDXContent } from "@thesandybridge/ui/mdx";
import { CopyablePre } from "@/components/copyable-pre";

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

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>{doc.title}</h1>
        {doc.description && (
          <p className="lead text-muted-foreground">{doc.description}</p>
        )}
        <MDXContent source={doc.content} components={{ pre: CopyablePre }} />
      </article>
    </>
  );
}
