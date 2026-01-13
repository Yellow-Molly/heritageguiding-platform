import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 text-center">
      <main className="max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          HeritageGuiding
        </h1>
        <p className="text-lg text-slate-600">
          Discover Stockholm with expert heritage guides. Private and group tours in Swedish,
          English, and German.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none"
          >
            Admin Panel
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Foundation setup complete. More features coming in Phase 2.
        </p>
      </main>
    </div>
  )
}
