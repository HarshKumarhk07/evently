import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Tabs from '../../components/ui/Tabs.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/feedback/ConfirmDialog.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';
import GalleryUploader from '../../components/admin/GalleryUploader.jsx';
import { listingApiFor, restaurantsApi, playsApi, eventsApi } from '../../api/listings.api.js';
import { VERTICAL_CONFIG, titleOf } from '../../lib/listings.js';
import { EVENT_CATEGORIES } from '../../lib/constants.js';
import { useLocation } from '../../context/LocationContext.jsx';
import { makeArtImage } from '../../lib/visuals.js';

const blankForm = {
  name: '',
  description: '',
  city: '',
  cityId: '',
  locality: '',
  coverImage: '',
  gallery: [],
  isFeatured: false,
  cuisine: '',
  costForTwo: 1500,
  language: 'English',
  duration: 120,
  category: EVENT_CATEGORIES[0],
  startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
};

/* Maps the flat form state to a vertical-specific API payload. */
function buildPayload(vertical, form) {
  const base = {
    city: form.city,
    /* Empty string for ObjectId triggers a Mongoose CastError that silently
       blocks the whole save — only send cityId when we have a real id. */
    cityId: form.cityId || undefined,
    locality: form.locality,
    description: form.description,
    coverImage:
      form.coverImage ||
      makeArtImage({
        theme: vertical,
        title: form.name || VERTICAL_CONFIG[vertical].label,
        subtitle: form.city,
        seed: `${vertical}:${form.name || form.city}`,
        width: 1200,
        height: 800,
      }),
    gallery: Array.isArray(form.gallery) ? form.gallery.filter(Boolean) : [],
    isFeatured: form.isFeatured,
  };
  if (form.lat && form.lng) {
    base.location = { lat: Number(form.lat), lng: Number(form.lng) };
    base.locationGeo = { type: 'Point', coordinates: [Number(form.lng), Number(form.lat)] };
  }
  if (vertical === 'dining') {
    return {
      ...base,
      name: form.name,
      location: { lat: Number(form.lat) || 0, lng: Number(form.lng) || 0 },
      locationGeo: { type: 'Point', coordinates: [Number(form.lng) || 0, Number(form.lat) || 0] },
      cuisine: form.cuisine ? form.cuisine.split(',').map((c) => c.trim()) : [],
      costForTwo: Number(form.costForTwo),
    };
  }
  if (vertical === 'plays') {
    return {
      ...base,
      title: form.name,
      language: form.language,
      duration: Number(form.duration),
    };
  }
  return { ...base, title: form.name, category: form.category, startDate: form.startDate };
}

