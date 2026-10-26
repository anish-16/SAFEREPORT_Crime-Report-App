'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const KEY = 'sr-theme';

/** Reads the theme set by the inline script in <body> (or system preference). */
function isDark() {
  return document.documentElement.classList.contains('dark');
}

/**
 * Light / dark switch for the header. The initial class is applied before
 * paint by the inline script in the root layout, so this only reflects and
 * flips it — no flash, no hydration mismatch.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDark());
    // keep in sync if the OS theme changes while no explicit choice is stored
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* storage blocked — follow the OS anyway */
      }
      setDark(isDark());
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      /* storage blocked — the choice just won't persist */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition hover:border-accent/50 hover:text-accent"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="sr-only">{dark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </button>
  );
}
