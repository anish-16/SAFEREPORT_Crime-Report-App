'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Upload,
  Brain,
  Route,
  Activity,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Lock,
  ChevronRight,
  ArrowRight,
  Type,
  Camera,
  Video,
  Combine,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** End-to-end walkthrough of everything this website does with a report. */
const STAGES = [
  {
    icon: Eye,
    title: 'You witness an incident',
    tag: 'Anonymous intake',
    what: 'Fire, water logging, road accident, theft, misconduct, bullying, cyber crime — anything you believe the authorities should know about. You open the intake form; there is not a single personal field on it.',
    details: [
      'No name, phone or email is ever part of the report body.',
      'The form opens with your location auto-detected (GPS) — editable, or type a pincode/city yourself.',
      'Works on any device; the report is prepared entirely in your browser.',
    ],
    privacy: 'At this stage the report contains zero identity — it is just an incident description.',
  },
  {
    icon: Upload,
    title: 'Attach evidence',
    tag: 'Photo / video ≤ 60 MB',
    what: 'Drop in a photo or video. It is stored on this server only — never uploaded to any AI cloud, never shared with third parties, never exposed publicly.',
    details: [
      'Images: EXIF/GPS read for corroboration, blur & exposure checks, perceptual hash for duplicate detection.',
      'Videos: container metadata parsed, frames sampled locally when ffmpeg is present.',
      'Evidence URLs are served only through the app — public tracking never reveals them to strangers.',
    ],
    privacy: 'Evidence stays on our storage. No external model ever sees your file.',
  },
  {
    icon: Brain,
    title: 'Built-in intelligence classifies it',
    tag: 'Local AI · no API keys',
    what: 'The engine scores your text against crime-category lexicons, reads pixel statistics from photos (fire-orange tones, water-blue tones, night scenes, screenshots), extracts entities — plates, weapons, vehicles, phones — then fuses everything into one verdict.',
    details: [
      'Produces: category, severity 1–10, urgency 0–100, evidence score, priority band (Low → Critical).',
      'Auto-drafts your report fields: emergency/non-emergency, category, title and "what happened" — pre-filled the moment you attach media or type.',
      'Every drafted field is editable — you review, correct and approve before anything is submitted.',
    ],
    privacy: 'All analysis is code running on this server. Zero calls to Gemini, OpenAI, or any model API.',
  },
  {
    icon: Route,
    title: 'Routed to the designated authority',
    tag: 'Auto-triage',
    what: 'Each category maps to the authority that handles it: Cyber Crime Cell for scams, Fire & Rescue for fires, Traffic Police for road incidents, Disaster Management for floods, Police Crime Desk for theft and violence.',
    details: [
      'Critical severity + strong evidence auto-escalates to IN_PROGRESS immediately.',
      'Everything else queues for moderator review in the admin console.',
      'Moderators can re-classify or re-prioritise — the AI recommends, humans decide.',
    ],
    privacy: 'The authority sees the incident, not the reporter — no identity travels with the report.',
  },
  {
    icon: Activity,
    title: 'You track it privately',
    tag: 'Report ID + dashboard',
    what: 'You get a random report ID (SR-XXXX). Your dashboard shows every report you filed, its live status and a full timeline of updates — synced from the database in the background every 15 seconds.',
    details: [
      'Status flow: Pending Review → In Progress → Resolved / Dismissed, each change timestamped.',
      'Anyone with the report ID can check status on the public tracking page — status only.',
      'Your dashboard requires your login; it is the only place your submissions are listed.',
    ],
    privacy: 'The account link exists solely so YOU can find your reports again — it is stripped from every public response.',
  },
  {
    icon: CheckCircle2,
    title: 'Authorities respond',
    tag: 'Resolution',
    what: 'The designated team works the case, updates the status, and you watch it move from pending to resolved — without ever revealing who you are.',
    details: [
      'Status notes appear on your timeline (e.g. "Patrol dispatched", "Case closed").',
      'You can add follow-up details through the same anonymous channel.',
      'Resolved reports stay in your dashboard as history.',
    ],
    privacy: 'From first tap to final status: your name is never on the report.',
  },
];

