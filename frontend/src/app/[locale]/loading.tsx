export default function Loading() {
  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-16 max-w-2xl rounded bg-stone-200" />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div className="h-52 rounded-2xl bg-stone-200" key={item} />)}
        </div>
      </div>
    </main>
  );
}
