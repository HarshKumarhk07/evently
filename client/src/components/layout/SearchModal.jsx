import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, Drama, Ticket } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { restaurantsApi, playsApi, eventsApi } from '../../api/listings.api.js';

const groups = [
  { key: 'dining', label: 'Dining', icon: UtensilsCrossed, api: restaurantsApi, path: '/dining', titleKey: 'name' },
  { key: 'plays', label: 'Plays', icon: Drama, api: playsApi, path: '/plays', titleKey: 'title' },
  { key: 'events', label: 'Events', icon: Ticket, api: eventsApi, path: '/events', titleKey: 'title' },
];

/* Global search palette — debounced, multi-collection, keyboard friendly. */
export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 350);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all(
      groups.map((g) =>
        g.api.list({ search: debounced, limit: 4 }).then((d) => d.items).catch(() => []),
      ),
    ).then((lists) => {
      if (!active) return;
      setResults(groups.map((g, i) => ({ ...g, items: lists[i] })));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [debounced]);

  const go = (group, item) => {
    onClose();
    navigate(`${group.path}/${item.slug}`);
  };

  const hasResults = results?.some((r) => r.items.length);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
        <Search className="h-5 w-5 text-brand-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants, plays, events…"
          className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
        />
        {loading && <Spinner className="h-4 w-4" />}
      </div>

      <div className="mt-4 max-h-[55vh] overflow-y-auto">
        {!query.trim() && (
          <p className="py-6 text-center text-sm text-slate-500">
            Start typing to search restaurants, plays and events.
          </p>
        )}

        {query.trim() && !loading && !hasResults && (
          <p className="py-10 text-center text-sm text-slate-500">
            No matches for “{query}”. Try a different search.
          </p>
        )}

        {results?.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.key} className="mb-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <group.icon className="h-3.5 w-3.5" /> {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => go(group, item)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <img
                        src={item.coverImage}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {item[group.titleKey]}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.city}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </Modal>
  );
}
