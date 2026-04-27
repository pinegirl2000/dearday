'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useWizardStore } from '@/stores/wizardStore';
import { THEMES } from '@/lib/theme';
import { ENVELOPE_ANIMS } from '@/components/envelopes';
import { Button } from '@/components/ui';
import { ImageUploader } from '@/components/domain/ImageUploader';
import type { ThemeId, EnvelopeAnimId } from '@/types/card';

export default function StepDesign() {
  const { draft, setDraft, next } = useWizardStore();

  return (
    <div>
      <h2 className="text-2xl font-serif text-hydrangea-700 mb-1">디자인을 골라주세요</h2>
      <p className="text-sm text-hydrangea-400 mb-6">테마와 봉투 애니메이션</p>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-hydrangea-700 mb-3">🎨 테마</h3>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const selected = draft.theme === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => setDraft({ theme: t.id as ThemeId })}
                whileTap={{ scale: 0.96 }}
                className={`relative p-4 rounded-2xl border-2 text-left transition ${
                  selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {[t.colors.primary, t.colors.accent, t.colors.deep].map((c) => (
                    <span key={c} className="w-5 h-5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="font-semibold text-sm text-hydrangea-700">{t.name}</div>
                <div className="text-[11px] text-hydrangea-400 mt-1 leading-tight">{t.description}</div>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-hydrangea-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-hydrangea-700 mb-3">🖼️ 배경 이미지 (선택)</h3>
        <ImageUploader
          kind="background"
          value={draft.custom_bg_url || undefined}
          onChange={(url) => setDraft({ custom_bg_url: url })}
          hint="비워두면 테마 기본 배경 사용 (최대 500KB, 자동 압축)"
        />
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-hydrangea-700 mb-3">💌 봉투 열림 효과</h3>
        <div className="space-y-2">
          {ENVELOPE_ANIMS.map((e) => {
            const selected = draft.envelope_anim === e.id;
            return (
              <motion.button
                key={e.id}
                onClick={() => setDraft({ envelope_anim: e.id as EnvelopeAnimId })}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition ${
                  selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-hydrangea-700">{e.name}</div>
                  <div className="text-xs text-hydrangea-400 mt-0.5">{e.desc}</div>
                </div>
                {selected && <Check className="w-5 h-5 text-hydrangea-500" strokeWidth={2.5} />}
              </motion.button>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-0 bg-white pt-4 pb-4 -mx-5 px-5 border-t border-hydrangea-100/50">
        <Button onClick={next} full size="lg">
          다음
        </Button>
      </div>
    </div>
  );
}
