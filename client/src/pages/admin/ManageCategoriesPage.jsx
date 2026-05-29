import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, CornerDownRight, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import Tabs from '../../components/ui/Tabs.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import ConfirmDialog from '../../components/feedback/ConfirmDialog.jsx';
import { categoriesApi } from '../../api/categories.api.js';
import { navLinksApi } from '../../api/navLinks.api.js';
import { refreshNavLinks } from '../../hooks/useNavLinks.js';

/* Mirrors the navbar verticals. Each vertical groups the kinds that apply
   to it so admins can manage cuisines + features under "Dining", etc. */
const VERTICAL_TABS = [
  { value: 'dining', label: 'Dining' },
  { value: 'plays', label: 'Plays' },
  { value: 'events', label: 'Events' },
];

const KINDS_BY_VERTICAL = {
  dining: [
    { kind: 'cuisine', label: 'Cuisines', addLabel: 'Add cuisine' },
    { kind: 'feature', label: 'Restaurant features', addLabel: 'Add feature' },
  ],
  plays: [{ kind: 'genre', label: 'Play genres', addLabel: 'Add genre' }],
  events: [{ kind: 'category', label: 'Event categories', addLabel: 'Add category' }],
};

export default function ManageCategoriesPage() {
  const [tab, setTab] = useState('dining');
  const [customNavLinks, setCustomNavLinks] = useState([]);

  /* Pull custom standalone navlinks so they appear as taxonomy tabs too. */
  const loadCustom = useCallback(() => {
    navLinksApi
      .list()
      .then((items) => {
        const customs = (items || []).filter(
          (n) =>
            n.path?.startsWith('/c/') && !n.targetVertical,
        );
        setCustomNavLinks(customs);
      })
      .catch(() => setCustomNavLinks([]));
  }, []);

  useEffect(loadCustom, [loadCustom]);

  const tabs = [
    ...VERTICAL_TABS,
    ...customNavLinks.map((n) => ({ value: `nl:${n._id}`, label: n.label })),
  ];

  const activeCustom = tab.startsWith('nl:')
    ? customNavLinks.find((n) => `nl:${n._id}` === tab)
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Categories</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage the navbar and the taxonomy that powers the listing forms
            and filter sidebar. Each entry can have sub-categories.
          </p>
        </div>
      </div>

      <NavbarLinksSection onChange={loadCustom} />

      <Tabs
        className="mt-8"
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-6 space-y-8">
        {activeCustom ? (
          <KindSection
            key={activeCustom._id}
            kind="custom"
            navLinkId={activeCustom._id}
            label={`${activeCustom.label} sub-categories`}
            addLabel={`Add to ${activeCustom.label}`}
          />
        ) : (
          KINDS_BY_VERTICAL[tab]?.map((group) => (
            <KindSection key={group.kind} kind={group.kind} {...group} />
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────── Navbar item management ────────────────────────── */

function NavbarLinksSection({ onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);   // { mode, item }
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    navLinksApi
      .list()
      .then((d) => setItems(d || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const remove = async () => {
    try {
      await navLinksApi.remove(toDelete._id);
      setItems((prev) => prev.filter((i) => i._id !== toDelete._id));
      refreshNavLinks();
      onChange?.();
      toast.success('Removed from navbar');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <section className="card mt-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
            <Compass className="h-4 w-4 text-brand-400" /> Navbar items
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Controls the tabs shown in the top navbar across the site.
          </p>
        </div>
        <Button
          size="sm"
          icon={Plus}
          onClick={() => setModal({ mode: 'create' })}
        >
          Add navbar item
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-xs text-slate-500">
          No navbar items yet. Click "Add navbar item" to create one.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item._id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                <p className="truncate font-mono text-[11px] text-slate-500">
                  {item.path}
                  {item.end && (
                    <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                      exact
                    </span>
                  )}
                </p>
              </div>
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
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <NavLinkFormModal
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshNavLinks();
            load();
            onChange?.();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Remove from navbar?"
        description={`"${toDelete?.label || ''}" will be removed from the navbar everywhere.`}
        confirmLabel="Remove"
        danger
      />
    </section>
  );
}

/* Built-in routes that already exist in React Router. Custom categories go
   under /c/:slug so they never collide with a hardcoded path. */
const BUILTIN_ROUTES = [
  { value: '/',        label: 'For You (home)',         end: true },
  { value: '/dining',  label: 'Dining (restaurants)',   end: false },
  { value: '/plays',   label: 'Plays (sports & turfs)', end: false },
  { value: '/events',  label: 'Events',                 end: false },
];

const TARGET_VERTICALS = [
  { value: '',       label: 'N/A (placeholder — no listings)' },
  { value: 'dining', label: 'Dining' },
  { value: 'plays',  label: 'Plays' },
  { value: 'events', label: 'Events' },
];

/* Map vertical → which "kind" of category filter is meaningful for it. */
const FILTER_KIND_BY_VERTICAL = {
  dining: 'cuisine',
  plays:  'genre',
  events: 'category',
};

/* Map of filter-kind → query param name the listing API expects. */
const FILTER_PARAM = {
  cuisine:  'cuisine',
  feature:  'feature',
  genre:    'genre',
  category: 'category',
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function NavLinkFormModal({ mode, item, onClose, onSaved }) {
  /* `mode` is the form's own concept here: "builtin" picks one of the
     hardcoded routes; "custom" creates a /c/:slug entry with its own
     listing view + filter. */
  const initialMode = item?.path?.startsWith('/c/') ? 'custom' : 'builtin';
  const initialFilterValues =
    Array.isArray(item?.filters?.[FILTER_PARAM[FILTER_KIND_BY_VERTICAL[item?.targetVertical]]])
      ? item.filters[FILTER_PARAM[FILTER_KIND_BY_VERTICAL[item?.targetVertical]]]
      : [];

  const [form, setForm] = useState(() => ({
    mode: initialMode,
    label: item?.label || '',
    /* builtin */
    builtinPath: initialMode === 'builtin' ? item?.path || '/' : '/dining',
    /* custom */
    slug: initialMode === 'custom' ? (item.path || '').replace('/c/', '') : '',
    targetVertical: item?.targetVertical || 'plays',
    filterValues: initialFilterValues,
    /* Hero band for the matching listing page. */
    heroImage: item?.heroImage || '',
    heroSubtitle: item?.heroSubtitle || '',
    end: Boolean(item?.end),
    displayOrder: item?.displayOrder ?? 10,
  }));
  const [saving, setSaving] = useState(false);
  const [filterOptions, setFilterOptions] = useState([]);

  /* When the target vertical changes, pull the available chips (cuisines /
     genres / categories) so the admin can multi-select what this navbar
     item should filter by. */
  useEffect(() => {
    if (form.mode !== 'custom') return;
    const kind = FILTER_KIND_BY_VERTICAL[form.targetVertical];
    if (!kind) return setFilterOptions([]);
    categoriesApi
      .list({ kind, parentId: 'null' })
      .then((items) => setFilterOptions((items || []).map((i) => i.name)))
      .catch(() => setFilterOptions([]));
  }, [form.mode, form.targetVertical]);

  /* Auto-generate the slug from the label until the admin overrides it. */
  useEffect(() => {
    if (form.mode !== 'custom' || mode === 'edit') return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.label) }));
  }, [form.label, form.mode, mode]);

  const toggleFilterValue = (value) => {
    setForm((prev) => ({
      ...prev,
      filterValues: prev.filterValues.includes(value)
        ? prev.filterValues.filter((v) => v !== value)
        : [...prev.filterValues, value],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) return toast.error('Label is required');

    let payload;
    if (form.mode === 'builtin') {
      const route = BUILTIN_ROUTES.find((r) => r.value === form.builtinPath);
      if (!route) return toast.error('Pick a valid destination');
      payload = {
        label: form.label,
        path: route.value,
        end: route.end,
        targetVertical: null,
        filters: {},
        heroImage: form.heroImage || '',
        heroSubtitle: form.heroSubtitle || '',
        displayOrder: Number(form.displayOrder) || 0,
      };
    } else {
      const slug = slugify(form.slug || form.label);
      if (!slug) return toast.error('Slug is required');
      let filters = {};
      if (form.targetVertical && form.filterValues.length) {
        const kind = FILTER_KIND_BY_VERTICAL[form.targetVertical];
        const param = FILTER_PARAM[kind];
        if (param) filters = { [param]: form.filterValues };
      }
      payload = {
        label: form.label,
        path: `/c/${slug}`,
        end: false,
        targetVertical: form.targetVertical || null,
        filters,
        heroImage: form.heroImage || '',
        heroSubtitle: form.heroSubtitle || '',
        displayOrder: Number(form.displayOrder) || 0,
      };
    }

    setSaving(true);
    try {
      if (mode === 'edit') {
        await navLinksApi.update(item._id, payload);
      } else {
        await navLinksApi.create(payload);
      }
      toast.success(mode === 'edit' ? 'Updated' : 'Added to navbar');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit navbar item' : 'Add navbar item'}
      size="md"
    >
      <form onSubmit={save} className="space-y-4">
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-ink-900/40 p-1">
          {[
            { value: 'builtin', label: 'Existing page' },
            { value: 'custom',  label: 'New category' },
          ].map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setForm({ ...form, mode: m.value })}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                form.mode === m.value
                  ? 'bg-brand-500/20 text-brand-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Input
          label="Label"
          placeholder={form.mode === 'custom' ? 'Cricket Turfs' : 'Sports'}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />

        {form.mode === 'builtin' && (
          <Select
            label="Destination"
            value={form.builtinPath}
            onChange={(e) => setForm({ ...form, builtinPath: e.target.value })}
            options={BUILTIN_ROUTES.map((r) => ({ value: r.value, label: r.label }))}
          />
        )}

        {form.mode === 'custom' && (
          <>
            <Input
              label="URL slug"
              placeholder="cricket-turfs"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              hint={`This becomes "/c/${form.slug || 'your-slug'}".`}
            />
            <Select
              label="Show listings from"
              value={form.targetVertical}
              onChange={(e) =>
                setForm({ ...form, targetVertical: e.target.value, filterValues: [] })
              }
              options={TARGET_VERTICALS}
            />
            {form.targetVertical && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Filter to (optional)
                </label>
                {filterOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No filter chips available yet. Add some under Categories first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((opt) => {
                      const active = form.filterValues.includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => toggleFilterValue(opt)}
                          className={`chip ${active ? 'chip-active' : ''}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1.5 text-xs text-slate-500">
                  Pick none to show every listing from this vertical; pick a
                  few to pre-filter the page (e.g. "Box Cricket" + "Turf
                  Cricket").
                </p>
              </div>
            )}
            {!form.targetVertical && (
              <p className="rounded-xl border border-white/[0.06] bg-ink-900/40 px-3 py-2.5 text-xs text-slate-400">
                This tab will be a placeholder — no listings will be shown.
                Useful for a "Coming soon" or hub page.
              </p>
            )}
          </>
        )}

        {/* Hero band image + subtitle for the destination page. */}
        <div className="rounded-2xl border border-white/[0.06] bg-ink-900/40 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">Page hero</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Controls the big banner image and subtitle shown at the top of
              this navbar item's destination page. Leave empty to use the
              built-in defaults.
            </p>
          </div>
          <ImageUploader
            value={form.heroImage}
            onChange={(url) => setForm((f) => ({ ...f, heroImage: url }))}
            label="Hero banner image"
            hint="Wide landscape image works best (1600×500 ish)."
          />
          <Textarea
            label="Hero subtitle"
            rows={2}
            placeholder="A short line shown under the page title."
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          />
        </div>

        <Input
          label="Display order"
          type="number"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
          hint="Lower numbers appear first in the navbar. For You=0, Dining=1, Plays=2, Events=3."
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === 'edit' ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────── A single "kind" list inside a vertical ────────── */

function KindSection({ kind, navLinkId, label, addLabel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);     // { mode, item, parent }
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const query = { kind };
    if (navLinkId) query.navLinkId = navLinkId;
    categoriesApi
      .list(query)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [kind, navLinkId]);

  useEffect(load, [load]);

  const remove = async () => {
    try {
      await categoriesApi.remove(toDelete._id);
      setItems((prev) =>
        prev.filter((i) => i._id !== toDelete._id && i.parentId !== toDelete._id),
      );
      toast.success('Deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  const topLevel = items.filter((i) => !i.parentId);
  const childrenOf = (id) => items.filter((i) => String(i.parentId) === String(id));

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-white">{label}</h2>
        <Button
          size="sm"
          icon={Plus}
          onClick={() => setModal({ mode: 'create', parent: null })}
        >
          {addLabel}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-xs text-slate-500">
          No entries yet. Click "{addLabel}" to add one.
        </p>
      ) : (
        <ul className="space-y-2">
          {topLevel.map((item) => (
            <li key={item._id}>
              <CategoryRow
                item={item}
                onEdit={() => setModal({ mode: 'edit', item, parent: null })}
                onDelete={() => setToDelete(item)}
                onAddSub={() => setModal({ mode: 'create', parent: item })}
              />
              {childrenOf(item._id).length > 0 && (
                <ul className="ml-6 mt-1.5 space-y-1.5 border-l border-white/[0.06] pl-3">
                  {childrenOf(item._id).map((sub) => (
                    <li
                      key={sub._id}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-ink-900/40 px-3 py-2"
                    >
                      <CornerDownRight className="h-3.5 w-3.5 text-slate-500" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                        {sub.name}
                      </span>
                      <button
                        onClick={() => setModal({ mode: 'edit', item: sub })}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        aria-label="Edit subcategory"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setToDelete(sub)}
                        className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                        aria-label="Delete subcategory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <CategoryFormModal
          mode={modal.mode}
          item={modal.item}
          parent={modal.parent}
          kind={kind}
          navLinkId={navLinkId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this entry?"
        description={
          toDelete?.parentId
            ? `"${toDelete?.name}" will be removed.`
            : `"${toDelete?.name || ''}" and any sub-categories under it will be removed from every form and filter.`
        }
        confirmLabel="Delete"
        danger
      />
    </section>
  );
}

function CategoryRow({ item, onEdit, onDelete, onAddSub }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/60 p-3">
      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
        {item.isActive === false && (
          <p className="text-xs text-amber-300">Hidden</p>
        )}
      </div>
      <button
        onClick={onAddSub}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-200 transition-colors hover:bg-brand-500/15"
      >
        <Plus className="h-3 w-3" />
        Sub
      </button>
      <button
        onClick={onEdit}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function CategoryFormModal({ mode, item, parent, kind, navLinkId, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: item?.name || '',
    displayOrder: item?.displayOrder ?? 0,
    isActive: item?.isActive !== false,
  }));
  const [saving, setSaving] = useState(false);

  const title =
    mode === 'edit'
      ? 'Edit entry'
      : parent
        ? `Add sub-category under "${parent.name}"`
        : 'Add new entry';

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (mode === 'edit') {
        await categoriesApi.update(item._id, form);
      } else {
        await categoriesApi.create({
          ...form,
          kind,
          parentId: parent?._id || null,
          navLinkId: navLinkId || null,
        });
      }
      toast.success(mode === 'edit' ? 'Updated' : 'Created');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={title} size="sm">
      <form onSubmit={save} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Display order"
          type="number"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
          hint="Lower numbers appear first. Leave at 0 if the order doesn't matter."
        />
        {mode === 'edit' && (
          <label className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-ink-900/40 px-3 py-2.5 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-ink-600 bg-ink-900 accent-brand-500"
            />
            Visible in forms and filters
          </label>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
