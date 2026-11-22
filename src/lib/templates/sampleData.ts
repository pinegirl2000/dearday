// 템플릿/레이아웃 미리보기용 sample data — 관리자 + Create wizard 공유

import type { BaseCard, EventType, LayoutId } from '@/types/card';
import { getTemplateLayouts } from '@/lib/templates';

/** 싱가포르는 UTC+8, 서머타임 없음 */
const SG_OFFSET_HOURS = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 샘플 행사 날짜 — 오늘 기준 몇 주 뒤의 특정 요일·시각(싱가포르 시간).
 * 고정 날짜를 쓰면 시간이 지나 과거가 되고, 날짜를 고치지 않은 카드가 "이미 지난 날짜"로 발행된다.
 * weekday: 0=일 … 6=토. 결과는 now + weeksAhead주 이후 처음 오는 그 요일.
 */
export function upcomingSampleDate(
  opts: { weeksAhead: number; weekday: number; hour: number; minute?: number },
  now: Date = new Date()
): string {
  // 싱가포르 벽시계 기준으로 요일을 계산하기 위해 +8시간 한 값을 UTC 로 다룬다
  const sgNow = new Date(now.getTime() + SG_OFFSET_HOURS * 60 * 60 * 1000);
  const base = Date.UTC(sgNow.getUTCFullYear(), sgNow.getUTCMonth(), sgNow.getUTCDate()) + opts.weeksAhead * 7 * MS_PER_DAY;
  const daysToWeekday = (opts.weekday - new Date(base).getUTCDay() + 7) % 7;
  const sgWall = base + daysToWeekday * MS_PER_DAY + (opts.hour * 60 + (opts.minute ?? 0)) * 60 * 1000;
  let utc = sgWall - SG_OFFSET_HOURS * 60 * 60 * 1000;
  // 같은 요일의 이른 시각이면 weeksAhead 를 못 채울 수 있어 한 주 미룸
  if (utc - now.getTime() < opts.weeksAhead * 7 * MS_PER_DAY) utc += 7 * MS_PER_DAY;
  return new Date(utc).toISOString();
}

export const SAMPLE_BY_EVENT: Record<string, Partial<BaseCard>> = {
  birthday: {
    title: "Avery's Birthday Party", greeting_oneliner: 'Cheers to another year!',
    body: "Come share laughter, joy, and cake as we celebrate Avery's special day.",
    event_date: upcomingSampleDate({ weeksAhead: 4, weekday: 6, hour: 19 }), event_place: 'The Lounge function room',
    contact_name: "Love, Avery's Family", contact_phone: '+65-2222-3333'
  },
  baptism: {
    title: "Avery's Baptism Day", greeting_oneliner: 'A blessed first step',
    body: "Please join us as we celebrate\nAvery's baptism in the Lord.",
    event_date: upcomingSampleDate({ weeksAhead: 4, weekday: 0, hour: 10, minute: 30 }), event_place: 'Grace Church, Main Sanctuary',
    contact_name: 'Love, David & Rachel', contact_phone: '+65-9999-1111'
  },
  meeting: {
    title: 'Spring Gathering', greeting_oneliner: 'See you again',
    body: "It has been too long.\nLet's gather and catch up.",
    event_date: upcomingSampleDate({ weeksAhead: 3, weekday: 6, hour: 12 }), event_place: 'Hangang Park, Open Lawn',
    contact_name: 'From the Hosts', contact_phone: '+65-3333-4444'
  },
  opening: {
    title: 'Round Cafe · Grand Opening', greeting_oneliner: 'A new beginning',
    body: "We're excited to open our doors\nand share this moment with you.",
    event_date: upcomingSampleDate({ weeksAhead: 3, weekday: 5, hour: 18 }), event_place: 'Round Cafe, 1 Orchard Lane',
    contact_name: 'The Round Cafe Team', contact_phone: '+65-7777-8888'
  },
  etc: {
    title: 'A Special Day', greeting_oneliner: 'A precious moment',
    body: "We'd love for you to share\nthis special moment with us.",
    event_date: upcomingSampleDate({ weeksAhead: 4, weekday: 6, hour: 18 }), event_place: 'Sample Venue, City',
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
  // thank_classic / thank_polaroid는 상단 사진 영역이 있는 layout — sample 사진 자동 채움
  const needsPhoto = layoutId === 'thank_classic' || layoutId === 'thank_polaroid';
  return {
    id: 'preview',
    slug: 'preview',
    event_type: eventId,
    layout_id: layoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    custom_bg_url: needsPhoto ? '/samples/mom-thank.png' : null,
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
