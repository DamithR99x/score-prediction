import { motion } from 'framer-motion';

// "Required-vs-projection" bar — a horizontal track with the predicted score
// plotted against par. Inspired by broadcast over-progress bars.
export default function ConfidenceMeter({ prediction, par }) {
  const score = prediction?.score ?? 0;
  const lo = prediction?.range?.[0] ?? score;
  const hi = prediction?.range?.[1] ?? score;
  const conf = Math.round((prediction?.confidence ?? 0) * 100);

  const max = Math.max(240, hi + 20, par + 30);
  const pct = (v) => `${(v / max) * 100}%`;

  return (
    <div className="panel panel-pad">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">AI Confidence</h3>
        <div className="text-xs text-slate-400">
          vs par <span className="font-mono text-floodlight-300">{par}</span>
        </div>
      </div>

      <div className="relative mt-4 h-6 w-full rounded-full bg-white/[0.04] ring-1 ring-white/5">
        {/* Par marker */}
        <div
          className="absolute top-0 h-full w-px bg-floodlight-300"
          style={{ left: pct(par) }}
        />
        <div
          className="absolute -top-5 text-[10px] font-mono text-floodlight-300"
          style={{ left: pct(par), transform: 'translateX(-50%)' }}
        >
          PAR
        </div>

        {/* Range band */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 h-full rounded-full bg-gradient-to-r from-boundary-500/40 via-turf-400/40 to-leather-500/40"
            style={{ left: pct(lo), width: pct(hi - lo) }}
          />
        )}

        {/* Score marker */}
        {prediction && (
          <motion.div
            initial={{ left: '0%' }}
            animate={{ left: pct(score) }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-glow-turf"
          />
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="label">Likely range</div>
          <div className="font-mono text-sm">
            {prediction ? `${lo} – ${hi}` : '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="label">Confidence</div>
          <div className="font-display text-2xl font-semibold tabular-nums text-turf-400">
            {prediction ? `${conf}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
