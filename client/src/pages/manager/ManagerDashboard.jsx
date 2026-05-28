import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Store, Ticket, IndianRupee, MailCheck, ShieldCheck, CircleAlert,
  Pencil, Trash2, ExternalLink, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
import { formatCurrency, formatDate } from '../../lib/format.js';

/* Drives both the status banner and the gating logic for the dashboard. */
const STATUS_META = {
  pending_email: {
    tone: 'warning',
    icon: MailCheck,
    label: 'Email verification pending',
    description:
      'We sent you a verification link. Please confirm your email before your application can be reviewed.',
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
    description: 'Please review the reason below and reach out to support if you have questions.',
  },
  approved: {
    tone: 'success',
    icon: ShieldCheck,
    label: 'Verified manager',
    description: 'Your account is active — you can list and manage your business below.',
  },
};

/* Maps the manager's businessType onto one of our three platform verticals. */
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

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4 p-4"
    >
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const status = user?.managerProfile?.status || 'pending_email';
  const meta = STATUS_META[status];

  const [listings, setListings] = useState({ restaurants: [], plays: [], events: [], total: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  /* Flatten all listings into a single array tagged with `_vertical`. */
  const allListings = [
    ...listings.restaurants.map((r) => ({ ...r, _vertical: 'dining' })),
    ...listings.plays.map((p) => ({ ...p, _vertical: 'plays' })),
    ...listings.events.map((e) => ({ ...e, _vertical: 'events' })),
  ];

  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="section py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
              Manager Console
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              {user?.managerProfile?.businessName || `${user?.name?.split(' ')[0]}'s business`}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
          </div>
          <StatusBadge meta={meta} />
        </div>
      </motion.div>

      {/* Status banner */}
      <div className={`mt-6 card flex items-start gap-4 p-5 border-l-4 ${BORDER_BY_TONE[meta.tone]}`}>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${BG_BY_TONE[meta.tone]}`}>
          <meta.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{meta.label}</p>
          <p className="mt-1 text-sm text-slate-400">{meta.description}</p>
          {status === 'rejected' && user?.managerProfile?.rejectionReason && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <strong>Reason:</strong> {user.managerProfile.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {status === 'approved' && (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard
              icon={Store}
              label="Total listings"
              value={listings.total}
              accent="bg-brand-500/15 text-brand-300"
            />
            <StatCard
              icon={Ticket}
              label="Bookings on your listings"
              value={totalBookings}
              accent="bg-sky-500/15 text-sky-300"
            />
            <StatCard
              icon={IndianRupee}
              label="Lifetime revenue"
              value={formatCurrency(totalRevenue)}
              accent="bg-emerald-500/15 text-emerald-300"
            />
          </div>

          {/* My listings */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-white">My listings</h2>
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Create listing
            </Button>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : allListings.length === 0 ? (
              <EmptyState
                icon={Store}
                title="No listings yet"
                description="Create your first listing to start accepting bookings."
                action={{ label: 'Create listing', onClick: () => setCreateOpen(true) }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {allListings.map((item) => (
                  <div
                    key={item._id}
                    className="card flex items-center gap-3 p-3"
                  >
                    <img
                      src={item.coverImage}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg bg-ink-700 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{VERTICAL_CONFIG[item._vertical].label}</Badge>
                        {item.isFeatured && (
                          <Badge tone="gold" icon={Star}>Featured</Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-white">
                        {titleOf(item)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.city} · ★ {item.rating?.toFixed(1) || '0.0'} · {item.reviewCount} reviews
                      </p>
                    </div>
                    <Link
                      to={`${VERTICAL_CONFIG[item._vertical].basePath}/${item.slug}`}
                      target="_blank"
                      className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white sm:block"
                      aria-label="View public page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setToDelete(item)}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                      aria-label="Delete listing"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent bookings (compact) */}
          <div className="mt-10">
            <h2 className="mb-4 font-display text-lg font-bold text-white">Recent bookings</h2>
            {loading ? (
              <Skeleton className="h-32" />
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No bookings yet"
                description="Bookings on your listings will show up here in real time."
              />
            ) : (
              <div className="card divide-y divide-white/[0.05]">
                {bookings.slice(0, 8).map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {b.itemTitle}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {b.user?.name || 'Guest'} · {formatDate(b.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{b.itemType}</Badge>
                      <span className="text-sm font-semibold text-white">
                        {b.amount > 0 ? formatCurrency(b.amount) : 'Free'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CreateListingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultVertical={BUSINESS_TYPE_TO_VERTICAL[user?.managerProfile?.businessType] || 'dining'}
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

const BG_BY_TONE = {
  warning: 'bg-amber-500/15 text-amber-300',
  brand: 'bg-brand-500/15 text-brand-300',
  danger: 'bg-red-500/15 text-red-300',
  success: 'bg-emerald-500/15 text-emerald-300',
};
const BORDER_BY_TONE = {
  warning: 'border-amber-500/40',
  brand: 'border-brand-500/40',
  danger: 'border-red-500/40',
  success: 'border-emerald-500/40',
};

function StatusBadge({ meta }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${BORDER_BY_TONE[meta.tone]} ${BG_BY_TONE[meta.tone]}`}
    >
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ───── Create-listing modal ──────────────────────────────────────────── */

function CreateListingModal({ open, onClose, defaultVertical, onCreated }) {
  const [vertical, setVertical] = useState(defaultVertical);
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: CITIES[0],
    coverImage: '',
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
    <Modal open={open} onClose={onClose} title="Create a new listing" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Select
          label="Type"
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          options={VERTICAL_OPTIONS}
        />
        <Input
          label={vertical === 'dining' ? 'Restaurant name' : 'Title'}
          value={form.name}
          onChange={set('name')}
        />
        <Textarea
          label="Short description"
          rows={3}
          value={form.description}
          onChange={set('description')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="City"
            value={form.city}
            onChange={set('city')}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />
          {vertical === 'plays' && (
            <Input
              label="Duration (mins)"
              type="number"
              value={form.duration}
              onChange={set('duration')}
            />
          )}
          {vertical === 'events' && (
            <>
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
            </>
          )}
        </div>

        <ImageUploader
          value={form.coverImage}
          onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
          label="Cover image"
          hint="Optional — leave empty and we'll generate a placeholder."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} icon={Pencil}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