export default function ManageListingsPage() {
  const [vertical, setVertical] = useState('dining');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode, item }
  const [toDelete, setToDelete] = useState(null);
  const [counts, setCounts] = useState({ dining: 0, plays: 0, events: 0 });

  const api = listingApiFor(vertical);

  const load = useCallback(() => {
    setLoading(true);
    api
      .list({ limit: 50, sort: 'newest' })
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(load, [load]);

  /* Load tab counts so the user can see how many listings exist per vertical
     without having to click each tab. */
  useEffect(() => {
    Promise.all([
      restaurantsApi.list({ limit: 1 }).then((d) => d.pagination?.total || 0).catch(() => 0),
      playsApi.list({ limit: 1 }).then((d) => d.pagination?.total || 0).catch(() => 0),
      eventsApi.list({ limit: 1 }).then((d) => d.pagination?.total || 0).catch(() => 0),
    ]).then(([dining, plays, events]) => setCounts({ dining, plays, events }));
  }, [items.length]);

  const tabs = [
    { value: 'dining', label: `Restaurants · ${counts.dining}` },
    { value: 'plays', label: `Plays · ${counts.plays}` },
    { value: 'events', label: `Events · ${counts.events}` },
  ];

  const locationCtx = useLocation();

  const remove = async () => {
    try {
      await api.remove(toDelete._id);
      setItems((prev) => prev.filter((i) => i._id !== toDelete._id));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Listings</h1>
          <p className="mt-1 text-sm text-slate-400">Create and manage everything bookable.</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create' })}>
          Add new
        </Button>
      </div>

      <Tabs
        className="mt-6"
        tabs={tabs}
        value={vertical}
        onChange={(v) => {
          setVertical(v);
          setItems([]);
        }}
      />

      <div className="mt-5 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No listings yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="card flex items-center gap-3 p-3"
            >
              <img
                src={item.coverImage}
                alt=""
                className="h-12 w-16 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-white">
                  {titleOf(item)}
                  {item.isFeatured && (
                    <Badge tone="gold" icon={Star}>
                      Featured
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {item.city} · ★ {item.rating?.toFixed(1) || '0.0'} · {item.reviewCount} reviews
                </p>
              </div>
              <Link
                to={`${VERTICAL_CONFIG[vertical].basePath}/${item.slug}`}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="View public page"
                title="View public page"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setModal({ mode: 'edit', item })}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setToDelete(item)}
                className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {modal && (
        <ListingFormModal
          vertical={vertical}
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={(savedItem) => {
            setModal(null);
            if (savedItem?._id) {
              setItems((prev) => {
                const next = prev.filter((i) => i._id !== savedItem._id);
                return [savedItem, ...next];
              });
            }
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this listing?"
        description={`“${toDelete ? titleOf(toDelete) : ''}” will be permanently removed.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

/* Create / edit form rendered inside a modal. */
function ListingFormModal({ vertical, mode, item, onClose, onSaved }) {
  const cfg = VERTICAL_CONFIG[vertical];
  const api = listingApiFor(vertical);
  const locationCtx = useLocation();

  const [form, setForm] = useState(() => ({
    ...blankForm,
    ...(item && {
      name: titleOf(item),
      description: item.description || '',
      city: item.city,
      cityId: item.cityId || '',
      locality: item.locality || '',
      coverImage: item.coverImage || '',
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
      isFeatured: item.isFeatured || false,
      cuisine: (item.cuisine || []).join(', '),
      costForTwo: item.costForTwo || 1500,
      language: item.language || 'English',
      duration: item.duration || 120,
      category: item.category || EVENT_CATEGORIES[0],
    }),
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      ...blankForm,
      ...(item && {
        name: titleOf(item),
        description: item.description || '',
        city: item.city,
        cityId: item.cityId || '',
        locality: item.locality || '',
        coverImage: item.coverImage || '',
        isFeatured: item.isFeatured || false,
        cuisine: (item.cuisine || []).join(', '),
        costForTwo: item.costForTwo || 1500,
        language: item.language || 'English',
        duration: item.duration || 120,
        category: item.category || EVENT_CATEGORIES[0],
      }),
    });
  }, [item, vertical]);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const payload = buildPayload(vertical, form);
      const savedItem = mode === 'edit' ? await api.update(item._id, payload) : await api.create(payload);
      toast.success(mode === 'edit' ? 'Listing updated' : 'Listing created');
      onSaved(savedItem);
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mode === 'edit' ? 'Edit' : 'New'} ${cfg.label.replace(/s$/, '')}`}
      size="xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">Listing details</p>
          <p className="mt-1 text-xs text-slate-500">Set the public title and description that people will see first.</p>
          <div className="mt-4 space-y-4">
            <Input
              label={vertical === 'dining' ? 'Restaurant name' : 'Title'}
              placeholder={vertical === 'dining' ? 'The Copper Table' : 'Summer Nights Concert'}
              value={form.name}
              onChange={set('name')}
            />
            <Textarea
              label="Short description"
              rows={4}
              placeholder="Write a short, compelling description for the listing."
              value={form.description}
              onChange={set('description')}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Location & category</p>
            <p className="text-xs text-slate-500">Choose the city and optional area for search and discovery.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="City"
                value={form.cityId || form.city || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const found = locationCtx.cities.find((c) => c._id === v || c.cityName === v);
                  setForm({ ...form, city: found ? found.cityName : v, cityId: found ? found._id : '' });
                }}
                options={[
                  { value: '', label: 'Choose a city' },
                  ...locationCtx.cities.map((c) => ({ value: c._id, label: c.cityName })),
                ]}
              />
              <Input
                label="Locality / Area"
                placeholder="Bandra West, MG Road, etc."
                value={form.locality}
                onChange={(e) => setForm({ ...form, locality: e.target.value })}
              />
              {vertical === 'dining' && (
                <Input label="Cost for two (₹)" type="number" placeholder="1500" value={form.costForTwo} onChange={set('costForTwo')} />
              )}
              {vertical === 'plays' && (
                <Input label="Duration (mins)" type="number" placeholder="120" value={form.duration} onChange={set('duration')} />
              )}
              {vertical === 'events' && (
                <Select
                  label="Category"
                  value={form.category}
                  onChange={set('category')}
                  options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              )}
              {vertical === 'dining' && (
                <Input
                  label="Cuisines"
                  value={form.cuisine}
                  onChange={set('cuisine')}
                  placeholder="Italian, Continental"
                  hint="Comma-separated list"
                />
              )}
              {vertical === 'plays' && (
                <Input label="Language" placeholder="English" value={form.language} onChange={set('language')} />
              )}
              {vertical === 'events' && (
                <Input label="Start date" type="date" value={form.startDate} onChange={set('startDate')} />
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Media & publishing</p>
            <p className="text-xs text-slate-500">Upload a cover or let the system generate one automatically.</p>
            <ImageUploader
              value={form.coverImage}
              onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
              hint="Uploads to Cloudinary · leave empty for auto-generated artwork"
            />
            <GalleryUploader
              value={form.gallery || []}
              onChange={(next) => setForm((f) => ({ ...f, gallery: next }))}
              label="Gallery images"
              hint="Show off the venue/event with extra photos."
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Latitude" type="number" step="any" placeholder="19.0760" value={form.lat || ''} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <Input label="Longitude" type="number" step="any" placeholder="72.8777" value={form.lng || ''} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              <div className="rounded-xl border border-white/[0.06] bg-ink-900/30 px-3 py-2.5 text-xs text-slate-500">
                Pin the exact location here so maps and nearby search stay accurate.
              </div>
            </div>

            <label className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-ink-900/40 px-3 py-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={set('isFeatured')}
                className="h-4 w-4 rounded border-ink-600 bg-ink-900 accent-brand-500"
              />
              Mark as featured
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === 'edit' ? 'Save changes' : 'Create listing'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
