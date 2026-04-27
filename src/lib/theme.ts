import type { ThemeId } from '@/types/card';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  recommendEvents: string[];
  colors: {
    bg: string;
    bgCard: string;
    primary: string;
    accent: string;
    deep: string;
    ink: string;
    muted: string;
  };
  fontFamily: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'hydrangea',
    name: 'Hydrangea',
    description: '보라수국 · 우아하고 부드러운',
    recommendEvents: ['결혼', '세례', '돌'],
    colors: {
      bg: '#FAF5FF',
      bgCard: '#FFFFFF',
      primary: '#7B5EA7',
      accent: '#C9A0DC',
      deep: '#5A3D7A',
      ink: '#2C1F3D',
      muted: '#8A779E'
    },
    fontFamily: "'Noto Serif KR', serif"
  },
  {
    id: 'modern',
    name: 'Modern',
    description: '네이비+골드 · 도시적 비즈니스',
    recommendEvents: ['개업', '약혼', '비즈니스'],
    colors: {
      bg: '#F4F5F7',
      bgCard: '#FFFFFF',
      primary: '#1A2332',
      accent: '#D4AF37',
      deep: '#243245',
      ink: '#1A2332',
      muted: '#6B7280'
    },
    fontFamily: "'Pretendard', sans-serif"
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: '크림+빈티지 · 클래식 격조',
    recommendEvents: ['결혼', '환갑', '칠순'],
    colors: {
      bg: '#F5E9D3',
      bgCard: '#EDE0C2',
      primary: '#C89F4A',
      accent: '#A07C2C',
      deep: '#4A3520',
      ink: '#2E1F10',
      muted: '#806548'
    },
    fontFamily: "'Playfair Display', 'Noto Serif KR', serif"
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'sage green · 컨템포러리 미니멀',
    recommendEvents: ['모임', '집들이', '베이비샤워'],
    colors: {
      bg: '#FAFAFA',
      bgCard: '#FFFFFF',
      primary: '#87A96B',
      accent: '#E8EFE0',
      deep: '#1A1A1A',
      ink: '#1A1A1A',
      muted: '#8A8A8A'
    },
    fontFamily: "'Pretendard', sans-serif"
  }
];

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
