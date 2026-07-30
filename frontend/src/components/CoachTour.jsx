import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

/**
 * Spotlight coach-mark tour: highlights a real DOM element (found via
 * data-tour="<id>") with a cutout + tooltip pointing at it, and steps
 * through Next/Skip — instead of a generic modal carousel, this actually
 * shows the user the real button and explains it in place.
 */
export default function CoachTour({ steps, onFinish }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const step = steps[index];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      // slight delay so scroll finishes before we measure position
      setTimeout(() => setRect(el.getBoundingClientRect()), 250);
    } else {
      setRect(null);
    }
  }, [index, steps]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  if (!steps.length) return null;
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const pad = 8;
  const spotlight = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Position tooltip to the right of the target if there's room, else below it.
  const tooltipStyle = spotlight
    ? spotlight.left + spotlight.width + 320 < window.innerWidth
      ? { top: spotlight.top, left: spotlight.left + spotlight.width + 16 }
      : { top: spotlight.top + spotlight.height + 16, left: Math.max(16, spotlight.left) }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dimmed backdrop with a cutout over the target element */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          boxShadow: spotlight
            ? `0 0 0 9999px rgba(43,42,40,0.55)`
            : 'inset 0 0 0 9999px rgba(43,42,40,0.55)',
          ...(spotlight
            ? { top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height, borderRadius: 14, position: 'absolute' }
            : { position: 'absolute', inset: 0 }),
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute w-72 bg-white rounded-xl2 shadow-lift p-4"
          style={tooltipStyle}
        >
          <p className="text-xs font-medium text-indigo-500 mb-1">Step {index + 1} of {steps.length}</p>
          <h4 className="font-display font-semibold text-ink-900">{step.title}</h4>
          <p className="text-sm text-ink-500 mt-1.5">{step.body}</p>

          <div className="flex items-center justify-between mt-4">
            <button onClick={onFinish} className="text-xs text-ink-500 hover:text-ink-900">Skip tour</button>
            <Button
              className="!py-1.5 !px-4 text-sm"
              onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
            >
              {isLast ? "Let's go" : 'Next'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
