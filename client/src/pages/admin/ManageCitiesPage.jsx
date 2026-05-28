import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listCities } from '../../api/cities.api.js';
import { createCity, updateCity, deleteCity } from '../../api/admin.cities.api.js';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { uploadImage } from '../../api/uploads.api.js';

export default function ManageCitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    listCities().then((r) => {
      setCities(r.items || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this city?')) return;
    await deleteCity(id);
    setCities((s) => s.filter((c) => c._id !== id));
    toast.success('City deleted');
  };

  // Minimal create flow — open a prompt for name only. Can be extended.
  const handleAdd = async () => {
    setModal({ mode: 'create' });
  };

  const handleImport = async (file) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // expect CSV: cityName,state,country,lat,lng,isPopular,displayOrder
    for (const line of lines) {
      const [cityName, state, country, lat, lng, isPopular, displayOrder] = line.split(',').map((s) => s?.trim());
      try {
        const res = await createCity({ cityName, state, country, lat, lng, isPopular: isPopular === '1' || isPopular === 'true', displayOrder: Number(displayOrder) || 0 });
        setCities((s) => [res.data, ...s]);
      } catch (err) {
        // continue
      }
    }
    toast.success('Import complete');
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Manage Cities</h2>
        <div className="flex items-center gap-2">
          <input
            id="csv-import"
            type="file"
            accept="text/csv"
            onChange={(e) => handleImport(e.target.files?.[0])}
            className="hidden"
          />
          <label htmlFor="csv-import">
            <Button variant="ghost">Import CSV</Button>
          </label>
          <Button onClick={handleAdd}>Add City</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {cities.map((c) => (
          <div key={c._id} className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
            <div>
              <div className="font-semibold text-white">{c.cityName}</div>
              <div className="text-sm text-slate-400">{c.state || c.country}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => alert('Edit UI not implemented yet')}>Edit</Button>
              <Button variant="danger" onClick={() => handleDelete(c._id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <CityModal
          mode={modal.mode}
          city={modal.city}
          onClose={() => setModal(null)}
          onSaved={(c) => {
            setModal(null);
            setCities((s) => [c, ...s.filter((x) => x._id !== c._id)]);
          }}
        />
      )}
    </div>
  );
}

function CityModal({ mode = 'create', city = null, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ cityName: city?.cityName || '', state: city?.state || '', country: city?.country || '', image: city?.image || '', lat: city?.location?.coordinates?.[1] || '', lng: city?.location?.coordinates?.[0] || '', isPopular: !!city?.isPopular, displayOrder: city?.displayOrder || 0 }));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        cityName: form.cityName,
        state: form.state,
        country: form.country,
        image: form.image,
        lat: form.lat,
        lng: form.lng,
        isPopular: form.isPopular,
        displayOrder: Number(form.displayOrder) || 0,
      };
      let res;
      if (mode === 'create') res = await createCity(payload);
      else res = await updateCity(city._id, payload);
      onSaved(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={mode === 'create' ? 'Add City' : 'Edit City'}>
      <div className="space-y-3">
        <Input label="City name" value={form.cityName} onChange={(e) => setForm({ ...form, cityName: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <ImageUploader value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <Input label="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <Input label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
          <span className="text-sm">Mark as popular</span>
        </label>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{mode === 'create' ? 'Create' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  );
}
