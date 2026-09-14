export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const messages = {
  fr: { login: "Se connecter", myArticles: { title: "Mes articles", newDraft: "Nouveau brouillon", titlePlaceholder: "Titre", contentPlaceholder: "Contenu", create: "Créer l’article", draft: "Brouillon", publish: "Publier", unpublish: "Dépublier", edit: "Modifier", delete: "Supprimer", empty: "Aucun article." }, read: "Lire l’article", back: "Retour aux articles", publishedAt: "Publié le", comments: "Commentaires", emptyComments: "Aucun commentaire pour le moment." },
  en: { login: "Log in", myArticles: { title: "My articles", newDraft: "New draft", titlePlaceholder: "Title", contentPlaceholder: "Content", create: "Create article", draft: "Draft", publish: "Publish", unpublish: "Unpublish", edit: "Edit", delete: "Delete", empty: "No articles." }, read: "Read article", back: "Back to articles", publishedAt: "Published on", comments: "Comments", emptyComments: "No comments yet." },
} as const;
