import { useState, useEffect, useCallback } from 'react';
import {
  Search, Building2, FileText, IdCard, Phone, MapPin, Check, X,
  ShieldCheck, CircleAlert, MailCheck, ExternalLink,
} from 'lucide-react';
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
import { formatDate } from '../../lib/format.js';

const STATUS_TABS = [
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending_email', label: 'Unverified' },
  { value: 'all', label: 'All' },
];

const STATUS_META = {
  pending_email: { tone: 'warning', icon: MailCheck, label: 'Email pending' },
  pending_approval: { tone: 'brand', icon: ShieldCheck, label: 'Pending review' },
  approved: { tone: 'success', icon: ShieldCheck, label: 'Approved' },
  rejected: { tone: 'danger', icon: CircleAlert, label: 'Rejected' },
  suspended: { tone: 'danger', icon: CircleAlert, label: 'Suspended' },
};

export default function ManageManagersPage() {
  const [tab, setTab] = useState('pending_approval');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);

  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);

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

  /* Inject pending-count into the Pending tab label. */
  const tabs = STATUS_TABS.map((t) =>
    t.value === 'pending_approval' && pendingCount > 0
      ? { ...t, label: `${t.label}`, count: pendingCount }
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
        <div className="w-64">
          <Input
            icon={Search}
            placeholder="Search by name, email, business"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs className="mt-6" tabs={tabs} value={tab} onChange={setTab} />

      <div className="mt-5 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : items.length === 0 ? (
          <EmptyState
            title="No managers in this view"
            description="When new managers register they'll appear here for review."
          />
        ) : (
          items.map((m) => {
            const meta = STATUS_META[m.managerProfile?.status] || STATUS_META.pending_approval;
            return (
              <div
                key={m._id}
                className="card flex flex-wrap items-center gap-4 p-4"
              >
                <Avatar name={m.name} src={m.avatar?.url} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    {m.managerProfile?.businessName || m.name}
                    <Badge tone="neutral">{m.managerProfile?.businessType || '—'}</Badge>
                  </p>
                  <p className="text-xs text-slate-400">
                    {m.name} · {m.email} · joined {formatDate(m.createdAt)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" /> {m.city}
                  </p>
                </div>
                <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(m)}>
                    Review
                  </Button>
                  {m.managerProfile?.status === 'pending_approval' && (
                    <>
                      <Button size="sm" icon={Check} onClick={() => approve(m._id)}>
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={X}
                        onClick={() => setRejectFor(m)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
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
    </div>
  );
}

/* ───── Review modal ──────────────────────────────────────────────── */

function DocLink({ icon: Icon, label, url }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-900/50 p-3">
      <span className="flex items-center gap-2.5 text-sm">
        <Icon className="h-4 w-4 text-brand-400" />
        <span className="text-slate-300">{label}</span>
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-xs text-slate-500">Not provided</span>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-white">{value || '—'}</span>
    </div>
  );
}

function ManagerReviewModal({ manager, onClose, onApprove, onReject }) {
  const p = manager.managerProfile || {};
  const meta = STATUS_META[p.status] || STATUS_META.pending_approval;
  const isPending = p.status === 'pending_approval';

  return (
    <Modal open onClose={onClose} title="Manager review" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={manager.name} src={manager.avatar?.url} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold text-white">
              {p.businessName || manager.name}
            </p>
            <p className="text-sm text-slate-400">{manager.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
              <Badge tone="neutral">{p.businessType || 'Business'}</Badge>
            </div>
          </div>
        </div>

        {/* Business + identity */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Building2 className="h-4 w-4 text-brand-400" /> Business
            </h3>
            <InfoRow label="Name" value={p.businessName} />
            <InfoRow label="Type" value={p.businessType} />
            <InfoRow label="Address" value={p.businessAddress} />
            <InfoRow label="City" value={manager.city} />
            <InfoRow label="Phone" value={manager.phone} />
          </div>
          <div className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <IdCard className="h-4 w-4 text-brand-400" /> Identity
            </h3>
            <InfoRow label="PAN" value={p.panNumber} />
            <InfoRow label="Aadhaar" value={p.aadhaarNumber ? `xxxx-xxxx-${p.aadhaarNumber.slice(-4)}` : ''} />
            <InfoRow label="GST" value={p.gstNumber} />
            <InfoRow label="Email verified" value={manager.isVerified ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">Documents</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <DocLink icon={FileText} label="Business licence" url={p.businessLicense?.url} />
            <DocLink icon={IdCard} label="Government ID proof" url={p.idProof?.url} />
          </div>
          {p.businessImages?.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {p.businessImages.map((img, i) => (
                <a
                  key={i}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg border border-ink-600"
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Banking */}
        {(p.bankDetails?.accountNumber || p.bankDetails?.ifsc) && (
          <div className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Phone className="h-4 w-4 text-brand-400" /> Bank details
            </h3>
            <InfoRow label="Account name" value={p.bankDetails.accountName} />
            <InfoRow label="Account number" value={p.bankDetails.accountNumber} />
            <InfoRow label="IFSC" value={p.bankDetails.ifsc} />
          </div>
        )}

        {p.status === 'rejected' && p.rejectionReason && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <strong>Rejected:</strong> {p.rejectionReason}
          </div>
        )}
      </div>

      {isPending && (
        <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
          <Button variant="danger" icon={X} onClick={onReject}>
            Reject
          </Button>
          <Button icon={Check} onClick={onApprove}>
            Approve manager
          </Button>
        </div>
      )}
    </Modal>
  );
}

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
          Tell {manager.name.split(' ')[0]} what was wrong — they’ll see this in their dashboard.
        </p>
        <Textarea
          label="Reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Documents unclear / mismatched business name / ..."
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={busy}>
            Reject manager
          </Button>
        </div>
      </form>
    </Modal>
  );
}
