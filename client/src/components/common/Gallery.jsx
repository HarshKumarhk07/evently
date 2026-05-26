import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '../ui/LazyImage.jsx';

/* Image grid with a full-screen lightbox. */
export default function Gallery({ images = [], title = 'Gallery' }) {
  const [active, setActive] = useState(null);
  if (!images.length) return null;

  const step = (dir) =>
    setActive((i) => (i + dir + images.length) % images.length);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <LazyImage
              src={src}
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
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActive(null)}
            >
              <button
                className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white"
                onClick={() => setActive(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white sm:left-8"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <motion.img
                key={active}
                src={images[active]}
                alt={`${title} ${active + 1}`}
                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="absolute right-4 rounded-full bg-white/10 p-2.5 text-white sm:right-8"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
