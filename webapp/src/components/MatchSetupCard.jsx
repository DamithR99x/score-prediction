import { MapPin, Gauge } from 'lucide-react';

const VENUES = [
  { name: 'Wankhede Stadium, Mumbai', par: 175 },
  { name: 'M. Chinnaswamy Stadium, Bengaluru', par: 185 },
  { name: 'Eden Gardens, Kolkata', par: 168 },
  { name: 'Narendra Modi Stadium, Ahmedabad', par: 170 },
  { name: 'MCG, Melbourne', par: 155 },
  { name: 'SCG, Sydney', par: 160 },
  { name: 'Dubai International', par: 158 },
  { name: 'Premadasa, Colombo', par: 150 },
];

const TEAMS = [
  'India', 'Australia', 'England', 'Pakistan', 'South Africa',
  'New Zealand', 'Sri Lanka', 'West Indies', 'Bangladesh', 'Afghanistan',
  'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bengaluru',
  'Kolkata Knight Riders', 'Sunrisers Hyderabad',
];

export default function MatchSetupCard({ form, set }) {
  return (
    <div className="panel panel-pad space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Match Setup</h3>
        <span className="chip">T20 · 20 overs</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> Venue
          </label>
          <select
            className="input mt-1"
            value={form.venue}
            onChange={(e) => {
              const v = VENUES.find((x) => x.name === e.target.value);
              set({ venue: e.target.value, par_score: v?.par ?? form.par_score });
            }}
          >
            <option value="">— select venue —</option>
            {VENUES.map((v) => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            <Gauge className="h-3 w-3" /> Venue par score
          </label>
          <input
            type="number"
            min={80}
            max={250}
            className="input mt-1 font-mono"
            value={form.par_score}
            onChange={(e) => set({ par_score: Number(e.target.value) })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Batting team</label>
          <select
            className="input mt-1"
            value={form.batting_team}
            onChange={(e) => set({ batting_team: e.target.value })}
          >
            <option value="">— select team —</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
