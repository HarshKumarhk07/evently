import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Building2, FileText, IdCard, MapPin, Check, X,
  ShieldCheck, CircleAlert, MailCheck, ExternalLink, Mail, Calendar,
  Landmark, Image as ImageIcon, FileCheck2, ZoomIn, ChevronRight,
  CreditCard, Hash, AlertCircle, Plus,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Tabs from '../../components/ui/Tabs.jsx';
import { Input, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { adminApi } from '../../api/admin.api.js';
import { formatDate, relativeTime } from '../../lib/format.js';

const STATUS_TABS = [
  { value: 'all',              label: 'All' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved',         label: 'Approved' },
  { value: 'rejected',         label: 'Rejected' },
  { value: 'pending_email',    label: 'Unverified' },
];

const STATUS_META = {
  pending_email:    { tone: 'warning', icon: MailCheck,    label: 'Email pending' },
  pending_approval: { tone: 'brand',   icon: ShieldCheck,  label: 'Pending review' },
  approved:         { tone: 'success', icon: ShieldCheck,  label: 'Approved' },
  rejected:         { tone: 'danger',  icon: CircleAlert,  label: 'Rejected' },
  suspended:        { tone: 'danger',  icon: CircleAlert,  label: 'Suspended' },
};

const TONE_BG = {
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  brand:   'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  danger:  'bg-red-500/15 text-red-300 ring-red-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

/* ───────────────────────────────────────────────────────────── */

export default function ManageManagersPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);

  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .managers({ status: tab, search: debounced, limit: 50 })
      .then((d) => {
        setItems(d.items);
        if (typeof d.pendingCount === 'number') setPendingCount(d.pendingCount);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab, debounced]);

  useEffect(load, [load]);

  const approve = async (id) => {
    try {
      await adminApi.approveManager(id);
      toast.success('Manager approved');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Approve failed');
    }
  };

  const reject = async (id, reason) => {
    try {
      await adminApi.rejectManager(id, reason);
      toast.success('Manager rejected');
      setRejectFor(null);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Reject failed');
    }
  };

  const tabs = STATUS_TABS.map((t) =>
    t.value === 'pending_approval' && pendingCount > 0
      ? { ...t, count: pendingCount }
      : t,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Managers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review applications, verify documents and grant access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              icon={Search}
              placeholder="Search by name, email, business"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add manager
          </Button>
        </div>
      </div>

      <Tabs className="mt-6" tabs={tabs} value={tab} onChange={setTab} />

      <div className="mt-5 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-2xl" />)
        ) : items.length === 0 ? (
          <EmptyState
            title="No managers in this view"
            description="When new managers register they'll appear here for review."
          />
        ) : (
          items.map((m) => (
            <ManagerRow
              key={m._id}
              manager={m}
              onReview={() => setSelected(m)}
              onApprove={() => approve(m._id)}
              onReject={() => setRejectFor(m)}
            />
          ))
        )}
      </div>

      {selected && (
        <ManagerReviewModal
          manager={selected}
          onClose={() => setSelected(null)}
          onApprove={() => approve(selected._id)}
          onReject={() => setRejectFor(selected)}
        />
      )}

      {rejectFor && (
        <RejectModal
          manager={rejectFor}
          onClose={() => setRejectFor(null)}
          onConfirm={(reason) => reject(rejectFor._id, reason)}
        />
      )}

      {creating && (
        <CreateManagerModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ────────── Admin: add a new manager directly ────────────────── */

function CreateManagerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    businessName: '',
    businessType: 'Restaurant',
    businessAddress: '',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error('Valid email required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.businessName.trim()) return toast.error('Business name is required');
    setSaving(true);
    try {
      await adminApi.createManager(form);
      toast.success('Manager created and approved');
      onCreated();
    } catch (err) {
      toast.error(err.message || 'Could not create manager');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add a new manager" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-xl border border-brand-500/30 bg-brand-500/[0.05] p-3 text-xs text-brand-200">
          Managers added here are auto-verified and auto-approved. They can sign
          in with the email + password you set, and immediately publish listings.
        </p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Account
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={update('name')} />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={update('password')}
              hint="At least 6 characters"
            />
            <Input label="Phone" value={form.phone} onChange={update('phone')} />
            <Input label="City" value={form.city} onChange={update('city')} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Business
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Business name"
              value={form.businessName}
              onChange={update('businessName')}
            />
            <Input
              label="Business type"
              value={form.businessType}
              onChange={update('businessType')}
              hint="Restaurant / Play / Turf / Event / Theatre / Activity"
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Business address"
                rows={2}
                value={form.businessAddress}
                onChange={update('businessAddress')}
              />
            </div>
            <Input
              label="PAN (optional)"
              value={form.panNumber}
              onChange={update('panNumber')}
            />
            <Input
              label="GST (optional)"
              value={form.gstNumber}
              onChange={update('gstNumber')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} icon={Check}>
            Create &amp; approve
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ────────── List row ─────────────────────────────────────────── */

function ManagerRow({ manager: m, onReview, onApprove, onReject }) {
  const p = m.managerProfile || {};
  const meta = STATUS_META[p.status] || STATUS_META.pending_approval;
  const isPending = p.status === 'pending_approval';
  const docs = [p.businessLicense?.url, p.idProof?.url].filter(Boolean).length;
  const galleryCount = (p.businessImages || []).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-brand-500/40"
    >
      <Avatar name={m.name} src={m.avatar?.url} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {p.businessName || m.name}
          </p>
          <Badge tone="neutral">{p.businessType || '—'}</Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {m.name} · {m.email}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {m.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Applied {relativeTime(m.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="h-3 w-3" /> {docs}/2 docs · {galleryCount} images
          </span>
        </div>
      </div>

      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${TONE_BG[meta.tone]}`}>
        <meta.icon className="h-3 w-3" />
        {meta.label}
      </span>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" iconRight={ChevronRight} onClick={onReview}>
          {isPending ? 'Review' : 'Details'}
        </Button>
        {isPending && (
          <>
            <Button size="sm" icon={Check} onClick={onApprove}>Approve</Button>
            <Button variant="danger" size="sm" icon={X} onClick={onReject}>Reject</Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ────────── Review modal ─────────────────────────────────────── */

function ManagerReviewModal({ manager: m, onClose, onApprove, onReject }) {
  const p = m.managerProfile || {};
  const meta = STATUS_META[p.status] || STATUS_META.pending_approval;
  const isPending = p.status === 'pending_approval';
  const isApproved = p.status === 'approved';
  const isRejected = p.status === 'rejected';
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const galleryUrls = useMemo(
    () => (p.businessImages || []).map((i) => i.url).filter(Boolean),
    [p.businessImages],
  );

  return (
    <>
      <Modal open onClose={onClose} title={null} size="xl">
        {/* ─── Hero ─── */}
        <div className="relative -mx-6 -mt-5 mb-6 overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-brand-500/[0.08] via-transparent to-pink-500/[0.05] px-6 py-5 sm:-mx-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar
                  size="xl"
                  name={p.businessName || m.name}
                  src={m.avatar?.url}
                />
                {isApproved && (
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-ink-800">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
                  KYC review
                </p>
                <h2 className="mt-0.5 truncate font-display text-xl font-extrabold text-white sm:text-2xl">
                  {p.businessName || m.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ring-1 ${TONE_BG[meta.tone]}`}>
                    <meta.icon className="h-3 w-3" /> {meta.label}
                  </span>
                  {p.businessType && (
                    <span className="rounded-md border border-ink-600 bg-ink-900/60 px-1.5 py-0.5 font-medium text-slate-300">
                      <Building2 className="mr-1 inline h-3 w-3 text-brand-400" />
                      {p.businessType}
                    </span>
                  )}
                  <span className="text-slate-500">Applied {relativeTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="self-start rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="space-y-5">
          {/* Banner for terminal states */}
          {isApproved && p.approvedAt && (
            <AuditBanner
              tone="success"
              icon={ShieldCheck}
              title="Approved"
              line={`On ${formatDate(p.approvedAt)} · ${relativeTime(p.approvedAt)}`}
            />
          )}
          {isRejected && p.rejectionReason && (
            <AuditBanner
              tone="danger"
              icon={AlertCircle}
              title="Rejected"
              line={p.rejectionReason}
            />
          )}

          {/* Profile + Business + Identity */}
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard icon={Mail} title="Profile">
              <InfoRow label="Full name" value={m.name} />
              <InfoRow label="Email" value={m.email} mono />
              <InfoRow label="Phone" value={m.phone} mono />
              <InfoRow label="City" value={m.city} />
              <InfoRow
                label="Email verified"
                valueNode={
                  m.isVerified
                    ? <Badge tone="success" icon={Check}>Verified</Badge>
                    : <Badge tone="warning">Unverified</Badge>
                }
              />
            </InfoCard>

            <InfoCard icon={Building2} title="Business">
              <InfoRow label="Business name" value={p.businessName} />
              <InfoRow label="Type" value={p.businessType} />
              <InfoRow label="Address" value={p.businessAddress} multiline />
              <InfoRow label="Applied" value={`${formatDate(m.createdAt)} (${relativeTime(m.createdAt)})`} />
            </InfoCard>

            <InfoCard icon={IdCard} title="Identity & compliance">
              <InfoRow label="PAN" value={p.panNumber} mono />
              <InfoRow
                label="Aadhaar"
                value={p.aadhaarNumber ? `xxxx-xxxx-${p.aadhaarNumber.slice(-4)}` : ''}
                mono
              />
              <InfoRow label="GST" value={p.gstNumber || '—'} mono />
            </InfoCard>
          </div>

          {/* Documents */}
          <section>
            <SectionTitle icon={FileCheck2}>Uploaded documents</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DocumentPreview
                label="Business licence"
                hint="Trade license / FSSAI / shop & establishment cert"
                url={p.businessLicense?.url}
                onOpenImage={() => {
                  /* Allow click-to-zoom on image docs by adding it to the gallery temporarily. */
                  if (isImageUrl(p.businessLicense?.url)) {
                    window.open(p.businessLicense.url, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
              <DocumentPreview
                label="Government ID proof"
                hint="Aadhaar / Passport / Driver’s licence"
                url={p.idProof?.url}
              />
            </div>
          </section>

          {/* Business gallery */}
          <section>
            <SectionTitle icon={ImageIcon}>
              Business images
              <span className="ml-2 text-xs font-medium text-slate-500">
                {galleryUrls.length} {galleryUrls.length === 1 ? 'photo' : 'photos'}
              </span>
            </SectionTitle>
            {galleryUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {galleryUrls.map((url, i) => (
                  <button
                    key={url + i}
                    onClick={() => setLightboxIndex(i)}
                    className="group/img relative aspect-square overflow-hidden rounded-lg border border-ink-600 bg-ink-700"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                    />
                    <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                      <ZoomIn className="h-5 w-5 text-white" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-ink-600 bg-ink-900/30 px-4 py-6 text-center text-xs text-slate-500">
                No business images uploaded.
              </p>
            )}
          </section>

          {/* Banking */}
          {(p.bankDetails?.accountNumber || p.bankDetails?.ifsc) && (
            <section>
              <SectionTitle icon={Landmark}>Bank details</SectionTitle>
              <div className="mt-3 card grid gap-x-6 gap-y-2 p-4 sm:grid-cols-3">
                <InfoRow label="Holder" value={p.bankDetails.accountName || '—'} />
                <InfoRow
                  label="Account no."
                  value={p.bankDetails.accountNumber || '—'}
                  mono
                  icon={CreditCard}
                />
                <InfoRow
                  label="IFSC"
                  value={p.bankDetails.ifsc || '—'}
                  mono
                  icon={Hash}
                />
              </div>
            </section>
          )}

          {/* Reviewer hint for pending */}
          {isPending && (
            <p className="rounded-xl border border-brand-500/30 bg-brand-500/[0.05] p-3 text-xs text-brand-200">
              Before approving, please verify: documents match the business name,
              PAN/Aadhaar are legible, and at least one business image looks legitimate.
            </p>
          )}
        </div>

        {/* ─── Footer ─── */}
        {isPending ? (
          <div className="-mx-6 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-white/[0.06] bg-ink-900/40 px-6 py-4 sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="text-xs text-slate-500">
              The applicant will be emailed automatically.
            </span>
            <div className="flex gap-2">
              <Button variant="danger" icon={X} onClick={onReject}>Reject</Button>
              <Button icon={Check} onClick={onApprove}>Approve manager</Button>
            </div>
          </div>
        ) : (
          <div className="-mx-6 -mb-5 mt-6 flex items-center justify-between border-t border-white/[0.06] bg-ink-900/40 px-6 py-3 sm:-mx-8 sm:px-8">
            <span className="text-xs text-slate-500">
              {isApproved && 'This manager is active. They can list and edit their inventory.'}
              {isRejected && 'This manager was declined. They can re-apply at any time.'}
              {!isApproved && !isRejected && 'Account not yet active.'}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        )}
      </Modal>

      <Lightbox
        images={galleryUrls}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}

/* ────────── Small reusable bits ──────────────────────────────── */

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
      <Icon className="h-4 w-4 text-brand-400" />
      {children}
    </h3>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-brand-400" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, valueNode, mono, multiline, icon: Icon }) {
  const display = valueNode ?? (value || '—');
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className={`min-w-0 text-right font-medium text-white ${mono ? 'font-mono text-[13px]' : ''} ${multiline ? 'whitespace-pre-wrap break-words' : 'truncate'}`}
      >
        {Icon && typeof display === 'string' && (
          <Icon className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-slate-500" />
        )}
        {display}
      </span>
    </div>
  );
}

function AuditBanner({ tone, icon: Icon, title, line }) {
  const colors =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-200'
      : tone === 'danger'
        ? 'border-red-500/30 bg-red-500/[0.04] text-red-200'
        : 'border-brand-500/30 bg-brand-500/[0.04] text-brand-200';
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${colors}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {title}
        </span>
        <p className="mt-0.5 text-sm">{line}</p>
      </div>
    </div>
  );
}

/* ────────── Document preview ─────────────────────────────────── */

const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?.*)?$/i;
const PDF_RE = /\.pdf(\?.*)?$/i;
const isImageUrl = (url) => Boolean(url && IMAGE_RE.test(url));
const isPdfUrl = (url) => Boolean(url && PDF_RE.test(url));

function DocumentPreview({ label, hint, url }) {
  const provided = Boolean(url);
  const isImage = isImageUrl(url);
  const isPdf = isPdfUrl(url);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <FileCheck2 className="h-4 w-4 text-brand-400" />
            {label}
          </p>
          {hint && <p className="truncate text-[11px] text-slate-500">{hint}</p>}
        </div>
        {provided && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-[11px] font-semibold text-brand-300 transition-colors hover:border-brand-500/50 hover:text-brand-200"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="relative grid aspect-[5/3] place-items-center bg-ink-900/40">
        {!provided ? (
          <div className="flex flex-col items-center gap-1.5 text-slate-500">
            <FileText className="h-7 w-7" />
            <span className="text-xs">Not provided</span>
          </div>
        ) : isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 text-rose-300 transition-colors hover:text-rose-200"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30">
              <FileText className="h-6 w-6" />
            </span>
            <span className="text-xs font-semibold">PDF document</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Click to open
            </span>
          </a>
        ) : isImage ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 block"
            title="Open full size"
          >
            <img
              src={url}
              alt={label}
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          /* Unknown type — fall back to a download link. */
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
          >
            <FileText className="h-7 w-7" />
            <span className="text-xs font-semibold">Open file</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* ────────── Lightbox ─────────────────────────────────────────── */

function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index);
  useEffect(() => setI(index), [index]);
  useEffect(() => {
    if (index === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % images.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose]);

  return createPortal(
    <AnimatePresence>
      {index !== null && images[i] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.img
            key={images[i]}
            src={images[i]}
            alt=""
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80">
            {i + 1} / {images.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ────────── Reject modal ─────────────────────────────────────── */

function RejectModal({ manager, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 4) return toast.error('Please give a short reason');
    setBusy(true);
    await onConfirm(reason.trim());
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} title="Reject application" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-400">
          Tell {manager.name.split(' ')[0]} what was wrong — they'll see this in their dashboard.
        </p>
        <Textarea
          label="Reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Documents unclear / mismatched business name / ..."
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={busy}>Reject manager</Button>
        </div>
      </form>
    </Modal>
  );
}
