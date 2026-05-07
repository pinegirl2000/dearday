'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  /** y(px) 시작 위치 — 양수면 아래에서 위로 fade-up */
  y?: number;
  className?: string;
}

/**
 * 장식/세컨더리 콘텐츠용 fade-up 진입 애니메이션.
 * whileInView 사용 — 첫 측정 누락 방지를 위해 amount=0.1, once=true.
 *
 * NOTE: 필수로 보여야 하는 콘텐츠(host/연락처 등)는 이걸로 감싸지 말 것.
 */
export default function FadeIn({ children, delay = 0, y = 24, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
