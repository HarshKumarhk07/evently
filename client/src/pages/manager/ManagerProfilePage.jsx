import { useEffect, useMemo, useState, useRef } from 'react';
import { Camera, FileText, ImagePlus, Link2, Mail, MapPin, Phone, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { managerApi } from '../../api/manager.api.js';
import { usersApi } from '../../api/users.api.js';
import { CITIES } from '../../lib/constants.js';
import { formatDate } from '../../lib/format.js';

function mediaUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

function mediaList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(mediaUrl).filter(Boolean);
  return [mediaUrl(value)].filter(Boolean);
}

export default function ManagerProfilePage() {
  const { user, patchUser } = useAuth();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(user || null);
  const [media, setMedia] = useState({
    profileImage: user?.avatar || null,
    businessLicense: user?.managerProfile?.businessLicense || null,
    idProof: user?.managerProfile?.idProof || null,
    businessImages: mediaList(user?.managerProfile?.businessImages),
  });

  useEffect(() => {
    setProfile(user || null);
    setEditing(false);
    setMedia({
      profileImage: user?.avatar || null,
      businessLicense: user?.managerProfile?.businessLicense || null,
      idProof: user?.managerProfile?.idProof || null,
      businessImages: mediaList(user?.managerProfile?.businessImages),
    });
  }, [user]);

  const manager = profile?.managerProfile || {};
  const avatar = mediaUrl(profile?.avatar);
  const businessLicense = mediaUrl(manager.businessLicense);
  const idProof = mediaUrl(manager.idProof);
  const businessImages = useMemo(() => mediaList(manager.businessImages), [manager.businessImages]);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || CITIES[0],
    businessName: manager.businessName || '',
    businessType: manager.businessType || '',
    businessAddress: manager.businessAddress || '',
  });

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      city: profile?.city || CITIES[0],
      businessName: profile?.managerProfile?.businessName || '',
      businessType: profile?.managerProfile?.businessType || '',
      businessAddress: profile?.managerProfile?.businessAddress || '',
    });
  }, [profile]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await usersApi.updateAvatar(file);
      patchUser(updated);
      setProfile(updated);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const uploadManagerMedia = async (field, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await managerApi.uploadMedia(file);
      const next = { url: uploaded.url, publicId: uploaded.publicId };
      setMedia((prev) => {
        if (field === 'businessImages') {
          return { ...prev, businessImages: [...prev.businessImages, next.url] };
        }
        return { ...prev, [field]: next };
      });
      toast.success('Uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeManagerMedia = (field) => {
    setMedia((prev) => {
      if (field === 'businessImages') return { ...prev, businessImages: [] };
      return { ...prev, [field]: '' };
    });
  };

  const removeBusinessImageAt = (index) => {
    setMedia((prev) => ({
      ...prev,
      businessImages: prev.businessImages.filter((_, idx) => idx !== index),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await managerApi.updateMe({
        name: form.name,
        phone: form.phone,
        city: form.city,
        businessName: form.businessName,
        businessType: form.businessType,
        businessAddress: form.businessAddress,
        businessLicense: media.businessLicense?.url || '',
        idProof: media.idProof?.url || '',
        businessImages: media.businessImages,
      });
      patchUser(updated);
      setProfile(updated);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Manager profile</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your account, business info, and documents.</p>
        </div>
        <Badge tone={profile.managerProfile?.status === 'approved' ? 'success' : 'brand'}>
          {profile.managerProfile?.status || 'pending'}
        </Badge>
      </div>

      <div className="mt-6 space-y-5">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={profile.name} src={avatar} size="xl" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-white shadow-glow"
                  aria-label="Change photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadAvatar} />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">{profile.name}</p>
                <p className="text-sm text-slate-500">{profile.email}</p>
                <p className="mt-1 text-xs text-slate-500">Joined {profile.createdAt ? formatDate(profile.createdAt) : '—'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
                {editing ? 'View profile' : 'Edit profile'}
              </Button>
            </div>
          </div>
        </section>

        {!editing ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Account details</h2>
              <div className="space-y-3">
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                <InfoRow icon={MapPin} label="City" value={profile.city} />
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Business details</h2>
              <div className="space-y-3">
                <InfoRow icon={FileText} label="Business name" value={manager.businessName} />
                <InfoRow icon={FileText} label="Business type" value={manager.businessType} />
                <InfoRow icon={FileText} label="Address" value={manager.businessAddress} />
                <InfoRow icon={Link2} label="Status" value={manager.status} />
              </div>
            </section>

            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Documents & images</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <DocCard label="Profile image" url={avatar} />
                <DocCard label="Business license" url={businessLicense} />
                <DocCard label="ID proof" url={idProof} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {businessImages.length > 0 ? businessImages.map((url, idx) => (
                  <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-white/[0.06] bg-black/20">
                    <img src={url} alt={`Business ${idx + 1}`} className="h-28 w-full object-cover" />
                  </a>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-slate-500 sm:col-span-3">
                    No business images uploaded yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <form onSubmit={save} className="card space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
              <Input label="Full name" value={form.name} onChange={update('name')} />
              <Input label="Phone" value={form.phone} onChange={update('phone')} />
              <Select
                label="City"
                value={form.city}
                onChange={update('city')}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
              <Input label="Email" value={profile.email} disabled />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Business name" value={form.businessName} disabled />
              <Input label="Business type" value={form.businessType} disabled />
            </div>
            <Textarea label="Business address" value={form.businessAddress} disabled rows={3} />
            <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Documents & images</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <MediaCard
                  label="Business license"
                  media={media.businessLicense}
                  onUpload={(file) => uploadManagerMedia('businessLicense', file)}
                  onRemove={() => removeManagerMedia('businessLicense')}
                  uploading={uploading}
                />
                <MediaCard
                  label="ID proof"
                  media={media.idProof}
                  onUpload={(file) => uploadManagerMedia('idProof', file)}
                  onRemove={() => removeManagerMedia('idProof')}
                  uploading={uploading}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Business images</p>
                    <p className="text-xs text-slate-500">Replace, remove, or add venue photos.</p>
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
                        if (file) uploadManagerMedia('businessImages', file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {media.businessImages.length > 0 ? media.businessImages.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
                      <img src={url} alt={`Business ${idx + 1}`} className="h-28 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-white/80 hover:text-white">
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => removeBusinessImageAt(idx)}
                          className="inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-slate-500 sm:col-span-3">
                      No business images uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm text-white">{value || '—'}</p>
      </div>
    </div>
  );
}

function DocCard({ label, url }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-slate-500">{url || 'No file uploaded'}</p>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200 hover:bg-brand-500/15">
            Open
          </a>
        ) : null}
      </div>
    </div>
  );
}

function MediaCard({ label, media, onUpload, onRemove, uploading }) {
  const url = mediaUrl(media);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-500">Replace or remove this file.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand-500/15">
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Replace'}
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