import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import ScoreGauge from './ScoreGauge.jsx';

export default function HeroPrediction({
  prediction,
  loading,
  onPredict,
  battingTeam,
  venue,
  runs,
  wickets,
  overs,
  crr,
  requiredRR,
}) {
  return (
    <section className="panel relative overflow-hidden">
      {/* Floodlight conic glow */}
      <div className="floodlight-sweep" />
      {/* Pitch stripe overlay */}
      <div className="pointer-events-none absolute inset-0 bg-pitch-stripes opacity-40" />

      <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: context */}
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-turf-400/30 bg-turf-400/10 text-turf-400">
                <Activity className="h-3 w-3" /> FIRST INNINGS · LIVE
              </span>
              <span className="chip">{venue || 'Pick a venue'}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {battingTeam || 'Batting team'}
              <span className="block text-base font-medium text-slate-400">
                are projected to finish at…
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Score" value={`${runs}/${wickets}`} accent="text-white" />
            <MiniStat label="Overs" value={overs} accent="text-boundary-400" />
            <MiniStat label="CRR" value={crr.toFixed(2)} accent="text-turf-400" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPredict}
              disabled={loading}
              className="btn-primary"
            >
              <Zap className="h-4 w-4" />
              {loading ? 'Forecasting…' : 'Run AI Prediction'}
            </button>
            <span className="text-xs text-slate-400">
              Fine-tuned LLM · served via Modal
            </span>
          </div>
        </div>

        {/* Right: gauge */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-full bg-turf-400/10 blur-3xl" />
          <ScoreGauge
            score={prediction?.score}
            range={prediction?.range}
            confidence={prediction?.confidence}
            loading={loading}
          />
          {prediction && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center justify-center gap-3 text-xs text-slate-400"
            >
              <span>Required projection RR:</span>
              <span className="font-mono text-floodlight-300">
                {requiredRR.toFixed(2)}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="label">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${accent}`}>
        {value}
      </div>
    </div>
  );
}
