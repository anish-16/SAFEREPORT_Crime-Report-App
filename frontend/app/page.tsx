import Link from 'next/link';
import { Lock, Zap, MessageSquare, ArrowRight, PhoneCall, ShieldCheck } from 'lucide-react';

/**
 * Landing page — original SafeReport content (hero copy, feature cards,
 * stats, trust badge) with a refreshed visual treatment.
 */

const FEATURES = [
  {
    title: 'Military-Grade Encryption',
    description: 'Your identity is protected with state-of-the-art encryption protocols',
    icon: Lock,
  },
  {
    title: 'Real-time Processing',
    description: 'Instant verification and secure routing of all reports',
    icon: Zap,
  },
  {
    title: 'Secure Communication',
    description: 'Two-way anonymous channel with law enforcement',
    icon: MessageSquare,
  },
];

const STATS = [
  { value: '100K+', label: 'Reports Filed' },
  { value: '100%', label: 'Anonymity Rate' },
  { value: '24/7', label: 'Support Available' },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* hero */}
      <section className="relative py-20 text-center sm:py-28">
        <div className="mx-auto mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure and Anonymous Reporting
        </div>
        <h1 className="mx-auto max-w-3xl animate-fade-up text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl sm:leading-[1.05] md:text-7xl">
          Report Incident
          <span className="block bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
            Protect Identity
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Make your community safer without compromising your safety. Our advanced encryption
          ensures your identity remains completely anonymous.
        </p>
        <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/submit-report"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/25 transition hover:brightness-110"
          >
            Make Anonymous Report
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white/5 px-8 text-sm font-semibold text-foreground ring-1 ring-inset ring-white/10 transition hover:bg-white/10"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* features grid */}
      <section className="mt-24 grid gap-6 sm:grid-cols-3 sm:mt-40">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="card-base group relative animate-fade-up overflow-hidden p-8 transition-all hover:border-accent/40 hover:bg-zinc-800/60"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-5 inline-flex rounded-xl bg-accent/10 p-3 text-accent transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* emergency diary band */}
      <section className="card-base mt-16 animate-fade-up overflow-hidden border-accent/30 sm:mt-24">
        <div className="grid items-center gap-6 p-8 sm:grid-cols-[1fr_auto] sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              <PhoneCall className="h-3.5 w-3.5" /> New · Emergency Diary
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Every emergency number for your city — in one place
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Type your city and the country auto-selects itself. You get police, fire, ambulance
              and helpline numbers with a call button that opens <em>your phone&apos;s dialer</em> —
              SafeReport never places the call for you.
            </p>
            <Link
              href="/emergency-diary"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition hover:brightness-110"
            >
              Open Emergency Diary
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="hidden h-32 w-32 items-center justify-center rounded-3xl bg-accent/10 text-accent sm:flex">
            <PhoneCall className="h-14 w-14" />
          </div>
        </div>
      </section>

      {/* stats section */}
      <section className="mt-16 rounded-2xl border border-white/10 bg-zinc-900/70 p-8 sm:mt-24">
        <div className="grid gap-y-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-foreground sm:text-4xl">{stat.value}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* trust badge */}
      <div className="mt-16 mb-20 flex justify-center sm:mt-24">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/70 px-5 py-2 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Trusted by Law Enforcement Nationwide
        </div>
      </div>
    </div>
  );
}
