/**
 * parseMatchJson — map a Gradio-compatible match-state JSON to the
 * webapp's form shape.  Matches the key names from sample_input.json
 * (and research/app.py JSON_KEYS).
 *
 * Returns { formPatch, errors } where formPatch is a partial form
 * object ready to be merged with setState, and errors is an array
 * of human-readable validation problems.
 */
export function parseMatchJson(raw) {
  const errors = [];
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;

  const num = (key, def = 0) => {
    const v = d[key];
    if (v === undefined || v === null) { errors.push(`Missing field: ${key}`); return def; }
    const n = Number(v);
    if (Number.isNaN(n)) { errors.push(`"${key}" must be a number, got ${JSON.stringify(v)}`); return def; }
    return n;
  };

  const str = (key, def = '') => {
    const v = d[key];
    if (!v && v !== 0) { errors.push(`Missing field: ${key}`); return def; }
    return String(v);
  };

  const formPatch = {
    venue:            resolveVenue(str('venue')),
    par_score:        num('par_score'),
    batting_team:     str('batting_team'),
    overs_completed:  num('overs_completed'),
    balls_remaining:  num('balls_remaining'),
    runs_scored:      num('runs_scored'),
    wickets_lost:     num('wickets_lost'),
    runs_last_2_overs: num('runs_last_2_overs'),
    dot_balls_total:  num('dot_balls_total'),
    dot_balls_last_2: num('dot_balls_last_2'),
    fours:            num('fours'),
    sixes:            num('sixes'),
    powerplay_completed: Boolean(d['powerplay_completed']),
    lineup: {
      batter:         num('remaining_batters'),
      all_rounder:    num('remaining_all_rounders'),
      // Gradio JSON uses "remaining_utility"; also accept "remaining_utility_player"
      utility_player: d['remaining_utility'] != null ? num('remaining_utility') : num('remaining_utility_player'),
      bowler:         num('remaining_bowlers'),
      unknown:        num('remaining_unknown'),
    },
  };

  return { formPatch, errors };
}

// Known venues — kept in sync with MatchSetupCard.jsx.
const KNOWN_VENUES = [
  'Wankhede Stadium, Mumbai',
  'M. Chinnaswamy Stadium, Bengaluru',
  'Eden Gardens, Kolkata',
  'Narendra Modi Stadium, Ahmedabad',
  'MCG, Melbourne',
  'SCG, Sydney',
  'Dubai International',
  'Premadasa, Colombo',
];

// If the JSON venue string exactly matches a known venue, use it.
// Otherwise try a case-insensitive substring match so "Wankhede Stadium"
// still resolves to "Wankhede Stadium, Mumbai".
function resolveVenue(raw) {
  if (!raw) return raw;
  const exact = KNOWN_VENUES.find((v) => v === raw);
  if (exact) return exact;
  const lower = raw.toLowerCase();
  const partial = KNOWN_VENUES.find((v) => v.toLowerCase().includes(lower) || lower.includes(v.toLowerCase().split(',')[0].toLowerCase()));
  return partial ?? raw; // fall back to raw string if no match (still valid for the LLM)
}
