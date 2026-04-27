'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/stores/wizardStore';
import SinglePageWizard from '@/app/cards/new/_components/SinglePageWizard';
import type { BaseCard } from '@/types/card';

interface Props {
  card: BaseCard;
}

/**
 * /cards/[slug]/edit — 기존 카드 데이터를 wizardStore에 hydrate한 뒤
 * SinglePageWizard를 재사용해서 편집. 발행 버튼이 "수정 저장"으로 바뀌고
 * publishCard 대신 updateCard를 호출 (SinglePageWizard 내부에서 분기).
 *
 * 주의: cleanup에서 reset()을 호출하지 않음.
 *   React Strict Mode에서 effect가 mount→cleanup→re-effect 순으로 실행되는데
 *   cleanup이 loadForEdit으로 채운 데이터를 지워버리는 문제 때문.
 *   reset은 handlePublish 성공 시 호출됨. 그 외 잔존은 다음 마법사 진입 시 정리.
 */
export default function EditCardClient({ card }: Props) {
  const loadForEdit = useWizardStore((s) => s.loadForEdit);

  useEffect(() => {
    // pg가 TIMESTAMPTZ를 Date 객체로 반환 → ISO 문자열로 강제 변환
    const toIso = (v: unknown): string | null => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };

    const cardDraft: Partial<BaseCard> = {
      event_type: card.event_type,
      title: card.title,
      theme: card.theme,
      bg_id: card.bg_id,
      layout_id: card.layout_id,
      envelope_anim: card.envelope_anim,
      custom_bg_url: card.custom_bg_url,
      font_family: card.font_family,
      body: card.body,
      event_date: toIso(card.event_date),
      event_place: card.event_place,
      map_url: card.map_url,
      contact_name: card.contact_name,
      contact_phone: card.contact_phone,
      extra_info: card.extra_info,
      greeting_oneliner: card.greeting_oneliner,
      recipient_template: card.recipient_template,
      rsvp_enabled: card.rsvp_enabled,
      rsvp_deadline: toIso(card.rsvp_deadline),
      rsvp_max_per_card: card.rsvp_max_per_card,
      rsvp_collect_names: card.rsvp_collect_names,
      expiry_date: toIso(card.expiry_date),
      plan: card.plan
    };
    loadForEdit(cardDraft, card.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.slug]);

  return <SinglePageWizard skipRehydrate initialOpen={4} />;
}
