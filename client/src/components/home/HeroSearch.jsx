import { useState } from 'react';
import { Search } from 'lucide-react';
import SearchModal from '../layout/SearchModal.jsx';

/* Prominent hero search trigger that opens the global search palette. */
export default function HeroSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-xl">
        <button
          onClick={() => setOpen(true)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-ink-800/70 px-5 py-4 text-left backdrop-blur-xl transition-colors hover:border-brand-500/40"
        >
          <Search className="h-5 w-5 text-brand-400" />
          <span className="flex-1 text-sm text-slate-400 sm:text-base">
            Search restaurants, plays, events…
          </span>
          <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-500 sm:block">
            ⌘ K
          </kbd>
        </button>
      </div>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
