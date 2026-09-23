/**
 * Incident categories offered in the submit form.
 * Labels mirror the backend lexicon (backend/src/intelligence/textAnalyzer.ts)
 * so the AI-classified value always matches a selectable option.
 */
export const CATEGORY_LABELS = [
  'Violence / Assault',
  'Theft / Burglary',
  'Fraud / Cybercrime',
  'Drugs / Substance',
  'Vandalism / Property',
  'Harassment / Stalking',
  'Traffic / Road Safety',
  'Missing Person',
  'Fire / Emergency',
  'Water Logging / Flood',
  'Bullying / Misconduct',
  'Public Safety Hazard',
  'General Incident',
] as const;

/** Authority shown in the live preview when a category is selected. */
export const CATEGORY_AUTHORITY: Record<string, string> = {
  'Violence / Assault': 'Police Control Room (Law & Order)',
  'Theft / Burglary': 'Police Station (Crime Desk)',
  'Fraud / Cybercrime': 'Cyber Crime Cell',
  'Drugs / Substance': 'Police Narcotics Unit',
  'Vandalism / Property': 'Police (Property Offences)',
  'Harassment / Stalking': 'Police (Safety Cell)',
  'Traffic / Road Safety': 'Traffic Police / Road Safety Unit',
  'Missing Person': 'Police (Missing Persons Bureau)',
  'Fire / Emergency': 'Fire & Rescue Department',
  'Water Logging / Flood': 'Disaster Management / Municipal Corp',
  'Bullying / Misconduct': 'Local Police + Institutional Authority',
  'Public Safety Hazard': 'Municipal / Public Works + Police',
  'General Incident': 'Local Police / Designated Duty Desk',
};
