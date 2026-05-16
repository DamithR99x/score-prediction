import LiveSlider from './LiveSlider.jsx';
import { ballsRemainingFromOvers } from '../lib/cricket.js';
import { Timer, ShieldAlert } from 'lucide-react';

// "Innings flow" panel — overs/balls, runs, wickets, powerplay toggle.
// The overs slider auto-syncs balls_remaining and powerplay_completed.
export default function InningsFlowPanel({ form, set }) {
  const onOversChange = (overs) => {
    set({
      overs_completed: overs,
      balls_remaining: ballsRemainingFromOvers(overs),
      powerplay_completed: overs >= 6,
    });
  };

  return (
    <div className="panel panel-pad space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Innings Flow</h3>
        <PowerplayPill on={form.powerplay_completed} />
      </div>

      <LiveSlider
        label="Overs completed"
        value={form.overs_completed}
        onChange={onOversChange}
        min={0.1}
        max={19.5}
        step={0.1}
        tone="boundary"
        hint={`${form.balls_remaining} balls remaining`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <LiveSlider
          label="Runs scored"
          value={form.runs_scored}
          onChange={(v) => set({ runs_scored: v })}
          min={0}
          max={280}
          tone="turf"
        />
        <LiveSlider
          label="Wickets lost"
          value={form.wickets_lost}
          onChange={(v) => set({ wickets_lost: v })}
          min={0}
          max={10}
          tone="leather"
        />
      </div>

      <div className="seam-divider" />

      <div className="grid grid-cols-2 gap-3">
        <Toggle
          icon={Timer}
          label="Powerplay completed"
          on={form.powerplay_completed}
          onChange={(v) => set({ powerplay_completed: v })}
        />
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="label flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3" /> Pressure
          </div>
          <div className="mt-1 font-display text-xl tabular-nums">
            {pressureLevel(form)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PowerplayPill({ on }) {
  return (
    <span
      className={
        'chip ' +
        (on
          ? 'border-floodlight-400/40 bg-floodlight-400/10 text-floodlight-300'
          : 'border-turf-400/40 bg-turf-400/10 text-turf-400')
      }
    >
      <span
        className={'h-1.5 w-1.5 rounded-full ' + (on ? 'bg-floodlight-300' : 'bg-turf-400 animate-pulse')}
      />
      {on ? 'POWERPLAY DONE' : 'IN POWERPLAY'}
    </span>
  );
}

function Toggle({ icon: Icon, label, on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={
        'flex items-center justify-between rounded-xl border p-3 text-left transition ' +
        (on
          ? 'border-turf-400/40 bg-turf-400/10'
          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]')
      }
    >
      <span className="flex items-center gap-2 text-sm text-slate-200">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span
        className={
          'h-5 w-9 rounded-full p-0.5 transition ' +
          (on ? 'bg-turf-500' : 'bg-white/10')
        }
      >
        <span
          className={
            'block h-4 w-4 rounded-full bg-white transition ' +
            (on ? 'translate-x-4' : '')
          }
        />
      </span>
    </button>
  );
}

function pressureLevel(form) {
  const dotRate = form.dot_balls_total / Math.max(1, form.overs_completed * 6);
  const wktFactor = form.wickets_lost / 10;
  const score = dotRate * 0.6 + wktFactor * 0.4;
  if (score > 0.55) return 'High';
  if (score > 0.35) return 'Medium';
  return 'Low';
}
