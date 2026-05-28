import { useEffect, useMemo, useState } from 'react';
import { Camera, Eye, FileText, ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea } from '../ui/Input.jsx';
import { adminApi } from '../../api/admin.api.js';
import { formatDate } from '../../lib/format.js';

function getMediaUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

function getMediaList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => getMediaUrl(item)).filter(Boolean);
  return [getMediaUrl(value)].filter(Boolean);
}

function pickRoleTone(role) {
  if (role === 'admin') return 'gold';
  if (role === 'manager') return 'brand';
  return 'neutral';
}

export default function UserProfileModal({ open, onClose, user }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(user || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(user || null);
    setEditing(false);
  }, [user, open]);

  const manager = local?.managerProfile || {};
  const avatarUrl = getMediaUrl(local?.avatar);
  const profileImageUrl = getMediaUrl(local.avatar);
  const businessLicenseUrl = getMediaUrl(manager.businessLicense);
  const idProofUrl = getMediaUrl(manager.idProof);
  const businessImages = useMemo(() => getMediaList(manager.businessImages), [manager.businessImages]);

  if (!local) return null;

  const updateLocal = (key) => (e) => setLocal((prev) => ({ ...prev, [key]: e.target.value }));
  const updateManager = (key) => (e) =>
    setLocal((prev) => ({
      ...prev,
      managerProfile: { ...(prev.managerProfile || {}), [key]: e.target.value },
    }));

  const upload = async (field, file) => {
    try {
      const uploaded = await adminApi.uploadImage(file);
      const nextUrl = uploaded?.url || '';
      if (!nextUrl) throw new Error('Upload failed');

      setLocal((prev) => {
        const current = prev.managerProfile || {};
        if (field === 'businessImages') {
          return {
            ...prev,
            managerProfile: {
              ...current,
              businessImages: [...getMediaList(current.businessImages), nextUrl],
            },
          };
        }
        if (field === 'avatar') {
          return {
            ...prev,
            avatar: { url: nextUrl, publicId: uploaded.publicId || '' },
          };
        }
        return {
          ...prev,
          managerProfile: {
            ...current,
            [field]: { url: nextUrl, publicId: uploaded.publicId || '' },
          },
        };
      });
      toast.success('Uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    }
  };

  const removeManagerMedia = (field) => {
    setLocal((prev) => ({
      ...prev,
      ...(field === 'avatar'
        ? { avatar: { url: '', publicId: '' } }
        : {
            managerProfile: {
              ...(prev.managerProfile || {}),
              [field]: field === 'businessImages' ? [] : '',
            },
          }),
    }));
  };

  const removeBusinessImageAt = (index) => {
    setLocal((prev) => {
      const list = getMediaList(prev.managerProfile?.businessImages);
      return {
        ...prev,
        managerProfile: {
          ...(prev.managerProfile || {}),
          businessImages: list.filter((_, idx) => idx !== index),
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: local.name,
        email: local.email,
        phone: local.phone,
        city: local.city,
      };
      if (local.role === 'manager') {
        payload.managerProfile = {
          ...(local.managerProfile || {}),
          businessImages: getMediaList(local.managerProfile?.businessImages),
        };
      }
      payload.avatar = local.avatar ? { url: getMediaUrl(local.avatar), publicId: local.avatar.publicId || '' } : { url: '', publicId: '' };
      await adminApi.updateUser(local._id, payload);
      toast.success('Profile updated');
      if (typeof onClose === 'function') onClose(true);
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    local.role === 'manager'
      ? manager.status === 'approved'
        ? 'Approved'
        : manager.status === 'rejected'
          ? 'Rejected'
          : manager.status === 'pending_approval'
            ? 'Pending review'
            : 'Email pending'
      : local.role === 'admin'
        ? 'Admin'
        : 'User';

  return (
    <Modal open={open} onClose={() => onClose?.()} title="Profile" size="xl">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={local.name} src={avatarUrl} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{local.name || 'Unknown user'}</h3>
                  <Badge tone={pickRoleTone(local.role)}>{statusLabel}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{local.email || 'No email'}</p>
                {local.phone && <p className="text-sm text-slate-400">{local.phone}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Joined {local.createdAt ? formatDate(local.createdAt) : '—'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!editing ? (
                <Button size="sm" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setLocal(user);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={save} loading={saving}>
                    Save changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-5">
            <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Account details</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoItem label="Full name" value={local.name} />
                <InfoItem label="Email" value={local.email} />
                <InfoItem label="Phone" value={local.phone} />
                <InfoItem label="City" value={local.city} />
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Media</h4>
                <div className="space-y-3">
                  <MediaRow label="Profile image" url={avatarUrl} emptyLabel="No profile image" />
                  {local.role === 'manager' && (
                    <>
                      <MediaRow label="Business license" url={businessLicenseUrl} emptyLabel="No license file" />
                      <MediaRow label="ID proof" url={idProofUrl} emptyLabel="No ID proof" />
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Quick actions</h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <ActionRow
                    icon={Eye}
                    label="View profile"
                    text="Use edit profile to change account details and attached documents."
                  />
                  <ActionRow
                    icon={Link2}
                    label="Open documents"
                    text="Documents and images can be opened from their media cards."
                  />
                </div>
              </div>
            </section>

            {local.role === 'manager' && (
              <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Business profile</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem label="Business name" value={manager.businessName} />
                  <InfoItem label="Business type" value={manager.businessType} />
                  <div className="md:col-span-2">
                    <InfoItem label="Address" value={manager.businessAddress} />
                  </div>
                  <InfoItem label="GST" value={manager.gstNumber} />
                  <InfoItem label="PAN" value={manager.panNumber} />
                  <InfoItem label="Aadhaar" value={manager.aadhaarNumber} />
                  <InfoItem label="Status" value={manager.status} />
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-medium text-white">Business images</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {businessImages.length > 0 ? (
                      businessImages.map((url, idx) => (
                        <a
                          key={`${url}-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20"
                        >
                          <img src={url} alt={`Business ${idx + 1}`} className="h-28 w-full object-cover transition-transform group-hover:scale-[1.02]" />
                        </a>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-slate-500 sm:col-span-3">
                        No business images uploaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Camera className="h-4 w-4" /> Basic info
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={local.name || ''} onChange={updateLocal('name')} />
                <Input label="Email" value={local.email || ''} onChange={updateLocal('email')} />
                <Input label="Phone" value={local.phone || ''} onChange={updateLocal('phone')} />
                <Input label="City" value={local.city || ''} onChange={updateLocal('city')} />
              </div>
            </section>

            {local.role === 'manager' && (
              <>
                <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <FileText className="h-4 w-4" /> Business details
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Business name" value={manager.businessName || ''} onChange={updateManager('businessName')} />
                    <Input label="Business type" value={manager.businessType || ''} onChange={updateManager('businessType')} />
                    <div className="md:col-span-2">
                      <Textarea label="Business address" rows={3} value={manager.businessAddress || ''} onChange={updateManager('businessAddress')} />
                    </div>
                    <Input label="GST number" value={manager.gstNumber || ''} onChange={updateManager('gstNumber')} />
                    <Input label="PAN number" value={manager.panNumber || ''} onChange={updateManager('panNumber')} />
                    <Input label="Aadhaar number" value={manager.aadhaarNumber || ''} onChange={updateManager('aadhaarNumber')} />
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <Link2 className="h-4 w-4" /> Documents & images
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <UploadCard
                      label="Profile image"
                      url={profileImageUrl}
                      onUpload={(file) => upload('avatar', file)}
                      onRemove={() => removeManagerMedia('avatar')}
                    />
                    <UploadCard
                      label="Business license"
                      url={businessLicenseUrl}
                      onUpload={(file) => upload('businessLicense', file)}
                      onRemove={() => removeManagerMedia('businessLicense')}
                    />
                    <UploadCard
                      label="ID proof"
                      url={idProofUrl}
                      onUpload={(file) => upload('idProof', file)}
                      onRemove={() => removeManagerMedia('idProof')}
                    />
                    <div className="rounded-2xl border border-dashed border-white/[0.10] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">Business images</p>
                          <p className="text-xs text-slate-500">Upload, remove, or replace the venue images.</p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand-500/15">
                          <ImagePlus className="h-4 w-4" />
                          Add image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) upload('businessImages', file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {businessImages.length > 0 ? (
                          businessImages.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
                              <img src={url} alt={`Business ${idx + 1}`} className="h-28 w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-white/80 hover:text-white">
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeBusinessImageAt(idx)}
                                  className="text-[11px] text-red-300 hover:text-red-200"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-slate-500">
                            No business images yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{value || '—'}</p>
    </div>
  );
}

function MediaRow({ label, url, emptyLabel }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="truncate text-xs text-slate-500">{url || emptyLabel}</p>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200 hover:bg-brand-500/15">
          Open
        </a>
      ) : null}
    </div>
  );
}

function ActionRow({ icon: Icon, label, text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function UploadCard({ label, url, onUpload, onRemove }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.10] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-500">Replace or remove this file.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand-500/15">
          <Upload className="h-4 w-4" />
          Replace
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {url ? (
          <>
            <a href={url} target="_blank" rel="noreferrer" className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 text-brand-200">
              <FileText className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </>
        ) : (
          <div className="text-sm text-slate-500">No file uploaded.</div>
        )}
      </div>
    </div>
  );
}
