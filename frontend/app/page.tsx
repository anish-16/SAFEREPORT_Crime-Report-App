'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { api } from '@/lib/api';

/**
 * Landing page — the drawn direction "The page is the object": the site is
 * SafeReport's own case file. Hero = the file itself (cropped by the fold),
 * features = stacking colour sheets, how-it-works = a printed slip with a
 * torn edge, proof = the printed field list, stats = the ledger column,
 * cta = the reply card. Photographs credited in the footer.
 */

const SHEETS: {
  name: string;
  body: string;
  img: string;
  alt: string;
  video?: string;
  poster?: string;
  theme: 'dark' | 'warm' | 'light';
}[] = [
  {
    name: 'File it without a name',
    body: 'The form never asks who you are. Your report leaves the browser with a random key that only this device holds, so the file can find its way back to you and to nobody else.',
    img: '/sheet-anonymous.jpg',
    alt: 'Silhouetted people standing at tall windows overlooking a city',
    theme: 'dark' as const,
  },
  {
    name: 'Two layers of analysis',
    body: 'The built-in engine classifies the incident, scores its severity and checks the evidence for duplicates. Add any AI key under AI settings and your chosen model drafts the same file alongside it.',
    img: '/sheet-intelligence.jpg',
    alt: 'A curving glass and steel lattice roof seen in black and white',
    theme: 'warm' as const,
  },
  {
    name: 'Watch every stamp',
    body: 'Auto-triage, review, action, closure: each change is stamped into a timeline. Open My reports on this browser and the whole history of what you filed is there, refreshed live.',
    img: '/sheet-tracking.jpg',
    alt: 'Night traffic moving along a city street',
    video: '/street-night.webm',
    poster: '/street-night-poster.jpg',
    theme: 'light' as const,
  },
];

const SLIP: { group: string; rows: [string, string][] }[] = [
  {
    group: 'When you file it',
    rows: [
      ['Incident, place and photo attached', '2 min'],
      ['Engine classifies, scores, checks duplicates', 'instant'],
      ['Your AI key drafts the file, if one is set', 'seconds'],
    ],
  },
  {
    group: 'While it is reviewed',
    rows: [
      ['Routed to the matching authority', 'same day'],
      ['Reviewer stamps a status with a note', 'hours to days'],
    ],
  },
  {
    group: 'At the end',
    rows: [
      ['Resolved or dismissed, with the reason kept', 'on decision'],
    ],
  },
];

interface Stats {
  total: number;
  byStatus: Record<string, number>;
}

function Diamond() {
  return <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-primary" />;
}

