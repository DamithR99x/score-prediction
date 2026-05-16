import LiveSlider from './LiveSlider.jsx';
import { Flame, CircleDot, Target, Hash } from 'lucide-react';

// Boundary & pressure inputs — fours, sixes, dots, last-2-overs momentum.
export default function BoundariesPanel({ form, set }) {
  return (
    <div className="panel panel-pad space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Boundaries & Pressure</h3>
        <div className="flex gap-2">
          <Badge icon={Target} value={form.fours} label="4s" tone="boundary" />
          <Badge icon={Flame} value={form.sixes} label="6s" tone="leather" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LiveSlider
          label="Fours"
          value={form.fours}
          onChange={(v) => set({ fours: v })}
          min={0}
          max={30}
          tone="boundary"
        />
        <LiveSlider
          label="Sixes"
          value={form.sixes}
          onChange={(v) => set({ sixes: v })}
          min={0}
          max={20}
          tone="leather"
        />
        <LiveSlider
          label="Dot balls (total)"
          value={form.dot_balls_total}
          onChange={(v) => set({ dot_balls_total: v })}
          min={0}
          max={80}
          tone="floodlight"
          hint="Pressure indicator"
        />
        <LiveSlider
          label="Dots in last 2 overs"
          value={form.dot_balls_last_2}
          onChange={(v) => set({ dot_balls_last_2: v })}
          min={0}
          max={12}
          tone="floodlight"
        />
        <div className="sm:col-span-2">
          <LiveSlider
            label="Runs in last 2 overs (momentum)"
            value={form.runs_last_2_overs}
            onChange={(v) => set({ runs_last_2_overs: v })}
            min={0}
            max={40}
            tone="turf"
            hint="Strong predictor of where the innings is trending"
          />
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, value, label, tone }) {
  const cls = {
    boundary: 'border-boundary-500/30 text-boundary-400 bg-boundary-500/10',
    leather: 'border-leather-500/30 text-leather-400 bg-leather-500/10',
    floodlight: 'border-floodlight-400/30 text-floodlight-300 bg-floodlight-400/10',
  }[tone];
  return (
    <span className={`chip ${cls}`}>
      <Icon className="h-3 w-3" />
      <span className="font-mono tabular-nums">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
