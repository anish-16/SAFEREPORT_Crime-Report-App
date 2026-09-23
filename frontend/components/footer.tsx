import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>
            SafeReport — anonymous incident reporting with{' '}
            <span className="text-foreground">on-device intelligence</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Reports carry no identity · Evidence analyzed locally — no AI API keys, no third-party
          calls.
        </p>
      </div>
    </footer>
  );
}
