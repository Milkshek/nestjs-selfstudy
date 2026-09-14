"use client";

import { FormEvent, useEffect, useState } from "react";
import { createTaxonomy, deleteComment, deleteTaxonomy, getCategories, getCommentsForModeration, getTags, updateComment, updateTaxonomy, type ModerationComment, type Taxonomy, type TaxonomyResource } from "@/lib/api/articles";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminPage() {
  const { accessToken, user } = useAuthenticationStore();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const isEnglish = locale === "en";
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [resource, setResource] = useState<TaxonomyResource>("categories");
  const [comments, setComments] = useState<ModerationComment[]>([]);

  async function load() {
    const [loadedCategories, loadedTags] = await Promise.all([getCategories(), getTags()]);
    setCategories(loadedCategories);
    setTags(loadedTags);
    if (accessToken) setComments(await getCommentsForModeration(accessToken));
  }
  useEffect(() => {
    void Promise.all([getCategories(), getTags()]).then(([loadedCategories, loadedTags]) => {
      setCategories(loadedCategories);
      setTags(loadedTags);
    });
  }, []);
  useEffect(() => { if (accessToken) void getCommentsForModeration(accessToken).then(setComments); }, [accessToken]);
  useEffect(() => { if (!accessToken || user?.role !== "ADMIN") router.replace(`/${locale}`); }, [accessToken, locale, router, user?.role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    if (!(await createTaxonomy(accessToken, resource, { name, slug }))) { toast.error(isEnglish ? "Unable to save the taxonomy." : "Impossible d’enregistrer la taxonomie."); return; }
    setName(""); setSlug(""); await load(); toast.success(isEnglish ? "Taxonomy created." : "Taxonomie créée.");
  }
  async function remove(currentResource: TaxonomyResource, id: number) {
    if (!accessToken || !(await deleteTaxonomy(accessToken, currentResource, id))) { toast.error(isEnglish ? "Unable to delete the taxonomy." : "Impossible de supprimer la taxonomie."); return; }
    await load(); toast.success(isEnglish ? "Taxonomy deleted." : "Taxonomie supprimée.");
  }
  async function edit(item: Taxonomy) {
    const nextName = window.prompt(isEnglish ? "Name" : "Nom", item.name);
    const nextSlug = window.prompt("Slug", item.slug);
    if (!accessToken || !nextName || !nextSlug) return;
    if (!(await updateTaxonomy(accessToken, resource, item.id, { name: nextName, slug: nextSlug }))) { toast.error(isEnglish ? "Unable to update the taxonomy." : "Impossible de modifier la taxonomie."); return; }
    await load(); toast.success(isEnglish ? "Taxonomy updated." : "Taxonomie modifiée.");
  }
  async function moderate(comment: ModerationComment) {
    if (!accessToken) return;
    const content = window.prompt(isEnglish ? "Comment" : "Commentaire", comment.content);
    if (!content) return;
    if (!(await updateComment(accessToken, comment.articleId, comment.id, content))) { toast.error(isEnglish ? "Unable to update the comment." : "Impossible de modifier le commentaire."); return; }
    setComments(await getCommentsForModeration(accessToken));
  }
  async function removeComment(comment: ModerationComment) {
    if (!accessToken || !(await deleteComment(accessToken, comment.articleId, comment.id))) { toast.error(isEnglish ? "Unable to delete the comment." : "Impossible de supprimer le commentaire."); return; }
    setComments((current) => current.filter((item) => item.id !== comment.id));
  }
  if (!accessToken || user?.role !== "ADMIN") return null;
  const list = resource === "categories" ? categories : tags;
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-bold">{isEnglish ? "Administration" : "Administration"}</h1><form className="mt-8 flex flex-wrap gap-3" onSubmit={submit}><select value={resource} onChange={(event) => setResource(event.target.value as TaxonomyResource)}><option value="categories">{isEnglish ? "Categories" : "Catégories"}</option><option value="tags">{isEnglish ? "Tags" : "Étiquettes"}</option></select><input className="rounded border p-2" required placeholder={isEnglish ? "Name" : "Nom"} value={name} onChange={(event) => setName(event.target.value)} /><input className="rounded border p-2" required placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} /><button className="rounded bg-stone-900 px-4 py-2 text-white" type="submit">{isEnglish ? "Create" : "Créer"}</button></form><ul className="mt-8 space-y-2">{list.map((item) => <li className="flex justify-between rounded border p-3" key={item.id}>{item.name}<span><button className="mr-3 text-stone-700" onClick={() => void edit(item)} type="button">{isEnglish ? "Edit" : "Modifier"}</button><button className="text-amber-700" onClick={() => void remove(resource, item.id)} type="button">{isEnglish ? "Delete" : "Supprimer"}</button></span></li>)}</ul><section className="mt-12"><h2 className="text-2xl font-bold">{isEnglish ? "Comments" : "Commentaires"}</h2><ul className="mt-4 space-y-2">{comments.map((comment) => <li className="rounded border p-3" key={comment.id}><p>{comment.content}</p><small>{comment.author.email}</small><span className="ml-4"><button onClick={() => void moderate(comment)} type="button">{isEnglish ? "Edit" : "Modifier"}</button><button className="ml-3 text-amber-700" onClick={() => void removeComment(comment)} type="button">{isEnglish ? "Delete" : "Supprimer"}</button></span></li>)}</ul></section></main>;
}
