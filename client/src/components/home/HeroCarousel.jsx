import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

/* Auto-advancing banner carousel for the home hero. */
export default function HeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const [src, setSrc] = useState('');
  const count = slides.length;

  const go = useCallback((dir) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    const slide = slides[index];
    setSrc(slide?.image || slide?.fallbackImage || '');
  }, [index, slides]);

  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(id);
  }, [count]);

  if (!count) return <div className="skeleton h-[420px] w-full rounded-3xl" />;

  const slide = slides[index];

  return (
    <div className="relative h-[440px] overflow-hidden rounded-3xl sm:h-[480px]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={() => {
              if (slide?.fallbackImage && src !== slide.fallbackImage) {
                setSrc(slide.fallbackImage);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 lg:p-14">
        <motion.div
          key={`text-${index}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-xl"
        >
          {slide.eyebrow && <Badge tone="brand">{slide.eyebrow}</Badge>}
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="mt-3 max-w-md text-sm text-slate-300 sm:text-base">{slide.subtitle}</p>
          )}
          {slide.to && (
            <Link
              to={slide.to}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
            >
              Explore now
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </motion.div>
      </div>

      {count > 1 && (
        <>
          <div className="absolute bottom-6 right-6 flex gap-2">
            <button
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next slide"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-8 left-6 flex gap-1.5 sm:left-10 lg:left-14">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-7 bg-brand-400' : 'w-1.5 bg-white/30',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
