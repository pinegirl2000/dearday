import type { EventType, BackgroundId } from '@/types/card';

export interface EventTypeMeta {
  id: EventType;
  emoji: string;
  label: string;
  defaultTitle: string;
  recommendTheme: string;
  recommendEnvelope: string;
  /** 이벤트 타입에 어울리는 배경 추천 — StepTemplate에서 우선 노출 */
  recommendBackgrounds: BackgroundId[];
  fields: {
    titleLabel: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
  };
}

export const EVENT_TYPES: EventTypeMeta[] = [
  {
    id: 'wedding',
    emoji: '💒',
    label: '결혼식',
    defaultTitle: '○○ ♥ ○○',
    recommendTheme: 'hydrangea',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-2', 'bg-3', 'bg-4', 'bg-1', 'bg-none'],
    fields: {
      titleLabel: '신랑 ♥ 신부',
      titlePlaceholder: '예: 이수민 ♥ 김지호',
      bodyPlaceholder: '같은 곳을 바라보며 걸어온 두 사람이\n이제 한 길을 함께 걷고자 합니다.\n귀한 발걸음으로 축복해 주시면\n더없는 기쁨이 되겠습니다.'
    }
  },
  {
    id: 'birthday',
    emoji: '🎂',
    label: '생일·돌',
    defaultTitle: '○○이의 생일',
    recommendTheme: 'modern',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-1', 'bg-2', 'bg-none', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: '주인공 이름',
      titlePlaceholder: '예: 하준이 첫 생일',
      bodyPlaceholder: '소중한 첫 생일을 맞아\n가족과 친구들을 모십니다.\n함께 축하해 주세요!'
    }
  },
  {
    id: 'opening',
    emoji: '🎉',
    label: '개업',
    defaultTitle: '○○ Open',
    recommendTheme: 'modern',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-4', 'bg-none', 'bg-1', 'bg-3', 'bg-2'],
    fields: {
      titleLabel: '상호 / 업종',
      titlePlaceholder: '예: DearDay Studio 오픈',
      bodyPlaceholder: '오랜 준비 끝에\n새로운 공간을 열게 되었습니다.\n오셔서 자리를 빛내 주세요.'
    }
  },
  {
    id: 'baptism',
    emoji: '🕊️',
    label: '세례식',
    defaultTitle: '○○ 세례식',
    recommendTheme: 'hydrangea',
    recommendEnvelope: 'envelope-2',
    recommendBackgrounds: ['bg-none', 'bg-3', 'bg-1', 'bg-4', 'bg-2'],
    fields: {
      titleLabel: '세례자 이름',
      titlePlaceholder: '예: 이하준 세례식',
      bodyPlaceholder: '하나님의 자녀로 새로 태어나는\n소중한 순간을 함께 나누고자 합니다.'
    }
  },
  {
    id: 'meeting',
    emoji: '🤝',
    label: '모임',
    defaultTitle: '모임',
    recommendTheme: 'minimal',
    recommendEnvelope: 'envelope-2',
    recommendBackgrounds: ['bg-none', 'bg-1', 'bg-2', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. Book Club Monthly Meet',
      bodyPlaceholder: '편하게 오셔서 즐거운 시간 함께 해요.'
    }
  },
  {
    id: 'etc',
    emoji: '✉️',
    label: '기타',
    defaultTitle: '초대장',
    recommendTheme: 'minimal',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-none', 'bg-1', 'bg-2', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: '제목',
      titlePlaceholder: '제목을 입력하세요',
      bodyPlaceholder: '메시지를 입력하세요'
    }
  }
];

export function getEventTypeMeta(id: EventType): EventTypeMeta {
  return EVENT_TYPES.find((e) => e.id === id) || EVENT_TYPES[5];
}
