import { Building2, Flame, Wind } from 'lucide-react';

export default function VenueInsights({ venue, par }) {
  // Lightweight "vibe" derived from the par score for now.
  const flavor = par >= 175 ? 'Belter' : par >= 160 ? 'Balanced' : 'Bowler-friendly';
  const flavorTone =
    par >= 175 ? 'text-leather-400' : par >= 160 ? 'text-floodlight-300' : 'text-boundary-400';

  return (
    <div className="panel panel-pad">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-400" />
        <h3 className="font-display text-lg font-semibold">Venue Pulse</h3>
      </div>
      <div className="mt-1 truncate text-sm text-slate-300">{venue}</div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Cell label="Par" value={par} accent="text-white" />
        <Cell label="Profile" value={flavor} accent={flavorTone} />
        <Cell
          label="Boundary %"
          value={`${Math.round(50 + (par - 160) * 0.5)}%`}
          accent="text-turf-400"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Flame className="h-3 w-3 text-leather-400" />
        <span>Dew + dimensions historically favour the chasing side here.</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
        <Wind className="h-3 w-3 text-boundary-400" />
        <span>Short boundary on the off-side adds ~6 runs to par.</span>
      </div>
    </div>
  );
}

function Cell({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
      <div className="label">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
