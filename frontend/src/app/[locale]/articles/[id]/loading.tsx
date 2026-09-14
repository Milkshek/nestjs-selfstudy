export default function Loading() {
  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <article className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-6 w-40 rounded bg-stone-200" />
        <div className="h-16 rounded bg-stone-200" />
        <div className="h-72 rounded bg-stone-200" />
      </article>
    </main>
  );
}
