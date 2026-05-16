import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileJson, X } from 'lucide-react';
import { parseMatchJson } from '../lib/parseMatchJson.js';

/**
 * JsonUploadZone
 * Drag-and-drop (or click-to-browse) zone that reads a match-state JSON
 * and fires onLoad(formPatch) so App can merge it into form state.
 *
 * Accepts the same JSON format as the Gradio HF Space (sample_input.json).
 */
export default function JsonUploadZone({ onLoad }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [errorMsgs, setErrorMsgs] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [dragging, setDragging] = useState(false);

  const process = useCallback(
    (file) => {
      if (!file || !file.name.endsWith('.json')) {
        setStatus('error');
        setErrorMsgs(['Please upload a .json file.']);
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target.result);
          const { formPatch, errors } = parseMatchJson(raw);
          if (errors.length > 0) {
            setStatus('error');
            setErrorMsgs(errors);
          } else {
            setStatus('success');
            setErrorMsgs([]);
            onLoad(formPatch);
            setTimeout(() => setStatus('idle'), 3500);
          }
        } catch {
          setStatus('error');
          setErrorMsgs(['Could not parse JSON — check the file format.']);
        }
      };
      reader.readAsText(file);
    },
    [onLoad]
  );

  const onFileInput = (e) => { if (e.target.files?.[0]) process(e.target.files[0]); };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      process(e.dataTransfer.files?.[0]);
    },
    [process]
  );

  const dismiss = () => { setStatus('idle'); setFileName(null); setErrorMsgs([]); };

  return (
    <div className="panel">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload match state JSON"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl',
          'border-2 border-dashed p-6 transition-all',
          dragging
            ? 'border-turf-400/70 bg-turf-400/10'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={onFileInput}
        />
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
          <FileJson className="h-5 w-5 text-slate-300" />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-200">
            Drop match-state JSON here
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            or{' '}
            <span className="text-turf-400 underline underline-offset-2">
              browse files
            </span>{' '}
            · same format as HF Space
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-600">
          {PREVIEW_KEYS.map((k) => (
            <code key={k} className="rounded bg-white/[0.03] px-1.5 py-0.5">
              {k}
            </code>
          ))}
        </div>
      </div>

      {/* Status banners */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-turf-400/30 bg-turf-400/10 px-4 py-2.5 text-sm text-turf-400"
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-mono font-medium">{fileName}</span> loaded — all
              fields updated.
            </span>
            <button
              type="button"
              onClick={dismiss}
              className="ml-auto text-turf-400/60 hover:text-turf-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-leather-500/30 bg-leather-500/10 px-4 py-3 text-sm text-leather-400"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">Could not load file</span>
              <button
                type="button"
                onClick={dismiss}
                className="ml-auto text-leather-400/60 hover:text-leather-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="mt-1.5 list-disc pl-6 text-xs text-leather-400/80">
              {errorMsgs.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download sample link */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Upload className="h-3 w-3" />
        <a
          href="/sample_input.json"
          download="sample_input.json"
          className="hover:text-slate-300 underline underline-offset-2"
          onClick={(e) => e.stopPropagation()}
        >
          Download sample JSON
        </a>
      </div>
    </div>
  );
}

const PREVIEW_KEYS = [
  'venue', 'par_score', 'batting_team', 'overs_completed',
  'runs_scored', 'wickets_lost', 'fours', 'sixes',
  'remaining_batters', 'remaining_utility', '…',
];
