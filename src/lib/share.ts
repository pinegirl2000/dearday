// Smart copy 메시지 — 카드 종류에 맞춰 친근한 문구 + 링크를 함께 클립보드에 복사
// 카카오톡/WhatsApp에 붙여넣기 했을 때 받는 사람이 맥락을 바로 이해하게.

import type { BaseCard } from '@/types/card';

const PRESETS: Record<string, string> = {
  'mothers-day':  'Mom, I made this special card for you! ❤️',
  'fathers-day':  'Dad, I made this special card for you! ❤️',
  'teachers-day': 'Teacher, thank you — I made this card for you. 🌸',
  graduation:     'Congrats! Here\'s a little card to celebrate. 🎓',
  birthday:       'Happy Birthday! Here\'s a card just for you. 🎂',
  baptism:        'A blessed day — here\'s a card for you. 🕊️',
  opening:        'Come celebrate our opening!',
  meeting:        'Hope you can join us!',
  etc:            'I made this special card for you!'
};

export function getSmartCopyText(card: Pick<BaseCard, 'event_type' | 'title'>, recipientName?: string | null): string {
  const preset = PRESETS[card.event_type as string] || PRESETS.etc;
  // 받는 분 이름이 있으면 prefix로 붙임 (Mom/Dad는 이미 호칭 포함이라 제외)
  const named = ['mothers-day', 'fathers-day', 'teachers-day'].includes(card.event_type as string);
  if (recipientName && !named) {
    return `Hi ${recipientName}, ${preset.charAt(0).toLowerCase() + preset.slice(1)}`;
  }
  return preset;
}

export function buildSmartShareBundle(
  card: Pick<BaseCard, 'event_type' | 'title'>,
  recipientName: string | null | undefined,
  link: string
): string {
  return `${getSmartCopyText(card, recipientName)}\n${link}`;
}