export default function LandingPage() {
  const router = useRouter();
  const [caseNo, setCaseNo] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api
      .get<Stats>('/reports')
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  function onTrack(e: FormEvent) {
    e.preventDefault();
    const id = caseNo.trim().toUpperCase();
    if (id) router.push(`/track-report?id=${encodeURIComponent(id)}`);
  }

  const ledger: { value: string; caption: string }[] = [
    { value: String(stats?.total ?? '—'), caption: 'reports filed in total' },
    { value: String(stats?.byStatus?.PENDING ?? '—'), caption: 'awaiting a reviewer' },
    { value: String(stats?.byStatus?.IN_PROGRESS ?? '—'), caption: 'being actioned now' },
    { value: String(stats?.byStatus?.RESOLVED ?? '—'), caption: 'closed as resolved' },
    { value: String(stats?.byStatus?.DISMISSED ?? '—'), caption: 'dismissed, reason kept' },
  ];

  return (
    <>
      {/* ============ HERO — the file, cropped by the fold ============ */}
      <section className="relative isolate overflow-hidden bg-field-dark text-white">
        {/* one photograph behind the object; slow drift = the moving picture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-night-bridge.jpg"
          alt="An illuminated suspension bridge at night under a stormy sky"
          className="ken-burns absolute inset-0 h-full w-full object-cover opacity-70"
          width={1920}
          height={1080}
        />
        <div aria-hidden className="absolute inset-0 bg-field-dark/45" />

        <div className="relative mx-auto grid max-w-[1088px] grid-cols-12 px-3 pt-24 pb-16 sm:px-5 md:pt-36">
          {/* the case file: a paper card with four corner bites, cut by the fold */}
          <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-7 lg:col-start-3">
            <div className="relative animate-fade-up bg-card text-foreground">
              {/* scalloped inner corners, cut with the field colour */}
              {[
                '-left-3 -top-3',
                '-right-3 -top-3',
                '-bottom-3 -left-3',
                '-bottom-3 -right-3',
              ].map((pos) => (
                <span
                  key={pos}
                  aria-hidden
                  className={`absolute ${pos} hidden h-6 w-6 rounded-full bg-field-dark md:block`}
                />
              ))}

              <div className="px-6 py-10 text-center md:px-10 md:py-14">
                <h1 className="text-step-head font-extrabold">
                  <span className="block md:-translate-x-5">File a report,</span>
                  <span className="block md:translate-x-5">stay anonymous.</span>
                </h1>

                <p className="mx-auto mt-5 max-w-[38ch] text-step-body text-foreground">
                  Attach the evidence, watch every status change in this browser, and never create
                  an account.
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-step-small text-muted-foreground">
                  <span className="flex items-center gap-3">
                    Case file <Diamond /> FORM SR-F2
                  </span>
                  <span className="flex items-center gap-3">
                    No login <Diamond /> tracked by this device
                  </span>
                </div>

                {/* the live thing: open a case by number, right here */}
                <form onSubmit={onTrack} className="mt-8 text-left">                      <label htmlFor="case-no" className="block text-step-small font-semibold">
                    Track a case number
                  </label>
                  <div className="mt-2 flex">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="case-no"
                        value={caseNo}
                        onChange={(e) => setCaseNo(e.target.value)}
                        placeholder="SR-XXXXXXXX"
                      className="input-base h-12 pl-9 "
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex h-12 shrink-0 items-center gap-2 bg-primary px-5 text-step-body font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Open file
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-step-small text-muted-foreground">
                    Or{' '}
                    <Link href="/submit-report" className="font-semibold underline underline-offset-4">
                      file a new report
                    </Link>{' '}
                    — it takes about two minutes.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES — stacking colour sheets ============ */}
      <section className="bg-card pt-28 md:pt-40">
        <div className="mx-auto max-w-[1088px] px-5">
          <Reveal>
            <h2 className="max-w-[16ch] text-step-head font-extrabold">
              What the file does
            </h2>
          </Reveal>
        </div>

        <div className="mt-12">
          {SHEETS.map((sheet, i) => (
            <article
              key={sheet.name}
              className={`sticky ${['top-14', 'top-[9rem]', 'top-[16.5rem]'][i]} min-h-[78svh] md:min-h-[86svh]`}
              style={{ zIndex: 10 + i }}
            >
              <div
                className={`min-h-[78svh] md:min-h-[86svh] ${
                  sheet.theme === 'dark'
                    ? 'bg-field-dark text-white'
                    : sheet.theme === 'warm'
                      ? 'bg-field-warm text-foreground'
                      : 'bg-muted text-foreground'
                }`}
              >
                <div className="mx-auto grid max-w-[1088px] grid-rows-[auto_1fr] px-5 pt-4">
                  <Reveal delay={60} as="div">
                    <h3 className="min-h-[64px] text-step-head font-extrabold">
                      {sheet.name}
                    </h3>
                  </Reveal>

                  <div className="grid gap-6 pb-12 pt-4 md:grid-cols-2 md:gap-10 md:pb-16">
                    <div className="order-2 flex flex-col justify-end md:order-1">
                      <Reveal delay={120}>
                        <p
                          className={`max-w-[40ch] text-step-body leading-[1.5] ${
                            sheet.theme === 'dark' ? 'text-white/80' : 'text-foreground'
                          }`}
                        >
                          {sheet.body}
                        </p>
                      </Reveal>
                    </div>
                    <div className="order-1 relative aspect-[4/3] md:order-2 md:aspect-auto md:min-h-[46vh]">
                      <Reveal delay={180} className="absolute inset-0">
                        {sheet.video ? (
                          <video
                            src={sheet.video}
                            poster={sheet.poster}
                            aria-label={sheet.alt}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sheet.img}
                            alt={sheet.alt}
                            loading="lazy"
                            width={1200}
                            height={1600}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </Reveal>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS — itinerary on a slip ============ */}
      <section className="bg-card py-28 md:py-40">
        <div className="mx-auto grid max-w-[1088px] gap-10 px-5 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Reveal>
              <h2 className="text-step-head font-extrabold">
                How a report moves
              </h2>
            </Reveal>
            <Reveal delay={90}>
              <p className="mt-5 max-w-[30ch] text-step-body text-foreground">
                Every file follows the same printed route, and each step is written into the
                timeline you can open alone.
              </p>
            </Reveal>
          </div>

          <Reveal delay={140} className="md:col-span-5 md:col-start-7">
            <div
              className="bg-field-warm px-7 pb-10 pt-8 text-foreground"
              style={{
                WebkitMaskImage:
                  'linear-gradient(#000 0 0), conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg)', // taste-skill-ignore: this mask cuts the paper's torn edge
                maskImage:
                  'linear-gradient(#000 0 0), conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg)', // taste-skill-ignore: shaped edge, not a gradient fill
                WebkitMaskSize: '100% calc(100% - 14px), 26px 14px',
                maskSize: '100% calc(100% - 14px), 26px 14px',
                WebkitMaskRepeat: 'no-repeat, repeat-x',
                maskRepeat: 'no-repeat, repeat-x',
                WebkitMaskPosition: 'top, bottom',
                maskPosition: 'top, bottom',
              }}
            >
              {SLIP.map((group) => (
                <div key={group.group} className="mb-7 last:mb-0">
                  <p className="mb-3 text-step-body font-extrabold">{group.group}</p>
                  <ul className="space-y-3">
                    {group.rows.map(([what, when]) => (
                      <li key={what} className="flex items-baseline gap-2 text-step-body">
                        <span className="max-w-[60%]">{what}</span>
                        <span
                          aria-hidden
                          className="h-[10px] flex-1 self-center"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle 2px at 4px 50%, hsl(var(--foreground)) 2px, transparent 2.5px)', // taste-skill-ignore: printed leader dots
                            backgroundSize: '12px 100%',
                            backgroundRepeat: 'repeat-x',
                            opacity: 0.35,
                          }}
                        />
                        <span className="shrink-0 font-semibold tabular-nums">{when}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="-mx-7 mt-8 flex min-h-11 items-center justify-between gap-4 bg-primary px-7 py-3 text-primary-foreground">
                <span className="text-step-body font-semibold">You hold the whole file, no login</span>
                <span className="text-step-body font-bold tabular-nums">end to end</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PROOF — the printed field list ============ */}
      <section className="relative overflow-hidden bg-field-warm py-24 md:py-32">
        <div className="mx-auto max-w-[1088px] px-5">
          <Reveal>
            <div className="mx-auto max-w-[560px] -rotate-1 bg-card px-8 pb-16 pt-10 text-center shadow-none md:px-12">
              <h2 className="text-step-head font-extrabold">
                Nothing identifies you
              </h2>
              <div className="mt-7 space-y-4 text-step-lead">
                <p>Name — · Email — · Phone number — · Address —</p>
                <p className="font-semibold">
                  Case number <span className="tabular-nums">SR-XXXXXXXX</span> · Category ·
                  Severity · Status
                </p>
                <p className="text-muted-foreground">Photo evidence · Timeline stamps · Authority note</p>
                <p>Device key — kept in this browser, sent with nothing else</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ STATS — the ledger column ============ */}
      <section className="bg-card py-28 md:py-40">
        <div className="mx-auto grid max-w-[1088px] items-center gap-12 px-5 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <h2 className="text-step-head font-extrabold">
              <span className="block font-semibold text-muted-foreground">What has been</span>
              <span className="block">reported so far</span>
            </h2>
            <p className="mt-5 max-w-[34ch] text-step-body text-foreground">
              Live figures from the platform ledger. Identities are not counted, because they are
              never collected.
            </p>
          </Reveal>

          <div className="md:col-span-6 md:col-start-7">
            {ledger.map((row, i) => (
              <Reveal key={row.caption} delay={i * 80}>
                <div className="grid grid-cols-[1fr_auto_1.1fr] items-baseline gap-x-2 py-2 md:gap-x-4">
                  <span className="text-right text-display font-extrabold tabular-nums">
                    {row.value}
                  </span>
                  <span aria-hidden className="text-display font-extrabold">
                    {''}
                  </span>
                  <span className="text-step-body text-muted-foreground">
                    {row.caption}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA — the reply card ============ */}
      <section className="relative overflow-hidden bg-field-dark py-24 text-white md:py-32">
        <div className="mx-auto grid max-w-[1088px] items-end gap-10 px-5 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="max-w-[26ch] text-step-lead text-white/80 md:pb-16">
              Anonymity is the default: the form never asks your name, and the file you get back
              opens only in this browser.
            </p>
          </Reveal>

          <Reveal delay={120} className="md:col-span-6 md:col-start-6">
            <div className="rotate-2 bg-card px-8 py-10 text-center text-foreground md:px-12">
              <h2 className="text-step-head font-extrabold">
                File your report
              </h2>
              <p className="mx-auto mt-3 max-w-[34ch] text-step-body text-foreground">
                Two minutes, no account. The case number appears the moment you send it, and this
                page keeps every status it collects.
              </p>
              <Link
                href="/submit-report"
                className="mt-7 flex h-14 w-full items-center justify-center gap-2 bg-primary text-step-body font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Start the file
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
