// 템플릿/레이아웃 미리보기용 sample data — 관리자 + Create wizard 공유

import type { BaseCard, EventType, LayoutId } from '@/types/card';
import { getTemplateLayouts } from '@/lib/templates';

export const SAMPLE_BY_EVENT: Record<string, Partial<BaseCard>> = {
  wedding: {
    title: 'Daniel ♥ Olivia', greeting_oneliner: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    event_date: '2026-06-14T19:00:00.000Z', event_place: 'The Grand Ballroom, Marina Hotel',
    contact_name: 'From Daniel & Olivia', contact_phone: '+65-1234-5678', extra_info: 'Reception to follow'
  },
  birthday: {
    title: "Avery's Birthday Party", greeting_oneliner: 'Cheers to another year!',
    body: "Come share laughter, joy, and cake as we celebrate Avery's special day.",
    event_date: '2026-07-05T11:00:00.000Z', event_place: 'The Lounge function room',
    contact_name: "Love, Avery's Family", contact_phone: '+65-2222-3333'
  },
  baptism: {
    title: "Avery's Baptism Day", greeting_oneliner: 'A blessed first step',
    body: "Please join us as we celebrate\nAvery's baptism in the Lord.",
    event_date: '2026-05-03T10:30:00.000Z', event_place: 'Grace Church, Main Sanctuary',
    contact_name: 'Love, David & Rachel', contact_phone: '+65-9999-1111'
  },
  meeting: {
    title: 'Spring Gathering', greeting_oneliner: 'See you again',
    body: "It has been too long.\nLet's gather and catch up.",
    event_date: '2026-04-12T14:00:00.000Z', event_place: 'Hangang Park, Open Lawn',
    contact_name: 'From the Hosts', contact_phone: '+65-3333-4444'
  },
  opening: {
    title: 'Round Cafe · Grand Opening', greeting_oneliner: 'A new beginning',
    body: "We're excited to open our doors\nand share this moment with you.",
    event_date: '2026-09-20T17:00:00.000Z', event_place: 'Round Cafe, 1 Orchard Lane',
    contact_name: 'The Round Cafe Team', contact_phone: '+65-7777-8888'
  },
  etc: {
    title: 'A Special Day', greeting_oneliner: 'A precious moment',
    body: "We'd love for you to share\nthis special moment with us.",
    event_date: '2026-08-10T18:00:00.000Z', event_place: 'Sample Venue, City',
    contact_name: 'From the Host', contact_phone: '+65-1000-2000'
  },
  // Thank cards — 날짜/장소 없음, 메시지 중심
  'mothers-day': {
    title: "To the World's Best Mom", greeting_oneliner: 'With all my love',
    body: 'Thank you for every sacrifice,\nevery hug, and every quiet moment of love.',
    contact_name: '— Your loving child —'
  },
  'fathers-day': {
    title: 'To My Dad, My Hero', greeting_oneliner: 'With all my love',
    body: 'Thank you for the strength you gave me,\nthe lessons you taught me.',
    contact_name: '— Your loving child —'
  },
  'teachers-day': {
    title: 'Thank You, Teacher', greeting_oneliner: 'A note of gratitude',
    body: 'Your patience taught us to think,\nyour passion showed us to dream.',
    contact_name: '— Your students —'
  },
  // Congrats cards
  graduation: {
    title: 'Congratulations, Graduate!', greeting_oneliner: 'A new chapter begins',
    body: 'You worked hard, you dreamed big,\nand today you stand tall.',
    contact_name: '— With pride and joy —'
  }
};
// 메시지 카드 (thank/congrats) — 날짜/장소가 의미 없는 이벤트 ID 화이트리스트
const MESSAGE_CARD_EVENTS = new Set(['mothers-day', 'fathers-day', 'teachers-day', 'graduation']);

interface TplLite {
  id: string;
  bg_id: string;
  recommendEvents: readonly EventType[] | EventType[];
}

/** 템플릿 미리보기 카드 — admin/wizard 공유. 템플릿의 첫 recommendEvent로 sample 데이터 결정.
 *  templateConfigs(admin DB override)가 있으면 그 첫 layout을, 없으면 코드 default의 첫 layout을 사용 */
export function buildSamplePreviewCard(
  t: TplLite,
  ev?: EventType,
  layoutOverride?: LayoutId,
  templateConfigs?: Record<string, string[]>
): BaseCard {
  const eventId = ev || (t.recommendEvents[0] as EventType) || 'etc';
  const sample = SAMPLE_BY_EVENT[eventId] || SAMPLE_BY_EVENT.etc;
  const isMessageCard = MESSAGE_CARD_EVENTS.has(eventId as string);
  // 1) admin DB override 우선 → 2) 코드 default getTemplateLayouts
  const dbOverride = templateConfigs?.[t.id];
  const allowed = (dbOverride && dbOverride.length > 0)
    ? (dbOverride as LayoutId[])
    : (getTemplateLayouts(t as any) as LayoutId[]);
  const defaultLayout = allowed[0];
  const layoutId = layoutOverride || defaultLayout;
  return {
    id: 'preview',
    slug: 'preview',
    event_type: eventId,
    layout_id: layoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: sample.title || '',
    greeting_oneliner: sample.greeting_oneliner ?? null,
    body: sample.body ?? null,
    event_date: isMessageCard ? null : (sample.event_date ?? null),
    event_place: isMessageCard ? null : (sample.event_place ?? null),
    map_url: isMessageCard ? null : 'https://maps.google.com',
    contact_name: sample.contact_name ?? null,
    contact_phone: isMessageCard ? null : (sample.contact_phone ?? null),
    extra_info: sample.extra_info ?? null,
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}
