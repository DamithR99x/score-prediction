import { Radio, Sparkles } from 'lucide-react';

export default function Header({ status = 'LIVE' }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-pitch-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-turf-400 to-boundary-600 shadow-glow-turf">
            <Sparkles className="h-4 w-4 text-pitch-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-wide">
              T20 Intelligence Console
            </div>
            <div className="text-[11px] text-slate-400">
              AI-powered first-innings score forecasting
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="chip">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-leather-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leather-500" />
            </span>
            <Radio className="h-3 w-3" /> {status}
          </span>
          <span className="hidden chip sm:inline-flex">v1 · fine-tuned LLM</span>
        </div>
      </div>
    </header>
  );
}
