import Image from "next/image";
import Link from "next/link";
import { getPublishedArticles, type ArticleFilters } from "@/lib/api/articles";
import { formatDateTime } from "@/lib/date";
import { messages, type Locale } from "@/lib/i18n";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { getPublicApiUrl } from "@/lib/public-api-url";

type HomePageProps = { searchParams: Promise<ArticleFilters> };

function getFilterHref(locale: Locale, filters: ArticleFilters): string {
  const searchParameters = new URLSearchParams();
  if (filters.category) searchParameters.set("category", filters.category);
  if (filters.tag) searchParameters.set("tag", filters.tag);
  if (filters.search) searchParameters.set("search", filters.search);
  if (filters.sortBy) searchParameters.set("sortBy", filters.sortBy);
  if (filters.sortDirection) searchParameters.set("sortDirection", filters.sortDirection);
  if (filters.page && filters.page > 1) searchParameters.set("page", String(filters.page));
  const query = searchParameters.toString();
  return `/${locale}${query ? `?${query}` : ""}`;
}

async function Home({ locale, filters }: { locale: Locale; filters: ArticleFilters }) {
  const paginatedArticles = await getPublishedArticles(filters);
  const { data: articles, meta } = paginatedArticles;
  const message = messages[locale];
  const categories = Array.from(
    new Map(articles.flatMap((article) => (article.category ? [[article.category.slug, article.category.name]] : []))).entries(),
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">{locale === "fr" ? "Le journal technique" : "The technical journal"}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold">
          {locale === "fr" ? "Des articles pour comprendre, construire et partager." : "Articles to understand, build, and share."}
        </h1>
        <form action={`/${locale}`} className="mt-8 flex flex-wrap gap-2">
          <input className="rounded border border-stone-300 bg-white px-3 py-2" defaultValue={filters.search} name="search" placeholder={locale === "fr" ? "Rechercher un article" : "Search articles"} />
          {filters.category && <input name="category" type="hidden" value={filters.category} />}
          {filters.tag && <input name="tag" type="hidden" value={filters.tag} />}
          <select className="rounded border border-stone-300 bg-white px-3 py-2" defaultValue={filters.sortBy ?? "id"} name="sortBy"><option value="id">{locale === "fr" ? "Date" : "Date"}</option><option value="title">{locale === "fr" ? "Titre" : "Title"}</option><option value="publishedAt">{locale === "fr" ? "Publication" : "Publication"}</option></select>
          <select className="rounded border border-stone-300 bg-white px-3 py-2" defaultValue={filters.sortDirection ?? "DESC"} name="sortDirection"><option value="DESC">{locale === "fr" ? "Décroissant" : "Descending"}</option><option value="ASC">{locale === "fr" ? "Croissant" : "Ascending"}</option></select>
          <button className="cursor-pointer rounded bg-stone-900 px-4 py-2 text-white hover:bg-stone-700" type="submit">{locale === "fr" ? "Filtrer" : "Filter"}</button>
        </form>
        <nav aria-label={locale === "fr" ? "Filtres d'articles" : "Article filters"} className="mt-8 flex flex-wrap gap-2">
          <Link
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${!filters.category && !filters.tag ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200"}`}
            href={getFilterHref(locale, { ...filters, category: undefined, tag: undefined, page: undefined })}
          >
            {locale === "fr" ? "Tous les articles" : "All articles"}
          </Link>
          {categories.map(([slug, name]) => (
            <Link
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${filters.category === slug ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200"}`}
              href={getFilterHref(locale, { ...filters, category: slug, page: undefined })}
              key={slug}
            >
              {name}
            </Link>
          ))}
        </nav>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" key={article.id}>
            {article.imagePath && (
              <Image
                alt=""
                className="mb-5 aspect-video w-full rounded-lg object-cover"
                height={540}
                src={`${getPublicApiUrl()}${article.imagePath}`}
                unoptimized
                width={960}
              />
            )}
            {article.category ? (
              <Link className="cursor-pointer text-xs font-semibold uppercase text-amber-700 hover:underline" href={getFilterHref(locale, { ...filters, category: article.category.slug, page: undefined })}>
                {article.category.name}
              </Link>
            ) : (
              <p className="text-xs font-semibold uppercase text-amber-700">{locale === "fr" ? "Sans catégorie" : "Uncategorized"}</p>
            )}
            <h2 className="mt-4 text-2xl font-bold">{article.title}</h2>
            <p className="mt-3 text-stone-600">{article.content}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link className="cursor-pointer rounded-full bg-stone-100 px-2 py-1 text-xs transition hover:bg-stone-200" href={getFilterHref(locale, { ...filters, tag: tag.slug, page: undefined })} key={tag.slug}>
                  {tag.name}
                </Link>
              ))}
            </div>
            {article.publishedAt && (
              <p className="mt-4 text-sm text-stone-500">{message.publishedAt} {formatDateTime(article.publishedAt, locale)}</p>
            )}
            <Link
              className="mt-6 inline-flex cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95"
              href={`/${locale}/articles/${article.id}`}
            >
              {message.read}
            </Link>
          </article>
        ))}
        {articles.length === 0 && <p>{locale === "fr" ? "Aucun article publié." : "No published articles."}</p>}
      </section>
      {meta.totalPages > 1 && (
        <nav aria-label={locale === "fr" ? "Pagination des articles" : "Article pagination"} className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-6 pb-20">
          {meta.page > 1 ? (
            <Link className="cursor-pointer rounded border border-stone-300 bg-white px-4 py-2 transition hover:bg-stone-100" href={getFilterHref(locale, { ...filters, page: meta.page - 1 })}>
              {locale === "fr" ? "Précédent" : "Previous"}
            </Link>
          ) : <span className="rounded border border-stone-200 px-4 py-2 text-stone-400">{locale === "fr" ? "Précédent" : "Previous"}</span>}
          <span className="text-sm text-stone-600">{locale === "fr" ? `Page ${meta.page} sur ${meta.totalPages}` : `Page ${meta.page} of ${meta.totalPages}`}</span>
          {meta.page < meta.totalPages ? (
            <Link className="cursor-pointer rounded border border-stone-300 bg-white px-4 py-2 transition hover:bg-stone-100" href={getFilterHref(locale, { ...filters, page: meta.page + 1 })}>
              {locale === "fr" ? "Suivant" : "Next"}
            </Link>
          ) : <span className="rounded border border-stone-200 px-4 py-2 text-stone-400">{locale === "fr" ? "Suivant" : "Next"}</span>}
        </nav>
      )}
    </main>
  );
}

export default async function RootPage({ searchParams }: HomePageProps) {
  const locale = (await headers()).get("x-locale") === "en" ? "en" : "fr";
  return <Home locale={locale} filters={await searchParams} />;
}
