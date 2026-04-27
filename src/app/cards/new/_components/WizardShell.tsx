'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useWizardStore, TOTAL_WIZARD_STEPS } from '@/stores/wizardStore';
import StepEventType from './StepEventType';
import StepDetails from './StepDetails';
import StepDesign from './StepDesign';
import StepRsvp from './StepRsvp';
import StepPreview from './StepPreview';
import type { EventType } from '@/types/card';

export default function WizardShell() {
  const params = useSearchParams();
  const { step, draft, setEventType, prev } = useWizardStore();

  // hydrate persist on mount
  useEffect(() => {
    useWizardStore.persist.rehydrate();
  }, []);

  // ?type= 쿼리에서 진입 시 이벤트 타입 자동 설정
  useEffect(() => {
    const t = params.get('type');
    if (t && !draft.event_type) {
      setEventType(t as EventType);
      useWizardStore.setState({ step: 2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const stepNames = ['이벤트', '내용', '디자인', '응답', '발행'];
  const currentLabel = stepNames[step - 1] || '';

  return (
    <PageContainer noPadding>
      <MobileHeader title={`초대장 만들기 · ${currentLabel}`} back={step > 1 ? prev : true} />

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-1">
        <div className="h-1 rounded-full bg-hydrangea-100 overflow-hidden">
          <motion.div
            className="h-full bg-hydrangea-500"
            initial={false}
            animate={{ width: `${(step / TOTAL_WIZARD_STEPS) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <div className="text-xs text-hydrangea-400 mt-2 text-right">
          {step} / {TOTAL_WIZARD_STEPS}
        </div>
      </div>

      <div className="px-5 pt-4 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <StepEventType />}
            {step === 2 && <StepDetails />}
            {step === 3 && <StepDesign />}
            {step === 4 && <StepRsvp />}
            {step === 5 && <StepPreview />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
