import { useRef, useState } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadsApi } from '../../api/uploads.api.js';
import { cn } from '../../lib/cn.js';

const MAX_BYTES = 5 * 1024 * 1024; // matches the backend multer limit

/**
 * Reusable Cloudinary-backed image uploader.
 *  - `value` is the current image URL (empty string = no image)
 *  - `onChange(url)` is fired with the hosted URL on a successful upload,
 *    and with '' when the image is removed.
 *
 * Supports click-to-upload and drag-and-drop. Falls back to a friendly toast
 * when the file is too big or the wrong type.
 */
export default function ImageUploader({
  value,
  onChange,
  label = 'Cover image',
  hint = 'JPG, PNG or WebP · up to 5MB',
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadsApi.image(file);
      onChange(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e) => {
    handleFile(e.target.files?.[0]);
    /* Reset so picking the same file twice still fires `change`. */
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
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
        onChange={onPick}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-ink-600">
          <img
            src={value}
            alt="Selected cover"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent p-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Change image
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remove image"
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white backdrop-blur transition-colors hover:bg-red-500/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={cn(
            'flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition-colors',
            dragOver
              ? 'border-brand-400 bg-brand-500/10 text-brand-200'
              : 'border-ink-600 bg-ink-900/50 text-slate-400 hover:border-brand-500/50 hover:text-slate-200',
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="font-medium">
            {uploading ? 'Uploading to Cloudinary…' : 'Click or drop an image to upload'}
          </span>
          {hint && !uploading && <span className="text-xs text-slate-500">{hint}</span>}
        </button>
      )}
    </div>
  );
}
