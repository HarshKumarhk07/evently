import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadsApi } from '../../api/uploads.api.js';
import { managerApi } from '../../api/manager.api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Multi-image uploader backed by the same Cloudinary endpoints as
 * `ImageUploader`. `value` is an array of URLs; `onChange(next)` is fired
 * with the new array after every add/remove.
 */
export default function GalleryUploader({ value = [], onChange, label = 'Gallery images', hint }) {
  const fileRef = useRef(null);
  const { isAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is over 5MB`);
          continue;
        }
        const res = isAdmin
          ? await uploadsApi.image(file)
          : await managerApi.uploadMedia(file);
        if (res?.url) uploaded.push(res.url);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} added`);
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        multiple
        onChange={(e) => {
          handleFiles(Array.from(e.target.files || []));
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="group relative overflow-hidden rounded-xl border border-ink-600 bg-ink-900/50"
          >
            <img src={url} alt="" className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-600 bg-ink-900/50 text-xs text-slate-400 transition-colors hover:border-brand-500/50 hover:text-slate-200"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-300" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span>{uploading ? 'Uploading…' : 'Add image'}</span>
        </button>
      </div>

      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
