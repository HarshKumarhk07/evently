import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Store, Ticket, IndianRupee, MailCheck, ShieldCheck, CircleAlert,
  Pencil, Trash2, Star, Building2, MapPin, Calendar, Activity, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Skeleton, CardSkeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/feedback/ConfirmDialog.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { managerApi } from '../../api/manager.api.js';
import { listingApiFor } from '../../api/listings.api.js';
import { VERTICAL_CONFIG, titleOf } from '../../lib/listings.js';
import { CITIES, EVENT_CATEGORIES } from '../../lib/constants.js';
import { formatCurrency, formatDate, relativeTime, initialsOf } from '../../lib/format.js';

/* Drives the status banner shown for non-approved managers. */
const STATUS_META = {
  pending_email: {
    tone: 'warning',
    icon: MailCheck,
    label: 'Email verification pending',
    description: 'Confirm your email so your application can move to review.',
  },
  pending_approval: {
    tone: 'brand',
    icon: ShieldCheck,
    label: 'Under admin review',
    description:
      'Your application is being reviewed. We typically respond within one business day — you’ll get an email the moment it’s approved.',
  },
  rejected: {
    tone: 'danger',
    icon: CircleAlert,
    label: 'Application declined',
    description:
      'Please review the reason below and reach out to support if you have questions.',
  },
  approved: {
    tone: 'success',
    icon: ShieldCheck,
    label: 'Verified manager',
    description: 'Your account is active.',
  },
};

const BUSINESS_TYPE_TO_VERTICAL = {
  Restaurant: 'dining',
  Turf: 'events',
  Event: 'events',
  Play: 'plays',
  Activity: 'events',
};

const VERTICAL_OPTIONS = [
  { value: 'dining', label: 'Restaurant / Dining' },
  { value: 'plays', label: 'Play / Theatre' },
  { value: 'events', label: 'Event / Activity / Turf' },
];

