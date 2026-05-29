import { useState, useRef } from 'react';
import { Camera, User, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { usersApi } from '../../api/users.api.js';

export default function ProfilePage() {
  const { user, patchUser } = useAuth();
  const { cities } = useLocation();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(form);
      patchUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await usersApi.updateAvatar(file);
      patchUser(updated);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
      <p className="mt-1 text-sm text-slate-400">Manage your personal information.</p>

      <div className="mt-6 space-y-5">
        {/* Avatar */}
        <div className="card flex items-center gap-5 p-5">
          <div className="relative">
            <Avatar name={user?.name} src={user?.avatar?.url} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-white shadow-glow"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadAvatar}
            />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">{user?.name}</p>
            <p className="text-sm text-slate-500">
              {uploading ? 'Uploading…' : 'JPG or PNG, up to 5MB'}
            </p>
          </div>
        </div>

        {/* Details form */}
        <form onSubmit={save} className="card space-y-4 p-5">
          <Input label="Full name" icon={User} value={form.name} onChange={update('name')} />
          <Input label="Email" icon={Mail} value={user?.email} disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" icon={Phone} value={form.phone} onChange={update('phone')} />
            <Select
              label="City"
              value={form.city}
              onChange={update('city')}
              options={[
                { value: '', label: 'Choose a city' },
                ...cities.map((c) => ({ value: c.cityName, label: c.cityName })),
              ]}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
