'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  Phone,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/submit-report', label: 'Submit Report' },
  { href: '/track-report', label: 'Track Report' },
  { href: '/emergency-diary', label: 'Emergency Diary' },
  { href: '/how-it-works', label: 'How It Works' },
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

  const initials = user
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Safe<span className="text-primary">Report</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                pathname === l.href
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
          {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
            <Link
              href="/admin"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                pathname === '/admin'
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition hover:bg-white/[0.08]"
                aria-label="Open profile menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
                  {initials}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-medium sm:block">
                  {user.name}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 animate-fade-up rounded-2xl border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
                  <div className="border-b border-white/10 px-3 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <span className="mt-2 inline-block rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                      {user.role}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    My Reports & Status
                  </Link>
                  <Link
                    href="/submit-report"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Submit New Report
                  </Link>
                  <Link
                    href="/emergency-diary"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Emergency Diary
                  </Link>
                  <p className="mt-1 flex items-start gap-1.5 border-t border-white/10 px-3 pt-2.5 text-[10px] leading-snug text-muted-foreground">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    Private to you — your reports stay anonymous to everyone else.
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/auth/signin"
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Get Started
              </Link>
            </div>
          )}

          <button
            className="rounded-lg p-2 text-muted-foreground md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'block rounded-lg px-3 py-2.5 text-sm font-medium',
                pathname === l.href ? 'bg-white/10' : 'text-muted-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
          {!user && !loading && (
            <div className="mt-2 flex gap-2">
              <Link href="/auth/signin" className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm">
                Sign in
              </Link>
              <Link href="/auth/signup" className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
