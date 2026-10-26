'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, LayoutDashboard, FileText, Menu, X, Phone, Settings2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/submit-report', label: 'File a report' },
  { href: '/dashboard', label: 'My reports' },
  { href: '/track-report', label: 'Track' },
  { href: '/emergency-diary', label: 'Emergency numbers' },
  { href: '/how-it-works', label: 'How it works' },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push('/');
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const initials = user
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const tab = (href: string) =>
    cn(
      'relative px-1 py-4 text-step-small font-semibold transition',
      pathname === href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      pathname === href &&
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
    );

  return (
    <header className="sticky top-0 z-50 bg-muted">
      <div className="mx-auto flex h-12 max-w-[1088px] items-center justify-between gap-6 px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-step-body font-extrabold tracking-[-0.04em]"
        >
          <span aria-hidden className="h-3.5 w-3.5 shrink-0 bg-accent" />
          SafeReport
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={tab(l.href)}>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Link href="/settings" className={tab('/settings')}>
                AI settings
              </Link>
              <Link href="/admin" className={tab('/admin')}>
                Admin
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {loading ? (
            <div className="h-7 w-24 bg-muted" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 py-1 text-step-small font-semibold transition hover:text-accent"
                aria-label="Open profile menu"
              >
                <span className="flex h-7 w-7 items-center justify-center bg-primary text-step-small font-semibold text-primary-foreground">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate sm:block">{user.name}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 border border-border bg-card p-2 shadow-2xl" data-taste-skill-ignore="a real overlay menu keeps its lift"
                >
                  <div className="px-3 py-2.5">
                    <p className="truncate text-step-small font-semibold">{user.name}</p>
                    <p className="truncate text-step-small text-muted-foreground">{user.email}</p>
                    <span className="mt-1.5 inline-block bg-muted px-1.5 py-0.5 text-step-small font-semibold text-muted-foreground">
                      {user.role}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-step-small transition hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    My reports &amp; status
                  </Link>
                  <Link
                    href="/submit-report"
                    className="flex items-center gap-2 px-3 py-2 text-step-small transition hover:bg-muted"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    File a new report
                  </Link>
                  <Link
                    href="/emergency-diary"
                    className="flex items-center gap-2 px-3 py-2 text-step-small transition hover:bg-muted"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Emergency numbers
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-step-small transition hover:bg-muted"
                    >
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      AI settings
                    </Link>
                  )}
                  <p className="mt-2 bg-muted px-3 py-2 text-step-small leading-snug text-muted-foreground">
                    Reports are anonymous: no name, email or phone is written into them.
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-step-small font-semibold text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/submit-report"
                className="bg-primary px-4 py-2 text-step-small font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                File a report
              </Link>
            </div>
          )}

          <button
            className="p-1 text-muted-foreground md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="bg-muted px-5 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('block py-2.5 text-step-body font-semibold', pathname === l.href ? 'text-foreground' : 'text-muted-foreground')}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/settings" className="block py-2.5 text-step-body font-semibold text-muted-foreground">
              AI settings
            </Link>
          )}
          {!user && !loading && (
            <div className="mb-2 mt-2">
              <Link href="/submit-report" className="block flex-1 bg-primary px-4 py-2.5 text-center text-step-body font-semibold text-primary-foreground">
                File a report
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
