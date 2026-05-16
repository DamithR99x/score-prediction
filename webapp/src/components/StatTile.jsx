import clsx from 'clsx';

export default function StatTile({ label, value, sub, tone = 'default', icon: Icon }) {
  const toneRing = {
    default: 'ring-white/5',
    turf: 'ring-turf-400/30',
    leather: 'ring-leather-500/30',
    boundary: 'ring-boundary-500/30',
    floodlight: 'ring-floodlight-400/30',
  }[tone];

  const toneText = {
    default: 'text-white',
    turf: 'text-turf-400',
    leather: 'text-leather-400',
    boundary: 'text-boundary-400',
    floodlight: 'text-floodlight-300',
  }[tone];

  return (
    <div
      className={clsx(
        'panel panel-pad ring-1',
        toneRing,
        'flex items-center justify-between gap-3'
      )}
    >
      <div className="min-w-0">
        <div className="label">{label}</div>
        <div className={clsx('mt-1 stat-value', toneText)}>{value}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
      </div>
      {Icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.03] text-slate-300">
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
