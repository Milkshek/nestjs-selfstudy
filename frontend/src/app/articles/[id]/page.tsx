import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/comments-section";
import { SiteHeader } from "@/components/site-header";
import { getCommentsByArticle, getPublishedArticle } from "@/lib/api/articles";
import { formatDateTime } from "@/lib/date";
import { messages, type Locale } from "@/lib/i18n";
import { headers } from "next/headers";
import { getPublicApiUrl } from "@/lib/public-api-url";

type ArticlePageProperties = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProperties) {
  const locale: Locale = (await headers()).get("x-locale") === "en" ? "en" : "fr";
  const message = messages[locale];
  const { id } = await params;
  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId <= 0) {
    notFound();
  }

  const [article, comments] = await Promise.all([
    getPublishedArticle(articleId),
    getCommentsByArticle(articleId),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader locale={locale} />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link
          className="inline-flex cursor-pointer rounded px-3 py-2 text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-95"
          href={`/${locale}`}
        >
          {message.back}
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-amber-700">
          {article.category?.name ?? "Sans catégorie"}
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">{article.title}</h1>
        {article.imagePath && (
          <Image
            alt=""
            className="mt-6 aspect-video w-full rounded-lg object-cover"
            height={540}
            src={`${getPublicApiUrl()}${article.imagePath}`}
            unoptimized
            width={960}
          />
        )}
        {article.publishedAt && (
          <p className="mt-4 text-sm text-stone-500">{message.publishedAt} {formatDateTime(article.publishedAt, locale)}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span className="rounded-full bg-stone-200 px-2 py-1 text-xs" key={tag.slug}>
              {tag.name}
            </span>
          ))}
        </div>
        <p className="mt-10 whitespace-pre-wrap text-lg leading-8 text-stone-700">{article.content}</p>

        <CommentsSection articleId={article.id} initialComments={comments} />
      </article>
    </main>
  );
}
