'use client';

import { motion } from 'framer-motion';
import { useWizardStore } from '@/stores/wizardStore';
import { EVENT_TYPES } from '@/lib/eventType';
import type { EventType } from '@/types/card';

export default function StepEventType() {
  const { draft, setEventType, next } = useWizardStore();

  const handleSelect = (id: EventType) => {
    setEventType(id);
    setTimeout(next, 200);
  };

  return (
    <div>
      <h2 className="text-2xl font-serif text-hydrangea-700 mb-1">어떤 날을 초대하시나요?</h2>
      <p className="text-sm text-hydrangea-400 mb-6">이벤트 종류를 선택해주세요</p>

      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPES.map((e) => {
          const selected = draft.event_type === e.id;
          return (
            <motion.button
              key={e.id}
              onClick={() => handleSelect(e.id)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                selected
                  ? 'border-hydrangea-500 bg-hydrangea-50'
                  : 'border-hydrangea-100/60 bg-white hover:bg-hydrangea-50/30'
              }`}
            >
              <span className="text-4xl">{e.emoji}</span>
              <span className="text-sm font-semibold text-hydrangea-700">{e.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
