import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Over-by-over momentum "worm" — synthesized from the cumulative-runs and
// last-2-overs values so the chart reads like a broadcast worm chart.
export default function MomentumChart({ overs, runs, runsLast2, projected }) {
  const data = buildWorm({ overs, runs, runsLast2, projected });

  return (
    <div className="panel panel-pad">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-boundary-400" />
          <h3 className="font-display text-lg font-semibold">Run-Worm</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <Legend color="#3ddc97" label="Actual" />
          <Legend color="#22d3ee" label="AI projection" dashed />
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3ddc97" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#3ddc97" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="over"
              stroke="rgba(255,255,255,0.25)"
              tickLine={false}
              axisLine={false}
              fontSize={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.25)"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,15,26,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3ddc97"
              strokeWidth={2.5}
              fill="url(#actual)"
              isAnimationActive
            />
            <Area
              type="monotone"
              dataKey="projection"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#proj)"
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-0.5 w-5"
        style={{
          background: color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          backgroundImage: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
            : undefined,
        }}
      />
      {label}
    </span>
  );
}

function buildWorm({ overs, runs, runsLast2, projected }) {
  const fullOvers = Math.max(1, Math.floor(overs));
  const avgEarly = Math.max(0, (runs - runsLast2) / Math.max(1, fullOvers - 2));
  const avgLate = runsLast2 / 2;

  const out = [];
  let cum = 0;
  for (let o = 1; o <= fullOvers; o += 1) {
    const overRuns = o > fullOvers - 2 ? avgLate : avgEarly;
    cum += overRuns;
    out.push({ over: o, actual: Math.round(cum), projection: null });
  }
  // Projection tail
  const remaining = Math.max(0, 20 - fullOvers);
  if (remaining > 0 && projected) {
    const projRR = (projected - cum) / remaining;
    let p = cum;
    out[out.length - 1] = { ...out[out.length - 1], projection: Math.round(cum) };
    for (let o = fullOvers + 1; o <= 20; o += 1) {
      p += projRR;
      out.push({ over: o, actual: null, projection: Math.round(p) });
    }
  }
  return out;
}
