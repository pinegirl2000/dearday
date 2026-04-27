# DearDay 봉투 애니메이션

봉투 → 카드 전환 4종. 모두 Framer Motion 기반, `transform`/`opacity`만 사용해 60fps 보장, `prefers-reduced-motion` 지원.

## 공통 Props (`EnvelopeProps`)

| prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `isOpen` | `boolean` | — | 봉투 열림 상태 |
| `envelopeColor` | `string` | `#7B5EA7` | 봉투 본체 색 |
| `sealColor` | `string` | `#C9A0DC` | 봉인 씰 색 |
| `children` | `ReactNode` | — | 카드 내부 콘텐츠 |
| `width` | `number` | `380` | 가로 픽셀 |

## 4종 비교

| 컴포넌트 | 동작 | 추천 이벤트 | 시간 |
|---|---|---|---|
| `FoldEnvelope` | 편지지 3등분 펼침 | 결혼식, 세례 | 1.2s |
| `SlideEnvelope` | 카드 슬라이드 업 | 생일, 돌잔치 | 1.0s |
| `FlipEnvelope` | 3D 플립 변신 | 개업, 약혼 | 1.1s |
| `PopEnvelope` | 탄성 spring + 컨페티 | 캐주얼 모임 | 0.9s |

## 사용 예

```tsx
import { FoldEnvelope } from '@/components/envelopes';

<FoldEnvelope isOpen={open} width={360}>
  <p>민준 ♥ 서연 — 2026년 6월 14일</p>
</FoldEnvelope>
```

## 데모

`/envelopes-demo` 라우트에서 4종 모두 미리보기 가능 (개발용).