const MODULES = [
  {
    icon: Type,
    name: 'Lexicon Text Classifier',
    what: 'Your title + description are tokenized and scored against weighted incident-category lexicons (violence, theft, fraud, drugs, vandalism, harassment, traffic, missing persons, fire, flood, bullying, safety hazards).',
    output: 'Category, confidence %, severity 1–10, urgency 0–100, reporter sentiment.',
  },
  {
    icon: Type,
    name: 'Entity Extractor',
    what: 'Regular-expression pass pulls out vehicle plates, phone numbers, emails, weapon mentions, vehicles and location phrases.',
    output: 'Structured entities highlighted on the report for investigators.',
  },
  {
    icon: Camera,
    name: 'Image Forensics',
    what: 'Decodes pixels locally to measure brightness, contrast and Laplacian sharpness, classifies the scene (fire-orange tones, flood-blue tones, night, screenshots), reads EXIF (camera, timestamp, GPS), detects editing software and computes a perceptual dHash.',
    output: 'Quality findings, scene hints, GPS corroboration, near-duplicate detection — and the media-based draft when there is no text yet.',
  },
  {
    icon: Video,
    name: 'Video Probe',
    what: 'Parses container metadata (duration, resolution, fps, codec) and — when ffmpeg is present — samples frames for brightness, sharpness and scene-change counts.',
    output: 'Recording-quality assessment and scene structure, all offline.',
  },
  {
    icon: Combine,
    name: 'Fusion, Drafting & Triage',
    what: 'Text signals, media scene and evidence score are combined into a single verdict: report draft (type/category/title/description), priority band, designated authority and recommended responder action.',
    output: 'Editable auto-fill for your form, status (auto-escalates critical reports), priority, confidence, routing target.',
  },
];

const FAQ = [
  {
    q: 'Is my identity protected?',
    a: 'Yes — all reports are anonymous and no personal data is written into the report itself. Your account is linked only so you can track your own submissions; that link is stripped from public tracking and never shown to other users.',
  },
  {
    q: 'Can I track my report?',
    a: 'Yes — you receive a unique tracking ID (SR-XXXX) on submit. Use it on the Track Report page, or sign in to see everything you have ever filed on your private dashboard.',
  },
  {
    q: 'Who receives my report?',
    a: 'Authorized personnel in the designated authority for the category — law enforcement, cyber cell, fire & rescue, traffic or disaster teams. They review the incident and update its status; they never see who filed it.',
  },
  {
    q: 'Why does login exist if reports are anonymous?',
    a: 'Only for you. The login is your private vault: it stores how many reports you filed and their current statuses. Nobody else can access your profile, and your reports carry no name, email or phone number inside them.',
  },
  {
    q: 'Does the AI call Gemini or OpenAI?',
    a: 'Never. Classification, media forensics and triage are deterministic code running inside this app — no API keys, no per-report cost, no sensitive evidence leaving the server.',
  },
];

