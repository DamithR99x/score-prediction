import { motion } from 'framer-motion';

// Score projection gauge: half-circle arc with predicted score in the middle
// and a confidence ring underneath. Inspired by F1 telemetry dials.
export default function ScoreGauge({ score, range, confidence, loading }) {
  const lo = range?.[0] ?? 0;
  const hi = range?.[1] ?? 0;
  const conf = Math.round((confidence ?? 0) * 100);

  // Map score to arc fill (0..300 typical T20 range)
  const pct = Math.min(1, Math.max(0, (score || 0) / 240));
  const dash = 2 * Math.PI * 90 * 0.5; // half circle
  const offset = dash * (1 - pct);

  return (
    <div className="relative">
      <svg viewBox="0 0 240 140" className="w-full">
        <defs>
          <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#3ddc97" />
            <stop offset="100%" stopColor="#f5d76e" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Track */}
        <path
          d="M30 120 A 90 90 0 0 1 210 120"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Fill */}
        <motion.path
          d="M30 120 A 90 90 0 0 1 210 120"
          fill="none"
          stroke="url(#arc)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={dash}
          initial={false}
          animate={{ strokeDashoffset: loading ? dash : offset }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          filter="url(#soft)"
        />
        {/* Tick marks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const a = Math.PI * (i / 8);
          const x1 = 120 - Math.cos(a) * 78;
          const y1 = 120 - Math.sin(a) * 78;
          const x2 = 120 - Math.cos(a) * 70;
          const y2 = 120 - Math.sin(a) * 70;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
        <div className="label">Projected Final</div>
        <motion.div
          key={score}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="font-display text-[64px] leading-none font-bold tracking-tight text-white"
        >
          {loading ? '—' : score ?? '—'}
        </motion.div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          {range && !loading ? (
            <>
              <span className="font-mono text-slate-300">{lo}</span>
              <span className="h-px w-6 bg-white/15" />
              <span className="font-mono text-slate-300">{hi}</span>
              <span>· {conf}% conf</span>
            </>
          ) : (
            <span>awaiting input</span>
          )}
        </div>
      </div>
    </div>
  );
}
