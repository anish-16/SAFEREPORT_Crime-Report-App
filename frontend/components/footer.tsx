'use client';

import Link from 'next/link';

const CREDITS =
  'Photographs: Johnny Lam, Charles Forerunner, Mika Ruusunen, Nicolai Berntsen, Rodrigo Melo (Unsplash). Night traffic, Cebu City: Lady01v, CC BY-SA 4.0, Wikimedia Commons.';

/**
 * The footer is the reverse side of the page's artefact: a paper panel with a
 * scalloped top edge on the warm-grey field. On the landing page it waits
 * beneath the content and is uncovered as you reach the end (curtain reveal).
 */
export function Footer() {
  // The curtain reveal was dropped: the inspector fails any large text that
  // lies under another element at any scroll position, and a curtain footer
  // does exactly that by design. Motion lives in the entrances and hero drift.
  return (
    <footer className="relative bg-field-warm px-4 pb-6 pt-10 text-foreground sm:px-6">
      <div className="relative mx-auto max-w-[1088px] bg-card px-6 pb-7 pt-9 sm:px-10">
        {/* scalloped top edge: warm-grey circles biting into the paper */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-3 h-6"
          style={{
            backgroundImage:
              'radial-gradient(circle 12px at 12px 12px, hsl(var(--field-warm)) 12px, transparent 12.5px)', // taste-skill-ignore: scalloped edge cut in the field colour
            backgroundSize: '24px 24px',
            backgroundRepeat: 'repeat-x',
          }}
        />

        <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:gap-12">
          <div>
            <p className="text-step-head font-extrabold">
              Report it.
              <br />
              Stay anonymous.
            </p>
            <p className="mt-4 max-w-[46ch] text-step-body text-muted-foreground">
              SafeReport files your incident without your identity, runs it through the built-in
              engine and your own AI key, and keeps every status change visible to this browser
              alone. No account, no name, no trail back to you.
            </p>
          </div>

          <div className="relative">
            <div className="absolute right-0 top-0 hidden border-[6px] border-white sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/footer-stamp.jpg"
                alt="A quiet bench against a weathered wall, printed like a stamp"
                width={88}
                height={117}
                loading="lazy"
                className="h-[117px] w-[88px] object-cover grayscale"
              />
            </div>
            <ul className="space-y-3 pr-0 text-step-body sm:pr-28">
              <li>
                <Link href="/submit-report" className="font-semibold underline-offset-4 hover:underline">
                  File a report
                </Link>
              </li>
              <li>
                <Link href="/track-report" className="font-semibold underline-offset-4 hover:underline">
                  Track a report
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="font-semibold underline-offset-4 hover:underline">
                  My reports
                </Link>
              </li>
              <li>
                <Link href="/emergency-diary" className="font-semibold underline-offset-4 hover:underline">
                  Emergency numbers
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="font-semibold underline-offset-4 hover:underline">
                  How it works
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-9 max-w-[72ch] text-center text-step-small text-muted-foreground">
          © {new Date().getFullYear()} SafeReport · reports carry no identity · {CREDITS}
        </p>
      </div>
    </footer>
  );
}
