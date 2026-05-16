import clsx from 'clsx';

// Reusable labelled "live slider" — number input + range slider styled together.
export default function LiveSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  tone = 'turf',
  hint,
}) {
  const toneColor = {
    turf: 'accent-turf-400',
    leather: 'accent-leather-500',
    boundary: 'accent-boundary-500',
    floodlight: 'accent-floodlight-400',
  }[tone];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="label">{label}</label>
        <div className="font-mono text-sm tabular-nums text-slate-100">
          {value}
          {unit && <span className="ml-0.5 text-slate-500">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx('w-full cursor-pointer', toneColor)}
      />
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}
