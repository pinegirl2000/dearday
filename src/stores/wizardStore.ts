import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CardDraft, EventType } from '@/types/card';

interface WizardState {
  step: number;
  draft: CardDraft;
  /** 수정 중인 카드 slug. 비어있으면 신규 발행 모드 */
  editingSlug?: string;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  setDraft: (patch: Partial<CardDraft>) => void;
  reset: () => void;
  setEventType: (type: EventType) => void;
  loadForEdit: (card: CardDraft, slug: string) => void;
}

const TOTAL_STEPS = 4; // type → template → details → layout+preview

const initialDraft: CardDraft = {
  event_type: undefined,
  title: '',
  theme: 'hydrangea',
  bg_id: 'bg-none',
  layout_id: 'layout-classic',
  envelope_anim: 'none',
  font_family: 'serif',
  rsvp_enabled: true,
  rsvp_max_per_card: 4,
  rsvp_collect_names: false,
  plan: 'free'
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      step: 1,
      draft: { ...initialDraft },
      setStep: (step) => set({ step: Math.max(1, Math.min(TOTAL_STEPS, step)) }),
      next: () => set((s) => ({ step: Math.min(TOTAL_STEPS, s.step + 1) })),
      prev: () => set((s) => ({ step: Math.max(1, s.step - 1) })),
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      reset: () => set({ step: 1, draft: { ...initialDraft }, editingSlug: undefined }),
      setEventType: (type) =>
        set((s) => ({
          draft: { ...s.draft, event_type: type }
        })),
      loadForEdit: (card, slug) =>
        set({ step: TOTAL_STEPS, draft: { ...initialDraft, ...card }, editingSlug: slug })
    }),
    {
      name: 'dearday-wizard-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    }
  )
);

export const TOTAL_WIZARD_STEPS = TOTAL_STEPS;
