import { ROLE_META, battingStrength, totalRemainingBatters } from '../lib/cricket.js';
import { Minus, Plus, Users } from 'lucide-react';

// Visual lineup builder — each role is a "card" of seat icons.
export default function LineupSelector({ lineup, onChange }) {
  const total = totalRemainingBatters(lineup);
  const strength = battingStrength(lineup);

  const set = (key, delta) => {
    const next = { ...lineup, [key]: Math.max(0, Math.min(11, lineup[key] + delta)) };
    if (totalRemainingBatters(next) > 11) return;
    onChange(next);
  };

  return (
    <div className="panel panel-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h3 className="font-display text-lg font-semibold">Remaining Lineup</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Composition of batters yet to come — drives projected acceleration.
          </p>
        </div>
        <div className="text-right">
          <div className="label">Batting Strength</div>
          <div className="font-display text-2xl font-semibold text-turf-400 tabular-nums">
            {strength.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">{total} players remaining</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ROLE_META.map((r) => (
          <RoleRow
            key={r.key}
            color={r.color}
            label={r.label}
            value={lineup[r.key]}
            onDec={() => set(r.key, -1)}
            onInc={() => set(r.key, +1)}
          />
        ))}
      </div>
    </div>
  );
}

function RoleRow({ color, label, value, onInc, onDec }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 12px ${color}` }}
          />
          <span className="text-sm font-medium text-slate-200">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDec}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center font-mono text-sm tabular-nums">
            {value}
          </span>
          <button
            type="button"
            onClick={onInc}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: i < value ? color : 'rgba(255,255,255,0.06)',
              opacity: i < value ? 0.9 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