const BG_BY_TONE = {
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  brand:   'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  danger:  'bg-red-500/15 text-red-300 ring-red-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

/* ───────────────────────────────────────────────────────────── */

export default function ManagerDashboard() {
  const { user } = useAuth();
  const profile = user?.managerProfile || {};
  const status = profile.status || 'pending_email';
  const meta = STATUS_META[status];

  const [listings, setListings] = useState({
    restaurants: [], plays: [], events: [], total: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [verticalFilter, setVerticalFilter] = useState('all');

  const loadDashboard = useCallback(async () => {
    if (status !== 'approved') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [l, b] = await Promise.all([
        managerApi.myListings(),
        managerApi.myBookings().catch(() => ({ items: [] })),
      ]);
      setListings(l);
      setBookings(b.items || []);
    } catch (err) {
      toast.error(err?.message || 'Could not load your dashboard');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const removeListing = async () => {
    if (!toDelete) return;
    const api = listingApiFor(toDelete._vertical);
    try {
      await api.remove(toDelete._id);
      toast.success('Listing removed');
      setToDelete(null);
      loadDashboard();
    } catch (err) {
      toast.error(err?.message || 'Could not delete');
    }
  };

  const allListings = useMemo(
    () => [
      ...listings.restaurants.map((r) => ({ ...r, _vertical: 'dining' })),
      ...listings.plays.map((p) => ({ ...p, _vertical: 'plays' })),
      ...listings.events.map((e) => ({ ...e, _vertical: 'events' })),
    ],
    [listings],
  );

  const filteredListings = useMemo(
    () => (verticalFilter === 'all'
      ? allListings
      : allListings.filter((l) => l._vertical === verticalFilter)),
    [allListings, verticalFilter],
  );

  /* KPI calculations. */
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0);
  const avgRating = useMemo(() => {
    const rated = allListings.filter((l) => l.rating > 0);
    if (!rated.length) return null;
    return (rated.reduce((s, l) => s + l.rating, 0) / rated.length).toFixed(1);
  }, [allListings]);

  return (
    <div className="section py-6">
      {/* ─── Hero ─── */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-pink-500/[0.04]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative shrink-0">
              <Avatar
                src={user?.avatar?.url}
                name={profile.businessName || user?.name}
                size="xl"
              />
              {status === 'approved' && (
                <span
                  title="Verified"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-ink-800"
                >
                  <ShieldCheck className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-400">
                Manager Console
              </p>
              <h1 className="mt-0.5 truncate font-display text-2xl font-extrabold text-white sm:text-[28px]">
                {profile.businessName || `${user?.name?.split(' ')[0]}'s business`}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                {profile.businessType && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-ink-600 bg-ink-900/60 px-1.5 py-0.5 font-medium">
                    <Building2 className="h-3 w-3 text-brand-400" />
                    {profile.businessType}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user?.city}
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined {relativeTime(user?.createdAt)}
                </span>
              </div>
              {user?.email && (
                <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
            <StatusPill meta={meta} />
            {status === 'approved' && profile.approvedAt && (
              <span className="text-[11px] text-slate-500">
                Verified {relativeTime(profile.approvedAt)}
              </span>
            )}
          </div>
        </div>
      </motion.header>

      {/* ─── Status banner — only when not active ─── */}
      {status !== 'approved' && (
        <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ring-1 ${
          {
            warning: 'border-amber-500/30 bg-amber-500/[0.04] ring-amber-500/10',
            brand:   'border-brand-500/30 bg-brand-500/[0.04] ring-brand-500/10',
            danger:  'border-red-500/30 bg-red-500/[0.04] ring-red-500/10',
          }[meta.tone]
        }`}>
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${BG_BY_TONE[meta.tone]} ring-1`}>
            <meta.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-white">{meta.label}</p>
            <p className="mt-0.5 text-slate-400">{meta.description}</p>
            {status === 'rejected' && profile.rejectionReason && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
                  Reviewer note
                </span>
                <p className="mt-1">{profile.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Active dashboard ─── */}
      {status === 'approved' && (
        <>
          {/* KPIs */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              icon={Store}
              label="Listings"
              value={listings.total}
              hint={`${filteredListings.length} shown`}
              accent="bg-brand-500/15 text-brand-300 ring-brand-500/30"
            />
            <Kpi
              icon={Ticket}
              label="Bookings"
              value={totalBookings}
              hint="All-time"
              accent="bg-sky-500/15 text-sky-300 ring-sky-500/30"
            />
            <Kpi
              icon={IndianRupee}
              label="Revenue"
              value={formatCurrency(totalRevenue)}
              hint="Paid only"
              accent="bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
            />
            <Kpi
              icon={Star}
              label="Avg rating"
              value={avgRating ?? '—'}
              hint={avgRating ? `Across ${listings.total} listing${listings.total === 1 ? '' : 's'}` : 'No reviews yet'}
              accent="bg-amber-500/15 text-amber-300 ring-amber-500/30"
            />
          </div>

          {/* Listings */}
          <section className="mt-7">
            <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-white">My listings</h2>
                <p className="text-xs text-slate-500">
                  Inventory you publish on Bookify
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FilterChips
                  value={verticalFilter}
                  onChange={setVerticalFilter}
                  options={[
                    { value: 'all', label: `All · ${allListings.length}` },
                    { value: 'dining', label: `Dining · ${listings.restaurants.length}` },
                    { value: 'plays', label: `Plays · ${listings.plays.length}` },
                    { value: 'events', label: `Events · ${listings.events.length}` },
                  ]}
                />
                <Button icon={Plus} size="sm" onClick={() => setCreateOpen(true)}>
                  Create
                </Button>
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <EmptyState
                icon={Store}
                title={verticalFilter === 'all' ? 'No listings yet' : 'No listings in this category'}
                description={
                  verticalFilter === 'all'
                    ? 'Publish your first listing to start accepting bookings.'
                    : 'Try a different filter, or add one.'
                }
                action={{
                  label: 'Create listing',
                  onClick: () => setCreateOpen(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredListings.map((item) => (
                  <ListingRow
                    key={item._id}
                    item={item}
                    onDelete={() => setToDelete(item)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Activity */}
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-white">
              <Activity className="h-4 w-4 text-brand-400" /> Recent activity
            </h2>
            {loading ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No bookings yet"
                description="Bookings on your listings show up here in real-time."
              />
            ) : (
              <div className="card divide-y divide-white/[0.05]">
                {bookings.slice(0, 8).map((b) => (
                  <ActivityRow key={b._id} booking={b} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CreateListingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultVertical={
          BUSINESS_TYPE_TO_VERTICAL[profile.businessType] || 'dining'
        }
        onCreated={() => {
          setCreateOpen(false);
          loadDashboard();
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={removeListing}
        title="Delete this listing?"
        description={`"${toDelete ? titleOf(toDelete) : ''}" will be removed permanently.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */

function StatusPill({ meta }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${BG_BY_TONE[meta.tone]}`}
    >
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-3.5"
    >
      <div className="flex items-center justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-2.5 font-display text-2xl font-extrabold tabular-nums text-white">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </motion.div>
  );
}

function FilterChips({ value, onChange, options }) {
  return (
    <div className="hidden gap-1 rounded-xl border border-ink-600 bg-ink-900/40 p-1 sm:flex">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            value === o.value
              ? 'bg-brand-500/20 text-brand-200'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ListingRow({ item, onDelete }) {
  const cfg = VERTICAL_CONFIG[item._vertical];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group flex items-stretch gap-3 overflow-hidden p-2.5 transition-colors hover:border-brand-500/40"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-700 sm:h-[68px] sm:w-[120px]">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-600">
            <Store className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{cfg.label}</Badge>
          {item.isFeatured && (
            <Badge tone="gold" icon={Star}>Featured</Badge>
          )}
          {item.isActive === false && (
            <Badge tone="danger">Hidden</Badge>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {titleOf(item)}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" /> {item.city}
          </span>
          <span className="px-1.5 text-slate-700">·</span>
          <span>★ {item.rating?.toFixed(1) || '0.0'} ({item.reviewCount || 0})</span>
          <span className="px-1.5 text-slate-700">·</span>
          <span>Updated {relativeTime(item.updatedAt || item.createdAt)}</span>
        </p>
      </div>

      <div className="flex items-center gap-0.5 pr-1">
        <Link
          to={`${cfg.basePath}/${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white sm:block"
          aria-label="View public page"
          title="View public page"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          aria-label="Delete listing"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function ActivityRow({ booking: b }) {
  const guest = b.user?.name || 'Guest';
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        title={guest}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-700 text-[11px] font-bold text-white"
      >
        {initialsOf(guest)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          <span className="text-slate-400">{guest}</span> booked{' '}
          <span className="text-white">{b.itemTitle}</span>
        </p>
        <p className="truncate text-xs text-slate-500">
          {relativeTime(b.createdAt)} · {b.itemType} · ref {b.reference}
        </p>
      </div>
      <div className="flex items-center gap-2 text-right">
        <Badge tone={b.paymentStatus === 'paid' ? 'success' : 'neutral'}>
          {b.status}
        </Badge>
        <span className="text-sm font-semibold tabular-nums text-white">
          {b.amount > 0 ? formatCurrency(b.amount) : 'Free'}
        </span>
      </div>
    </div>
  );
}

/* ───── Create-listing modal (unchanged) ──────────────────────────────── */

function CreateListingModal({ open, onClose, defaultVertical, onCreated }) {
  const [vertical, setVertical] = useState(defaultVertical);
  const [form, setForm] = useState({
    name: '', description: '', city: CITIES[0], coverImage: '',
    category: EVENT_CATEGORIES[0],
    startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    duration: 120,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => setVertical(defaultVertical), [defaultVertical, open]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const api = listingApiFor(vertical);
      const base = {
        city: form.city,
        description: form.description,
        coverImage: form.coverImage || undefined,
      };
      let payload;
      if (vertical === 'dining') {
        payload = { ...base, name: form.name };
      } else if (vertical === 'plays') {
        payload = { ...base, title: form.name, duration: Number(form.duration) };
      } else {
        payload = {
          ...base,
          title: form.name,
          category: form.category,
          startDate: form.startDate,
        };
      }
      await api.create(payload);
      toast.success('Listing created');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Could not create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new listing" size="xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">Listing type</p>
          <p className="mt-1 text-xs text-slate-500">Choose what you want to publish and fill in the public-facing details.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              options={VERTICAL_OPTIONS}
            />
            <Select
              label="City"
              value={form.city}
              onChange={set('city')}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Basics</p>
            <div className="space-y-4">
              <Input
                label={vertical === 'dining' ? 'Restaurant name' : 'Title'}
                placeholder={vertical === 'dining' ? 'The Copper Table' : 'Summer Night Festival'}
                value={form.name}
                onChange={set('name')}
              />
              <Textarea
                label="Short description"
                placeholder="Describe the experience in one or two engaging sentences."
                rows={5}
                value={form.description}
                onChange={set('description')}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Publishing</p>
            <p className="text-xs text-slate-500">Media and event-specific details.</p>
            {vertical === 'plays' && (
              <Input
                label="Duration (mins)"
                type="number"
                placeholder="120"
                value={form.duration}
                onChange={set('duration')}
              />
            )}
            {vertical === 'events' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Category"
                  value={form.category}
                  onChange={set('category')}
                  options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
                <Input
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={set('startDate')}
                />
              </div>
            )}

            <ImageUploader
              value={form.coverImage}
              onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
              label="Cover image"
              hint="Optional — if left empty, the system will generate a clean placeholder."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} icon={Pencil}>
            Create listing
          </Button>
        </div>
      </form>
    </Modal>
  );
}
