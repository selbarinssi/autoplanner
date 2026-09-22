export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="animate-fade-in text-center max-w-lg">
        <p className="text-xs tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4">
          Dispatch System
        </p>
        <h1 className="font-serif text-5xl font-medium tracking-tight text-[var(--text)] mb-3">
          AutoPlanner
        </h1>
        <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-10">
          Configurable multi-criteria order dispatch with neighborhood clustering.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/plan"
            className="px-5 py-2.5 bg-[var(--text)] text-[var(--text-inverse)] text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-soft)] transition-colors"
          >
            Open Plan Board
          </a>
          <a
            href="/config"
            className="px-5 py-2.5 border border-[var(--border-strong)] text-[var(--text)] text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Configuration
          </a>
        </div>
      </div>
    </main>
  );
}
