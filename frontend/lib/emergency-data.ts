/**
 * Emergency Diary dataset — bundled locally so the page works offline and
 * without any API key. Numbers are well-known national/regional helplines.
 * city → country auto-selection happens from the CITIES list.
 */

export type AuthorityKind =
  | 'Police'
  | 'Fire'
  | 'Ambulance'
  | 'Women'
  | 'Child'
  | 'Cyber'
  | 'Disaster'
  | 'Road'
  | 'Crisis'
  | 'Other';

export interface Authority {
  name: string;
  kind: AuthorityKind;
  number: string;
  note?: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  authorities: Authority[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    authorities: [
      { name: 'Emergency Response Support (Police / Fire / Ambulance)', kind: 'Other', number: '112' },
      { name: 'Police Control Room', kind: 'Police', number: '100' },
      { name: 'Fire & Rescue', kind: 'Fire', number: '101' },
      { name: 'Ambulance', kind: 'Ambulance', number: '108' },
      { name: 'Women Helpline', kind: 'Women', number: '181' },
      { name: 'Childline', kind: 'Child', number: '1098' },
      { name: 'Cyber Crime / Financial Fraud', kind: 'Cyber', number: '1930' },
      { name: 'District Disaster Control Room', kind: 'Disaster', number: '1077' },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    authorities: [
      { name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '911' },
      { name: 'City Services (non-emergency)', kind: 'Other', number: '311', note: 'Available in most cities' },
      { name: 'Suicide & Crisis Lifeline', kind: 'Crisis', number: '988' },
      { name: 'Poison Control', kind: 'Other', number: '1-800-222-1222' },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    authorities: [
      { name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '999' },
      { name: 'Emergency (European standard)', kind: 'Other', number: '112' },
      { name: 'Police (non-emergency)', kind: 'Police', number: '101' },
      { name: 'NHS Urgent Medical Advice', kind: 'Ambulance', number: '111' },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    authorities: [
      { name: 'Police', kind: 'Police', number: '999' },
      { name: 'Ambulance', kind: 'Ambulance', number: '998' },
      { name: 'Fire & Rescue', kind: 'Fire', number: '997' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    authorities: [
      { name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '911' },
      { name: 'Suicide & Crisis Lifeline', kind: 'Crisis', number: '988' },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    authorities: [
      { name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '000' },
      { name: 'Emergency (mobile)', kind: 'Other', number: '112' },
      { name: 'Police Assistance Line', kind: 'Police', number: '131 444' },
      { name: 'Lifeline (crisis support)', kind: 'Crisis', number: '13 11 14' },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    authorities: [
      { name: 'Police', kind: 'Police', number: '999' },
      { name: 'Fire & Ambulance', kind: 'Fire', number: '995' },
      { name: 'Non-emergency Ambulance', kind: 'Ambulance', number: '1777' },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    authorities: [
      { name: 'Fire & Ambulance', kind: 'Fire', number: '112' },
      { name: 'Police', kind: 'Police', number: '110' },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    authorities: [
      { name: 'European Emergency', kind: 'Other', number: '112' },
      { name: 'Police', kind: 'Police', number: '17' },
      { name: 'Fire Brigade', kind: 'Fire', number: '18' },
      { name: 'SAMU (Ambulance)', kind: 'Ambulance', number: '15' },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    authorities: [
      { name: 'European Emergency', kind: 'Other', number: '112' },
      { name: 'National Police', kind: 'Police', number: '091' },
      { name: 'Guardia Civil', kind: 'Police', number: '062' },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    authorities: [
      { name: 'European Emergency', kind: 'Other', number: '112' },
      { name: 'Police (Polizia)', kind: 'Police', number: '113' },
      { name: 'Fire Brigade (Vigili del Fuoco)', kind: 'Fire', number: '115' },
      { name: 'Ambulance (118)', kind: 'Ambulance', number: '118' },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    authorities: [
      { name: 'Police', kind: 'Police', number: '110' },
      { name: 'Fire & Ambulance', kind: 'Fire', number: '119' },
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    authorities: [
      { name: 'Police', kind: 'Police', number: '112' },
      { name: 'Fire & Ambulance', kind: 'Fire', number: '119' },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    authorities: [
      { name: 'Police', kind: 'Police', number: '110' },
      { name: 'Fire', kind: 'Fire', number: '119' },
      { name: 'Ambulance', kind: 'Ambulance', number: '120' },
      { name: 'Traffic Accident', kind: 'Road', number: '122' },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    authorities: [
      { name: 'Police (Polícia Militar)', kind: 'Police', number: '190' },
      { name: 'Ambulance (SAMU)', kind: 'Ambulance', number: '192' },
      { name: 'Fire Department (Bombeiros)', kind: 'Fire', number: '193' },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    authorities: [{ name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '911' }],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    authorities: [
      { name: 'Police', kind: 'Police', number: '10111' },
      { name: 'Ambulance', kind: 'Ambulance', number: '10177' },
      { name: 'Emergency (mobile)', kind: 'Other', number: '112' },
    ],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    authorities: [
      { name: 'Emergency Response', kind: 'Other', number: '112' },
      { name: 'Police', kind: 'Police', number: '199' },
      { name: 'Road Traffic (FRSC)', kind: 'Road', number: '122' },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    authorities: [
      { name: 'Police', kind: 'Police', number: '999' },
      { name: 'Emergency Response', kind: 'Other', number: '112' },
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    authorities: [
      { name: 'Police', kind: 'Police', number: '122' },
      { name: 'Ambulance', kind: 'Ambulance', number: '123' },
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    authorities: [
      { name: 'Police (Muruḍ)', kind: 'Police', number: '999' },
      { name: 'Ambulance', kind: 'Ambulance', number: '998' },
      { name: 'Fire & Rescue', kind: 'Fire', number: '997' },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    authorities: [
      { name: 'Emergency', kind: 'Other', number: '112' },
      { name: 'Police (non-emergency)', kind: 'Police', number: '0900 8844' },
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    authorities: [
      { name: 'Emergency', kind: 'Other', number: '112' },
      { name: 'Police', kind: 'Police', number: '117' },
      { name: 'Fire', kind: 'Fire', number: '118' },
      { name: 'Ambulance (Air-Glaciers / Rega)', kind: 'Ambulance', number: '144' },
    ],
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    authorities: [
      { name: 'Emergency', kind: 'Other', number: '112' },
      { name: 'Police (non-emergency)', kind: 'Police', number: '114 14' },
    ],
  },
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    authorities: [
      { name: 'Emergency', kind: 'Other', number: '112' },
      { name: 'Police', kind: 'Police', number: '102' },
      { name: 'Fire', kind: 'Fire', number: '101' },
      { name: 'Ambulance', kind: 'Ambulance', number: '103' },
    ],
  },
  {
    code: 'TR',
    name: 'Türkiye',
    flag: '🇹🇷',
    authorities: [
      { name: 'Emergency', kind: 'Other', number: '112' },
      { name: 'Police', kind: 'Police', number: '155' },
      { name: 'Fire', kind: 'Fire', number: '110' },
    ],
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    authorities: [{ name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '911' }],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    authorities: [
      { name: 'Police', kind: 'Police', number: '110' },
      { name: 'Fire & Rescue', kind: 'Fire', number: '113' },
      { name: 'Ambulance', kind: 'Ambulance', number: '118' },
    ],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    authorities: [
      { name: 'Emergency (Police / Ambulance)', kind: 'Other', number: '999' },
      { name: 'Fire & Rescue (Bomba)', kind: 'Fire', number: '994' },
    ],
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    authorities: [
      { name: 'Police', kind: 'Police', number: '191' },
      { name: 'Fire & Rescue', kind: 'Fire', number: '199' },
      { name: 'Emergency Medical (EMS)', kind: 'Ambulance', number: '1669' },
      { name: 'Tourist Police', kind: 'Other', number: '1155' },
    ],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    authorities: [{ name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '111' }],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    authorities: [{ name: 'Emergency (Police / Fire / Ambulance)', kind: 'Other', number: '911' }],
  },
];

/** city name → country code (auto country selection when the user types a city) */
export const CITIES: { name: string; country: string }[] = [
  // India
  { name: 'Delhi', country: 'IN' },
  { name: 'New Delhi', country: 'IN' },
  { name: 'Mumbai', country: 'IN' },
  { name: 'Bengaluru', country: 'IN' },
  { name: 'Bangalore', country: 'IN' },
  { name: 'Hyderabad', country: 'IN' },
  { name: 'Chennai', country: 'IN' },
  { name: 'Kolkata', country: 'IN' },
  { name: 'Pune', country: 'IN' },
  { name: 'Ahmedabad', country: 'IN' },
  { name: 'Jaipur', country: 'IN' },
  { name: 'Lucknow', country: 'IN' },
  { name: 'Surat', country: 'IN' },
  { name: 'Kanpur', country: 'IN' },
  { name: 'Nagpur', country: 'IN' },
  { name: 'Indore', country: 'IN' },
  { name: 'Bhopal', country: 'IN' },
  { name: 'Patna', country: 'IN' },
  { name: 'Chandigarh', country: 'IN' },
  { name: 'Kochi', country: 'IN' },
  { name: 'Coimbatore', country: 'IN' },
  { name: 'Guwahati', country: 'IN' },
  { name: 'Bhubaneswar', country: 'IN' },
  { name: 'Visakhapatnam', country: 'IN' },
  { name: 'Vadodara', country: 'IN' },
  { name: 'Ranchi', country: 'IN' },
  { name: 'Raipur', country: 'IN' },
  { name: 'Amritsar', country: 'IN' },
  { name: 'Varanasi', country: 'IN' },
  { name: 'Mysuru', country: 'IN' },
  { name: 'Mysore', country: 'IN' },
  { name: 'Panaji', country: 'IN' },
  { name: 'Goa', country: 'IN' },
  { name: 'Thiruvananthapuram', country: 'IN' },
  { name: 'Jodhpur', country: 'IN' },
  { name: 'Vijayawada', country: 'IN' },
  { name: 'Madurai', country: 'IN' },
  { name: 'Nashik', country: 'IN' },
  { name: 'Agra', country: 'IN' },
  { name: 'Meerut', country: 'IN' },
  { name: 'Dehradun', country: 'IN' },
  { name: 'Jamshedpur', country: 'IN' },
  // UK
  { name: 'London', country: 'GB' },
  { name: 'Manchester', country: 'GB' },
  { name: 'Birmingham', country: 'GB' },
  { name: 'Edinburgh', country: 'GB' },
  { name: 'Glasgow', country: 'GB' },
  { name: 'Liverpool', country: 'GB' },
  // USA
  { name: 'New York', country: 'US' },
  { name: 'Los Angeles', country: 'US' },
  { name: 'Chicago', country: 'US' },
  { name: 'Houston', country: 'US' },
  { name: 'Miami', country: 'US' },
  { name: 'San Francisco', country: 'US' },
  { name: 'Seattle', country: 'US' },
  { name: 'Boston', country: 'US' },
  { name: 'Atlanta', country: 'US' },
  { name: 'Dallas', country: 'US' },
  { name: 'Denver', country: 'US' },
  { name: 'Phoenix', country: 'US' },
  // Canada
  { name: 'Toronto', country: 'CA' },
  { name: 'Vancouver', country: 'CA' },
  { name: 'Montreal', country: 'CA' },
  // Australia
  { name: 'Sydney', country: 'AU' },
  { name: 'Melbourne', country: 'AU' },
  { name: 'Brisbane', country: 'AU' },
  { name: 'Perth', country: 'AU' },
  { name: 'Adelaide', country: 'AU' },
  // UAE
  { name: 'Dubai', country: 'AE' },
  { name: 'Abu Dhabi', country: 'AE' },
  { name: 'Sharjah', country: 'AE' },
  // Europe
  { name: 'Berlin', country: 'DE' },
  { name: 'Munich', country: 'DE' },
  { name: 'Hamburg', country: 'DE' },
  { name: 'Frankfurt', country: 'DE' },
  { name: 'Paris', country: 'FR' },
  { name: 'Lyon', country: 'FR' },
  { name: 'Marseille', country: 'FR' },
  { name: 'Madrid', country: 'ES' },
  { name: 'Barcelona', country: 'ES' },
  { name: 'Rome', country: 'IT' },
  { name: 'Milan', country: 'IT' },
  { name: 'Naples', country: 'IT' },
  { name: 'Amsterdam', country: 'NL' },
  { name: 'Rotterdam', country: 'NL' },
  { name: 'Zurich', country: 'CH' },
  { name: 'Geneva', country: 'CH' },
  { name: 'Stockholm', country: 'SE' },
  { name: 'Istanbul', country: 'TR' },
  { name: 'Ankara', country: 'TR' },
  // Asia
  { name: 'Tokyo', country: 'JP' },
  { name: 'Osaka', country: 'JP' },
  { name: 'Kyoto', country: 'JP' },
  { name: 'Seoul', country: 'KR' },
  { name: 'Beijing', country: 'CN' },
  { name: 'Shanghai', country: 'CN' },
  { name: 'Shenzhen', country: 'CN' },
  { name: 'Singapore', country: 'SG' },
  { name: 'Kuala Lumpur', country: 'MY' },
  { name: 'Bangkok', country: 'TH' },
  { name: 'Jakarta', country: 'ID' },
  { name: 'Manila', country: 'PH' },
  { name: 'Cebu', country: 'PH' },
  { name: 'Riyadh', country: 'SA' },
  { name: 'Jeddah', country: 'SA' },
  // Others
  { name: 'Moscow', country: 'RU' },
  { name: 'Saint Petersburg', country: 'RU' },
  { name: 'Lagos', country: 'NG' },
  { name: 'Abuja', country: 'NG' },
  { name: 'Nairobi', country: 'KE' },
  { name: 'Cairo', country: 'EG' },
  { name: 'Johannesburg', country: 'ZA' },
  { name: 'Cape Town', country: 'ZA' },
  { name: 'Durban', country: 'ZA' },
  { name: 'São Paulo', country: 'BR' },
  { name: 'Rio de Janeiro', country: 'BR' },
  { name: 'Mexico City', country: 'MX' },
  { name: 'Auckland', country: 'NZ' },
  { name: 'Wellington', country: 'NZ' },
  { name: 'Buenos Aires', country: 'AR' },
];

/** extra city-specific desks (merged ahead of the national list) */
export const CITY_AUTHORITIES: Record<string, Authority[]> = {
  bengaluru: [
    { name: 'BESCOM Power Complaints (24×7)', kind: 'Other', number: '1912', note: 'Electricity / streetlight issues' },
  ],
  bangalore: [
    { name: 'BESCOM Power Complaints (24×7)', kind: 'Other', number: '1912', note: 'Electricity / streetlight issues' },
  ],
  delhi: [
    { name: 'Delhi Traffic Police Helpline', kind: 'Road', number: '1095', note: 'Accidents, jams, violations' },
  ],
};

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function searchCities(q: string): { name: string; country: string }[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return CITIES.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 8);
}
