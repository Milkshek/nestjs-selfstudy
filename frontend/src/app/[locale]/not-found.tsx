import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFoundPage() {
  const isEnglish = (await headers()).get("x-locale") === "en";
  const locale = isEnglish ? "en" : "fr";

  return (
    <main className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8">
        <h1 className="text-2xl font-bold">{isEnglish ? "Page not found" : "Page introuvable"}</h1>
        <p className="mt-3 text-stone-600">
          {isEnglish ? "This article may not exist or is not published." : "Cet article n’existe pas ou n’est pas publié."}
        </p>
        <Link className="mt-6 inline-flex cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95" href={`/${locale}`}>
          {isEnglish ? "Back to articles" : "Retour aux articles"}
        </Link>
      </section>
    </main>
  );
}
