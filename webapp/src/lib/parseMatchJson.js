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
    venue:            str('venue'),
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
      utility_player: num('remaining_utility') || num('remaining_utility_player'),
      bowler:         num('remaining_bowlers'),
      unknown:        num('remaining_unknown'),
    },
  };

  return { formPatch, errors };
}
