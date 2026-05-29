import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '../ui/LazyImage.jsx';

/**
 * For Cloudinary URLs, ask the CDN for the right size and `q_auto:best`
 * so the image looks crisp without us shipping huge originals.
 * Falls through unchanged for non-Cloudinary URLs.
 */
function cloudinaryUrl(src, params) {
  if (!src || !src.includes('/upload/')) return src;
  return src.replace('/upload/', `/upload/${params}/`);
}

const THUMB_PARAMS = 'c_fill,w_400,h_400,q_auto,f_auto';
const FULL_PARAMS = 'c_limit,w_1800,h_1800,q_auto:best,f_auto';

/* Responsive image grid with a polished full-screen lightbox + thumbnail strip. */
export default function Gallery({ images = [], title = 'Gallery' }) {
  const [active, setActive] = useState(null);
  if (!images.length) return null;

  const step = (dir) => setActive((i) => (i + dir + images.length) % images.length);

  /* Keyboard support inside the lightbox. */
  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-white/[0.04]"
          >
            <LazyImage
              src={cloudinaryUrl(src, THUMB_PARAMS)}
              alt={`${title} ${i + 1}`}
              className="h-full w-full"
              imgClassName="group-hover:scale-110 transition-transform duration-500"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
          </button>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {active !== null && (
            <motion.div
              className="fixed inset-0 z-[200] flex flex-col bg-ink-950/98 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    {active + 1} / {images.length}
                  </span>
                  <span className="hidden text-sm text-slate-300 sm:inline">{title}</span>
                </div>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Image stage */}
              <div className="relative flex flex-1 items-center justify-center px-4">
                {images.length > 1 && (
                  <button
                    className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
                    onClick={() => step(-1)}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active}
                    src={cloudinaryUrl(images[active], FULL_PARAMS)}
                    alt={`${title} ${active + 1}`}
                    className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
                {images.length > 1 && (
                  <button
                    className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
                    onClick={() => step(1)}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5 pt-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                        i === active
                          ? 'ring-brand-400'
                          : 'opacity-50 ring-transparent hover:opacity-100'
                      }`}
                    >
                      <img
                        src={cloudinaryUrl(src, 'c_fill,w_200,h_200,q_auto,f_auto')}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
