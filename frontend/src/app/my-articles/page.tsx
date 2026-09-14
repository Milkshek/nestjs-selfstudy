"use client";

import { useEffect, useState } from "react";
import {
  createArticle,
  deleteArticle,
  getMyArticles,
  getCategories,
  getTags,
  setArticlePublication,
  updateArticle,
  uploadArticleImage,
  type Article,
  type Taxonomy,
} from "@/lib/api/articles";
import { formatDateTime } from "@/lib/date";
import { messages } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { toast } from "sonner";

const inputClassName =
  "mt-3 w-full rounded border border-stone-300 bg-white p-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200";
const primaryCtaClassName =
  "cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300";
const secondaryCtaClassName =
  "mt-2 cursor-pointer rounded px-3 py-2 text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-95";

type TaxonomyFieldsProps = {
  locale: "fr" | "en";
  categories: Taxonomy[];
  tags: Taxonomy[];
  selectedCategorySlug: string;
  selectedTagSlugs: string[];
  onCategoryChange: (slug: string) => void;
  onTagSlugsChange: (slugs: string[]) => void;
};

function TaxonomyFields({
  locale,
  categories,
  tags,
  selectedCategorySlug,
  selectedTagSlugs,
  onCategoryChange,
  onTagSlugsChange,
}: TaxonomyFieldsProps) {
  function toggleTag(slug: string) {
    onTagSlugsChange(
      selectedTagSlugs.includes(slug)
        ? selectedTagSlugs.filter((item) => item !== slug)
        : [...selectedTagSlugs, slug],
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="block text-sm font-medium">
        {locale === "fr" ? "Catégorie" : "Category"}
        <select className={inputClassName} value={selectedCategorySlug} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">{locale === "fr" ? "Aucune catégorie" : "No category"}</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium">{locale === "fr" ? "Étiquettes" : "Tags"}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm" key={tag.slug}>
              <input checked={selectedTagSlugs.includes(tag.slug)} type="checkbox" onChange={() => toggleTag(tag.slug)} />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export default function MyArticlesPage() {
  const locale = usePathname().startsWith("/en") ? "en" : "fr";
  const message = messages[locale].myArticles;
  const accessToken = useAuthenticationStore((state) => state.accessToken);
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedCategorySlug, setEditedCategorySlug] = useState("");
  const [editedTagSlugs, setEditedTagSlugs] = useState<string[]>([]);
  const [editedImage, setEditedImage] = useState<File | null>(null);

  useEffect(() => {
    if (accessToken) {
      void getMyArticles(accessToken).then(setArticles);
    }
  }, [accessToken]);

  useEffect(() => {
    void Promise.all([getCategories(), getTags()]).then(([loadedCategories, loadedTags]) => {
      setCategories(loadedCategories);
      setTags(loadedTags);
    });
  }, []);

  if (!accessToken) {
    return <main className="p-12">{locale === "fr" ? "Connecte-toi pour gérer tes articles." : "Log in to manage your articles."}</main>;
  }

  const authenticatedAccessToken = accessToken;

  async function submit() {
    const article = await createArticle(authenticatedAccessToken, title, content, {
      categorySlug: categorySlug || undefined,
      tagSlugs,
    });

    if (!article) {
      toast.error("Impossible de créer l’article.");
      return;
    }

    const articleWithImage = image ? await uploadArticleImage(authenticatedAccessToken, article.id, image) : article;
    setArticles((current) => [articleWithImage ?? article, ...current]);
    setTitle("");
    setContent("");
    setCategorySlug("");
    setTagSlugs([]);
    setImage(null);
    toast.success("Brouillon créé.");
  }

  async function publish(article: Article) {
    const updated = await setArticlePublication(
      authenticatedAccessToken,
      article.id,
      !article.publishedAt,
    );

    if (!updated) {
      toast.error("Impossible de modifier la publication.");
      return;
    }

    setArticles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    toast.success(updated.publishedAt ? "Article publié." : "Article repassé en brouillon.");
  }

  function startEditing(article: Article) {
    setEditingArticleId(article.id);
    setEditedTitle(article.title);
    setEditedContent(article.content);
    setEditedCategorySlug(article.category?.slug ?? "");
    setEditedTagSlugs(article.tags.map((tag) => tag.slug));
    setEditedImage(null);
  }

  async function saveArticle(article: Article) {
    const updated = await updateArticle(
      authenticatedAccessToken,
      article.id,
      editedTitle,
      editedContent,
      { categorySlug: editedCategorySlug || undefined, tagSlugs: editedTagSlugs },
    );

    if (!updated) {
      toast.error("Impossible de modifier l’article.");
      return;
    }

    const articleWithImage = editedImage
      ? await uploadArticleImage(authenticatedAccessToken, article.id, editedImage)
      : updated;

    setArticles((current) => current.map((item) => (item.id === updated.id ? articleWithImage ?? updated : item)));
    setEditingArticleId(null);
    setEditedImage(null);
    if (editedImage && !articleWithImage) {
      toast.error(locale === "fr" ? "Article modifié, mais l’image n’a pas pu être envoyée." : "Article updated, but the image could not be uploaded.");
      return;
    }

    toast.success(locale === "fr" ? "Article modifié." : "Article updated.");
  }

  async function removeArticle(article: Article) {
    if (!window.confirm(`Supprimer définitivement « ${article.title} » ?`)) {
      return;
    }

    if (!(await deleteArticle(authenticatedAccessToken, article.id))) {
      toast.error("Impossible de supprimer l’article.");
      return;
    }

    setArticles((current) => current.filter((item) => item.id !== article.id));
    toast.success("Article supprimé.");
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">{message.title}</h1>

      <section className="mt-8 rounded border p-5">
        <h2 className="font-bold">{message.newDraft}</h2>
        <input
          className={inputClassName}
          placeholder={message.titlePlaceholder}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className={`${inputClassName} min-h-32`}
          placeholder={message.contentPlaceholder}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
          <p className="font-medium">{locale === "fr" ? "Image de couverture" : "Cover image"}</p>
          <label className="mt-3 inline-flex cursor-pointer rounded bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stone-900" htmlFor="article-image">
            {locale === "fr" ? "Ajouter une image" : "Add an image"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="article-image"
              type="file"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-sm text-stone-600">
            {image?.name ?? (locale === "fr" ? "PNG, JPEG ou WebP, 5 Mo maximum." : "PNG, JPEG, or WebP, 5 MB maximum.")}
          </p>
        </div>
        <TaxonomyFields locale={locale} categories={categories} tags={tags} selectedCategorySlug={categorySlug} selectedTagSlugs={tagSlugs} onCategoryChange={setCategorySlug} onTagSlugsChange={setTagSlugs} />
        <button
          className={`mt-3 ${primaryCtaClassName}`}
          disabled={!title.trim() || !content.trim()}
          type="button"
          onClick={() => void submit()}
        >
          {message.create}
        </button>
      </section>

      <div className="mt-8 space-y-3">
        {articles.map((article) => (
          <article className="rounded border p-4" key={article.id}>
            {editingArticleId === article.id ? (
              <>
                <input
                  className={inputClassName}
                  value={editedTitle}
                  onChange={(event) => setEditedTitle(event.target.value)}
                />
                <textarea
                  className={`${inputClassName} min-h-32`}
                  value={editedContent}
                  onChange={(event) => setEditedContent(event.target.value)}
                />
                <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
                  <p className="font-medium">{locale === "fr" ? "Image de couverture" : "Cover image"}</p>
                  <label className="mt-3 inline-flex cursor-pointer rounded bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stone-900" htmlFor={`article-${article.id}-image`}>
                    {locale === "fr" ? "Changer l’image" : "Change image"}
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      id={`article-${article.id}-image`}
                      type="file"
                      onChange={(event) => setEditedImage(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="mt-2 text-sm text-stone-600">
                    {editedImage?.name ?? (locale === "fr" ? "PNG, JPEG ou WebP, 5 Mo maximum." : "PNG, JPEG, or WebP, 5 MB maximum.")}
                  </p>
                </div>
                <TaxonomyFields locale={locale} categories={categories} tags={tags} selectedCategorySlug={editedCategorySlug} selectedTagSlugs={editedTagSlugs} onCategoryChange={setEditedCategorySlug} onTagSlugsChange={setEditedTagSlugs} />
                <div className="mt-3 flex gap-2">
                  <button
                    className={primaryCtaClassName}
                    disabled={!editedTitle.trim() || !editedContent.trim()}
                    type="button"
                    onClick={() => void saveArticle(article)}
                  >
                    Enregistrer
                  </button>
                  <button
                    className={secondaryCtaClassName}
                    type="button"
                    onClick={() => { setEditingArticleId(null); setEditedImage(null); }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <strong>{article.title}</strong>
                <p>
                  {article.publishedAt ? `${locale === "fr" ? "Publié le" : "Published on"} ${formatDateTime(article.publishedAt, locale)}` : message.draft}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  {article.category?.name ?? (locale === "fr" ? "Sans catégorie" : "No category")}
                  {article.tags.length > 0 && ` · ${article.tags.map((tag) => tag.name).join(", ")}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className={secondaryCtaClassName}
                    type="button"
                    onClick={() => void publish(article)}
                  >
                    {article.publishedAt ? message.unpublish : message.publish}
                  </button>
                  <button className={secondaryCtaClassName} type="button" onClick={() => startEditing(article)}>
                    {message.edit}
                  </button>
                  <button className={secondaryCtaClassName} type="button" onClick={() => void removeArticle(article)}>
                    {message.delete}
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
        {articles.length === 0 && <p>{message.empty}</p>}
      </div>
    </main>
  );
}
