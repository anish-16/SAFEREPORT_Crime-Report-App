import type { TextAnalysis } from './types';

/**
 * Lexicon-based text intelligence. Runs fully in-process — no external AI API.
 * Scores crime categories with weighted keyword hits, extracts entities with
 * patterns, and derives severity/urgency from safety indicators.
 */

interface CategoryLexicon {
  label: string;
  strong: string[]; // weight 3
  mild: string[]; // weight 1
}

const CATEGORIES: CategoryLexicon[] = [
  {
    label: 'Violence / Assault',
    strong: ['assault', 'attacked', 'beaten', 'stabbed', 'shot', 'shooting', 'murder', 'homicide', 'strangled', 'punched', 'hit me'],
    mild: ['fight', 'threat', 'threatened', 'intimidat', 'abuse', 'violent', 'punch', 'slap', 'beat'],
  },
  {
    label: 'Theft / Burglary',
    strong: ['stolen', 'robbed', 'robbery', 'burglar', 'burglary', 'break-in', 'break in', 'shoplift', 'pickpocket', 'snatched'],
    mild: ['theft', 'steal', 'stole', 'missing wallet', 'missing phone', 'larceny', 'trespass'],
  },
  {
    label: 'Fraud / Cybercrime',
    strong: ['scam', 'scammed', 'phishing', 'hacked', 'identity theft', 'upi fraud', 'otp fraud', 'fake website', 'romance scam', 'deepfake'],
    mild: ['fraud', 'cheated money', 'online fraud', 'cyber', 'blackmail', 'extortion', 'ransomware', 'data breach'],
  },
  {
    label: 'Drugs / Substance',
    strong: ['drug deal', 'selling drugs', 'drug trafficking', 'heroin', 'cocaine', 'meth', 'drug lab'],
    mild: ['drugs', 'marijuana', 'cannabis', 'substance abuse', 'narcotics', 'intoxicated'],
  },
  {
    label: 'Vandalism / Property',
    strong: ['vandalism', 'smashed', 'destroyed property'],
    mild: ['graffiti', 'damaged property', 'broken window', 'property damage', 'keyed'],
  },
  {
    label: 'Fire / Emergency',
    strong: ['on fire', 'fire broke out', 'flames', 'burning', 'explosion', 'blast', 'arson', 'set fire', 'burned down'],
    mild: ['fire', 'smoke', 'burnt', 'sparks', 'lpg', 'cylinder', 'scorched'],
  },
  {
    label: 'Water Logging / Flood',
    strong: ['flood', 'flooding', 'waterlogged', 'water logged', 'drowning', 'flash flood', 'dam breach', 'wall collapse'],
    mild: ['heavy rain', 'water level', 'overflow', 'sewage', 'rainwater', 'inundat'],
  },
  {
    label: 'Bullying / Misconduct',
    strong: ['bullied', 'bullying', 'ragging', 'molest', 'misconduct', 'indecent', 'humiliat'],
    mild: ['teasing', 'made fun', 'targeted', 'cyber bullied', 'mobbing'],
  },
  {
    label: 'Public Safety Hazard',
    strong: ['open manhole', 'live wire', 'electrocuted', 'gas leak', 'chemical spill', 'fallen tree', 'building collapse'],
    mild: ['pothole', 'broken road', 'exposed wire', 'unsafe', 'contaminated', 'construction hazard'],
  },
  {
    label: 'Harassment / Stalking',
    strong: ['stalking', 'stalker', 'following me', 'death threat', 'revenge porn', 'morphed photo'],
    mild: ['harassment', 'harassed', 'eve teasing', 'creepy', 'unsolicited', 'threatening messages'],
  },
  {
    label: 'Traffic / Road Safety',
    strong: ['hit and run', 'drunk driving', 'reckless driving', 'accident'],
    mild: ['overspeeding', 'wrong side', 'signal jumping', 'road rage', 'no helmet'],
  },
  {
    label: 'Missing Person',
    strong: ['kidnapped', 'abducted', 'missing child', 'missing person'],
    mild: ['not seen since', 'cannot find', 'lost contact'],
  },
];

const SEVERITY_TERMS: Record<string, number> = {
  gun: 3, firearm: 3, knife: 3, stabbed: 4, shot: 4, shooting: 4, murder: 5, dead: 4,
  died: 4, blood: 2, injured: 2, hospital: 2, hostage: 5, kidnapped: 5, bomb: 5,
  fire: 3, burning: 3, child: 2, minor: 2, weapon: 3, threat: 2, 'death threat': 4,
  raped: 5, sexual: 2, unconscious: 4, bleeding: 3, hit: 1, crash: 2, acid: 4,
  explosion: 5, blast: 4, flood: 3, drowning: 5, electrocuted: 4, 'gas leak': 4,
};

const URGENCY_TERMS: string[] = [
  'right now', 'immediately', 'urgent', 'in progress', 'happening now', 'currently',
  'tonight', 'this minute', 'calling police', 'need help', 'help me', 'ongoing',
  'just now', 'asap', 'emergency',
];

