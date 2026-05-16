import { useMemo, useState, useCallback } from 'react';
import {
  Activity,
  Hash,
  Percent,
  Trophy,
  Zap,
} from 'lucide-react';

import Header from './components/Header.jsx';
import HeroPrediction from './components/HeroPrediction.jsx';
import StatTile from './components/StatTile.jsx';
import MatchSetupCard from './components/MatchSetupCard.jsx';
import InningsFlowPanel from './components/InningsFlowPanel.jsx';
import BoundariesPanel from './components/BoundariesPanel.jsx';
import LineupSelector from './components/LineupSelector.jsx';
import MomentumChart from './components/MomentumChart.jsx';
import ConfidenceMeter from './components/ConfidenceMeter.jsx';
import VenueInsights from './components/VenueInsights.jsx';
import JsonUploadZone from './components/JsonUploadZone.jsx';

import { buildPrompt, currentRunRate, battingStrength } from './lib/cricket.js';
import { predictScore } from './api.js';

const INITIAL = {
  venue: '',
  par_score: '',
  batting_team: '',
  overs_completed: 0,
  balls_remaining: 120,
  runs_scored: 0,
  wickets_lost: 0,
  runs_last_2_overs: 0,
  dot_balls_total: 0,
  dot_balls_last_2: 0,
  fours: 0,
  sixes: 0,
  powerplay_completed: false,
  lineup: {
    batter: 0,
    all_rounder: 0,
    utility_player: 0,
    bowler: 0,
    unknown: 0,
  },
};

export default function App() {
  const [form, setForm] = useState(INITIAL);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);
  const setLineup = useCallback(
    (lineup) => setForm((f) => ({ ...f, lineup })),
    []
  );
  // Called by JsonUploadZone with the parsed form patch (top-level fields + lineup).
  const onJsonLoad = useCallback(
    ({ lineup, ...rest }) =>
      setForm((f) => ({
        ...f,
        ...rest,
        lineup: lineup ? { ...f.lineup, ...lineup } : f.lineup,
      })),
    []
  );

  const crr = useMemo(
    () => currentRunRate(form.runs_scored, form.overs_completed),
    [form.runs_scored, form.overs_completed]
  );
  const strength = useMemo(() => battingStrength(form.lineup), [form.lineup]);

  const requiredRR = useMemo(() => {
    if (!prediction) return 0;
    const oversLeft = Math.max(0.1, 20 - form.overs_completed);
    return Math.max(0, (prediction.score - form.runs_scored) / oversLeft);
  }, [prediction, form.overs_completed, form.runs_scored]);

  const onPredict = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildPrompt(form);
      const result = await predictScore({ prompt });
      setPrediction(result);
    } catch (e) {
      setError(e.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <HeroPrediction
          prediction={prediction}
          loading={loading}
          onPredict={onPredict}
          battingTeam={form.batting_team}
          venue={form.venue}
          runs={form.runs_scored}
          wickets={form.wickets_lost}
          overs={form.overs_completed.toFixed(1)}
          crr={crr}
          requiredRR={requiredRR}
        />

        {error && (
          <div className="panel panel-pad border-leather-500/30 text-leather-400">
            {error}
          </div>
        )}

        {/* Quick stats strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Current RR"
            value={crr.toFixed(2)}
            sub={form.powerplay_completed ? 'Post-PP' : 'In powerplay'}
            tone="turf"
            icon={Activity}
          />
          <StatTile
            label="Boundaries"
            value={`${form.fours + form.sixes}`}
            sub={`${form.fours}× 4   ·   ${form.sixes}× 6`}
            tone="boundary"
            icon={Hash}
          />
          <StatTile
            label="Dot ball %"
            value={`${Math.round((form.dot_balls_total / Math.max(1, form.overs_completed * 6)) * 100)}%`}
            sub={`${form.dot_balls_last_2} in last 2 ov`}
            tone="leather"
            icon={Percent}
          />
          <StatTile
            label="Batting Strength"
            value={strength.toFixed(2)}
            sub="Weighted by role"
            tone="floodlight"
            icon={Trophy}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <MomentumChart
            overs={form.overs_completed}
            runs={form.runs_scored}
            runsLast2={form.runs_last_2_overs}
            projected={prediction?.score}
          />
          <ConfidenceMeter prediction={prediction} par={form.par_score} />
        </div>

        {/* Input grid — organised by innings flow */}
        <CollapsibleUpload>
          <JsonUploadZone onLoad={onJsonLoad} />
        </CollapsibleUpload>

        <div className="grid gap-4 lg:grid-cols-3">
          <MatchSetupCard form={form} set={set} />
          <InningsFlowPanel form={form} set={set} />
          <VenueInsights venue={form.venue} par={form.par_score} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <BoundariesPanel form={form} set={set} />
          <LineupSelector lineup={form.lineup} onChange={setLineup} />
        </div>

        <footer className="pt-4 pb-10 text-center text-xs text-slate-500">
          <div className="mx-auto inline-flex items-center gap-2">
            <Zap className="h-3 w-3 text-turf-400" />
            Fine-tuned LLM · Modal inference · Built for portfolio demos
          </div>
        </footer>
      </main>
    </div>
  );
}

// ── Collapsible JSON upload wrapper ─────────────────────────────────────────
import { ChevronDown, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function CollapsibleUpload({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <FileJson className="h-4 w-4 text-turf-400" />
          <span className="font-display text-sm font-semibold">
            Quick-fill from JSON
          </span>
          <span className="chip border-turf-400/20 bg-turf-400/10 text-turf-400 text-[10px]">
            same format as HF Space
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