export default function HowItWorksPage() {
  const [active, setActive] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stage = STAGES[active];
  const StageIcon = stage.icon;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* hero */}
      <div className="mb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
          <ShieldCheck className="h-3.5 w-3.5" /> End to end
        </span>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">How It Works</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every process this website carries out with your report — from the tap you make as a
          witness, to the status update you receive back. Click any stage to inspect it.
        </p>
      </div>

      {/* interactive stage walkthrough */}
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* stage rail */}
        <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {STAGES.map((s, i) => (
            <li key={s.title} className="shrink-0 lg:shrink">
              <button
                onClick={() => setActive(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                  active === i
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active === i ? 'bg-primary/20 text-primary' : 'bg-white/[0.06]'
                  )}
                >
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] font-black text-accent">
                    STAGE {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="block whitespace-nowrap text-xs font-semibold lg:whitespace-normal">
                    {s.title}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    'ml-auto hidden h-4 w-4 shrink-0 transition lg:block',
                    active === i ? 'text-primary' : 'opacity-0'
                  )}
                />
              </button>
            </li>
          ))}
        </ol>

        {/* stage detail */}
        <div className="card-base animate-fade-up p-6" key={active}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <StageIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{stage.title}</h2>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {stage.tag}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.what}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {stage.details.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/[0.06] p-3.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Privacy at this stage: </span>
              {stage.privacy}
            </p>
          </div>
        </div>
      </div>

      {/* anonymity assurance block */}
      <div className="card-base mt-10 animate-fade-up overflow-hidden border-success/30">
        <div className="grid gap-6 bg-success/[0.05] p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              Completely anonymous — the login is only for you
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This website submits your report <span className="font-semibold text-foreground">100% anonymously</span>.
              Asking you to log in has one purpose: so you can keep track of{' '}
              <span className="font-semibold text-foreground">your own</span> reports. No one else
              can ever see your personal information or name.
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                'The report itself carries no name, email, phone or address.',
                'Your account link is stripped from public tracking — strangers see status only.',
                'Nobody else can open your profile or list your reports; your dashboard is private.',
                'Authorities receive the incident details — never the identity of the reporter.',
              ].map((t) => (
                <li key={t} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* emergency diary explainer */}
      <div className="card-base mt-6 animate-fade-up overflow-hidden border-accent/30">
        <div className="grid gap-6 bg-accent/[0.05] p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <PhoneCall className="h-8 w-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">Emergency Diary</h2>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Directory section
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A built-in directory of the emergency authorities that serve{' '}
              <span className="font-semibold text-foreground">your city</span> — police, fire,
              ambulance, women/child helplines, cyber crime desks and disaster control rooms — so
              you never waste seconds searching for a number in an emergency.
            </p>
            <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                'Type your city — the country auto-selects itself from what you typed.',
                'The full list of authorities for that country loads, city-specific desks first.',
                'Each row shows the authority, its number and a Call button.',
                'Tapping Call shows a confirmation popup — only then does it hand you to your phone’s dialer. You place the call yourself; nothing ever dials automatically.',
              ].map((t, i) => (
                <li key={t} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[9px] font-black text-accent">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <Link
              href="/emergency-diary"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition hover:brightness-110"
            >
              Open Emergency Diary
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* engine internals */}
      <div className="mt-12">
        <div className="mb-6 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Brain className="h-3.5 w-3.5" /> Under the hood
          </span>
          <h2 className="text-2xl font-black tracking-tight">Inside the intelligence engine</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A multi-stage analysis pipeline that lives entirely on this server. No Gemini key, no
            OpenAI key, no external AI API — deterministic, inspectable analysis code.
          </p>
        </div>

        <div className="space-y-4">
          {MODULES.map((m, i) => (
            <div
              key={m.name}
              className="card-base animate-fade-up p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <m.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-bold">{m.name}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.what}</p>
                  <p className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">Produces: </span>
                    <span className="text-muted-foreground">{m.output}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-base mt-6 border-primary/30 bg-primary/[0.05] p-5">
          <h3 className="text-sm font-bold">Why not just call an LLM?</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Because this app must work without API keys, without per-report costs, and without
            sending sensitive evidence to a third party. The local engine gives reproducible,
            explainable results — every number above can be traced back to a measurement in the
            source.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-5 flex items-center justify-center gap-2 text-xl font-black tracking-tight">
          <HelpCircle className="h-5 w-5 text-accent" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="card-base overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold transition hover:bg-white/[0.03]"
                aria-expanded={openFaq === i}
              >
                {f.q}
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    openFaq === i && 'rotate-90 text-primary'
                  )}
                />
              </button>
              {openFaq === i && (
                <p className="animate-fade-up border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/submit-report"
          className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
        >
          See it analyze your report
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
