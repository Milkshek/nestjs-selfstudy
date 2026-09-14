"use client";

import { usePathname } from "next/navigation";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void error;
  const isEnglish = usePathname().startsWith("/en");

  return (
    <main className="min-h-screen bg-stone-50 p-8 text-stone-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8">
        <h1 className="text-2xl font-bold">{isEnglish ? "Something went wrong" : "Une erreur est survenue"}</h1>
        <p className="mt-3 text-stone-600">
          {isEnglish ? "We could not load this page. Please try again." : "Impossible de charger cette page. Réessaie."}
        </p>
        <button
          className="mt-6 cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95"
          type="button"
          onClick={reset}
        >
          {isEnglish ? "Try again" : "Réessayer"}
        </button>
      </section>
    </main>
  );
}