const WEAPON_RE = /\b(gun|pistol|rifle|knife|blade|machete|revolver|weapon|acid|bomb|axe|sword)\b/gi;
const PLATE_RE = /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{0,3}[-\s]?\d{3,4}\b/g;
const PHONE_RE = /(?:\+?\d{1,3}[-\s]?)?\b\d{10}\b/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const VEHICLE_RE = /\b(car|bike|scooter|truck|van|bus|auto[-\s]?rickshaw|suv|taxi|tempo|jeep|lorry|motorcycle|scooty)\b/gi;
const LOCATION_RE =
  /\b(?:near|behind|opposite|next to|outside|at|in)\s+([A-Z][\w'&-]*(?:\s+[A-Z][\w'&-]*){0,5})/g;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'is', 'was',
  'were', 'be', 'been', 'it', 'its', 'this', 'that', 'with', 'for', 'from', 'as',
  'by', 'he', 'she', 'they', 'we', 'you', 'i', 'my', 'me', 'him', 'her', 'them',
  'his', 'their', 'our', 'your', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'about', 'into', 'than', 'then', 'so', 'if', 'when',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function scoreCategories(text: string): { label: string; score: number }[] {
  const lower = text.toLowerCase();
  const scores = CATEGORIES.map((cat) => {
    let score = 0;
    for (const term of cat.strong) if (lower.includes(term)) score += 3;
    for (const term of cat.mild) if (lower.includes(term)) score += 1;
    return { label: cat.label, score };
  });
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

function matchAll(re: RegExp, text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(re)) out.add(m[0].trim());
  return [...out];
}

function detectSentiment(text: string): TextAnalysis['sentiment'] {
  const lower = text.toLowerCase();
  const panicHits = (lower.match(/\b(help me|emergency|urgent|screaming|screaming for help|running|attacker)\b/g) || []).length;
  const distressHits = (lower.match(/\b(scared|afraid|terrified|panic|anxious|shaking|crying|worried)\b/g) || []).length;
  if (panicHits >= 2) return 'panicked';
  if (panicHits >= 1 || distressHits >= 2) return 'distressed';
  return 'calm';
}

export function analyzeText(title: string, description: string): TextAnalysis {
  const full = `${title}\n${description}`;
  const lower = full.toLowerCase();
  const tokens = tokenize(full);

  // --- category ---
  const scores = scoreCategories(full);
  const top = scores[0];
  const second = scores[1] ?? { label: 'Uncategorized', score: 0 };
  const total = scores.reduce((s, c) => s + c.score, 0);
  const category = top.score > 0 ? top.label : 'Uncategorized';
  const categoryConfidence =
    top.score === 0
      ? 0
      : total === 0
        ? 0
        : Math.min(1, (top.score - second.score) / top.score + top.score / (total + top.score));

  // --- severity (1..10) ---
  let severity = 2; // baseline for any filed report
  for (const [term, weight] of Object.entries(SEVERITY_TERMS)) {
    if (lower.includes(term)) severity += weight;
  }
  severity = Math.max(1, Math.min(10, severity));

  // --- urgency (0..100) ---
  let urgency = 15;
  for (const term of URGENCY_TERMS) {
    if (lower.includes(term)) urgency += 12;
  }
  if (detectSentiment(full) === 'panicked') urgency += 20;
  else if (detectSentiment(full) === 'distressed') urgency += 10;
  urgency = Math.max(0, Math.min(100, urgency));

  // --- quality / specificity flags ---
  const qualityFlags: string[] = [];
  const wordCount = tokens.length;
  if (wordCount >= 40) qualityFlags.push('Detailed description');
  else if (wordCount < 10) qualityFlags.push('Very short description — limited detail');
  if (/\b\d{1,2}[:.]\d{2}\s?(am|pm)?\b/i.test(full)) qualityFlags.push('Mentions a specific time');
  if (/\b(yesterday|today|last night|this morning|tonight|on\s+\w+\s+\d{1,2})\b/i.test(full)) qualityFlags.push('Mentions when it happened');
  if (PHONE_RE.test(full)) qualityFlags.push('Contains contact number');
  if (PLATE_RE.test(full)) qualityFlags.push('Contains vehicle plate number');
  if (/\b\d+(\.\d+)?\s?(km|kmph|mph|kg|lakh|crore|rupees|inr|rs\.?)\b/i.test(full)) qualityFlags.push('Contains specific figures');
  const sentences = full.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length >= 5) qualityFlags.push('Well-structured narrative');

  const sentiment = detectSentiment(full);

  const summaryParts = [
    `Classified as ${category}${categoryConfidence >= 0.5 ? ' with high confidence' : categoryConfidence > 0 ? ' with moderate confidence' : ''}.`,
    `Severity ${severity}/10, urgency ${urgency}/100.`,
  ];
  if (sentiment === 'panicked') summaryParts.push('Reporter appears to be in immediate distress.');
  else if (sentiment === 'distressed') summaryParts.push('Reporter shows signs of distress.');

  return {
    category,
    categoryConfidence: Math.round(categoryConfidence * 100) / 100,
    categoryScores: scores.filter((s) => s.score > 0).slice(0, 4),
    severity,
    urgency,
    sentiment,
    entities: {
      phones: matchAll(PHONE_RE, full),
      emails: matchAll(EMAIL_RE, full),
      plates: matchAll(PLATE_RE, full),
      locations: matchAll(LOCATION_RE, full)
        .map((l) => l.replace(/^(near|behind|opposite|next to|outside|at|in)\s+/i, '').trim())
        .filter((l) => l.length > 2),
      weapons: matchAll(WEAPON_RE, full),
      vehicles: matchAll(VEHICLE_RE, full).map((v) => v.toLowerCase()),
    },
    qualityFlags,
    summary: summaryParts.join(' '),
  };
}
