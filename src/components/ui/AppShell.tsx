'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/plan', label: 'Plan Board', group: 'Daily' },
  { href: '/orders', label: 'Orders & Calls', group: 'Daily' },
  { href: '/config/neighborhoods', label: 'Neighborhoods', group: 'Master Data' },
  { href: '/config/clusters', label: 'Clusters', group: 'Master Data' },
  { href: '/config/fleet', label: 'Fleet', group: 'Master Data' },
  { href: '/config/rules', label: 'Dispatch Rules', group: 'Master Data' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const groups = ['Daily', 'Master Data'];

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col">
        <div className="px-5 pt-6 pb-8">
          <Link href="/" className="block group">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-1">
              Dispatch
            </p>
            <h1 className="font-serif text-xl font-medium tracking-tight text-[var(--text)] group-hover:opacity-70 transition-opacity">
              AutoPlanner
            </h1>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-2 mb-2 text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)]">
                {group}
              </p>
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`
                          block px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-all duration-150
                          ${active
                            ? 'bg-[var(--text)] text-[var(--text-inverse)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-muted)]">v0.1 · Modular</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex-shrink-0 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between px-6">
          <div className="text-sm text-[var(--text-secondary)]">
            {/* Page title injected by each page if needed */}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">Session local</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
