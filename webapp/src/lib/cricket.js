// Cricket domain helpers — mirror logic in research/app.py.

export const BATTING_WEIGHTS = {
  batter: 1.0,
  all_rounder: 0.8,
  utility_player: 0.65,
  bowler: 0.3,
  unknown: 0.45,
};

export const ROLE_META = [
  { key: 'batter', label: 'Batters', color: '#3ddc97' },
  { key: 'all_rounder', label: 'All-rounders', color: '#22d3ee' },
  { key: 'utility_player', label: 'Utility', color: '#f5d76e' },
  { key: 'bowler', label: 'Bowlers', color: '#ff7849' },
  { key: 'unknown', label: 'Unknown', color: '#94a3b8' },
];

export function battingStrength(lineup) {
  const s =
    lineup.batter * BATTING_WEIGHTS.batter +
    lineup.all_rounder * BATTING_WEIGHTS.all_rounder +
    lineup.utility_player * BATTING_WEIGHTS.utility_player +
    lineup.bowler * BATTING_WEIGHTS.bowler +
    lineup.unknown * BATTING_WEIGHTS.unknown;
  return Math.round(s * 100) / 100;
}

export function totalRemainingBatters(lineup) {
  return (
    lineup.batter +
    lineup.all_rounder +
    lineup.utility_player +
    lineup.bowler +
    lineup.unknown
  );
}

export function currentRunRate(runs, overs) {
  if (!overs || overs <= 0) return 0;
  return Math.round((runs / overs) * 100) / 100;
}

export function ballsRemainingFromOvers(overs) {
  return Math.max(0, Math.round((20 - overs) * 6));
}

export function oversFromBallsBowled(balls) {
  const full = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${full}.${rem}`;
}

export function buildPrompt(form) {
  const overs = Number(form.overs_completed) || 0;
  const runs = Number(form.runs_scored) || 0;
  const rr = currentRunRate(runs, overs);
  const bs = battingStrength(form.lineup);
  const pp = form.powerplay_completed ? 'Yes' : 'No';

  return (
    `Match type: T20\n` +
    `Venue: ${form.venue}\n` +
    `Venue par score: ${form.par_score}\n` +
    `Batting team: ${form.batting_team}\n\n` +
    `Overs completed: ${overs}\n` +
    `Balls remaining: ${form.balls_remaining}\n` +
    `Runs scored: ${runs}\n` +
    `Wickets lost: ${form.wickets_lost}\n` +
    `Current run rate: ${rr}\n\n` +
    `Runs in last 2 overs: ${form.runs_last_2_overs}\n` +
    `Dot balls so far: ${form.dot_balls_total}\n` +
    `Dot balls in last 2 overs: ${form.dot_balls_last_2}\n\n` +
    `Fours hit: ${form.fours}\n` +
    `Sixes hit: ${form.sixes}\n` +
    `Powerplay completed: ${pp}\n\n` +
    `Remaining Batting Strength Score: ${bs}\n` +
    `\n` +
    `Final 1st innings score:`
  );
}
