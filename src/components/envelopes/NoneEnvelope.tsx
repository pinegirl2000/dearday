'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { EnvelopeProps } from './FoldEnvelope';

/**
 * NoneEnvelope - 봉투 없이 카드만 바로 표시
 * 깔끔한 진입을 원하는 경우
 */
export default function NoneEnvelope({ isOpen, children, width = 380 }: EnvelopeProps) {
  const cardHeight = Math.round(width * 1.15);

  return (
    <div className="relative mx-auto select-none flex items-center justify-center" style={{ width, height: cardHeight }} aria-live="polite">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="none-card"
            className="rounded-lg bg-white shadow-2xl overflow-hidden"
            style={{ width: width - 20, height: cardHeight }}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-full h-full p-6 flex items-center justify-center text-center text-neutral-700" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f6efff 100%)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
