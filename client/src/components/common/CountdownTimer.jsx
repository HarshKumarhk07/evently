import { useCountdown } from '../../hooks/useCountdown.js';

function Unit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid h-14 w-14 place-items-center rounded-xl bg-ink-800 font-display text-2xl font-bold text-white tabular-nums sm:h-16 sm:w-16">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}

/* Live event countdown — collapses to a label once the event has started. */
export default function CountdownTimer({ target }) {
  const { days, hours, minutes, seconds, done } = useCountdown(target);

  if (done) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
        Happening now
      </span>
    );
  }

  return (
    <div className="flex gap-3">
      <Unit value={days} label="Days" />
      <Unit value={hours} label="Hours" />
      <Unit value={minutes} label="Mins" />
      <Unit value={seconds} label="Secs" />
    </div>
  );
}
