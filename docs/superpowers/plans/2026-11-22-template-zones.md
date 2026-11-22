# 템플릿 표지+내용 면 재디자인 구현 계획

**Goal:** 배경 그림과 글이 겹치지 않도록 카드를 "표지(그림+지정 영역의 제목부) + 내용 면(날짜·연락처·RSVP)"으로 나눈다.
**Spec:** `docs/superpowers/specs/2026-11-22-template-zone-redesign-design.md`
**Tech:** Next.js 14 · React 18 · TypeScript · framer-motion · Vitest. 선행 작업의 `FitText`·`resolveRoleStyle` 재사용.

## Global Constraints
- zone 구조는 흐름형 레이아웃(`layout-classic`, `layout-7`)에서 배경에 `zone` 이 있을 때만. 그 외(절대배치·VintageScript·thank_*)는 기존 렌더 유지
- 표지는 배경 원본 비율 고정(기본 1240/1748), 그림 잘림·이동 없음
- 제목 최소 18px(실제 px), 본문은 줄이지 않고 내용 면으로 내림
- 넘침 단계: ① 본문 → 내용 면 ② 제목 2px 씩 18px 까지 ③ 부제 → 내용 면 ④ 제목부 전체 → 내용 면(표지는 그림만)
- zone 카드는 DB `card_min_height`·`content_top`·`content_side` 무시(영역이 대신함), DB 색은 계속 우선
- git 없음 → 체크포인트는 `npx tsc --noEmit -p .` + `npx vitest run`. 로컬 DB 없음 → `/typography-demo` 로 화면 검증
- 한국어 "왜" 주석, any 금지, 매직 넘버 상수화

## Review Focus
1. 영역보다 제목부가 큰 경우(긴 제목·좁은 영역) — 잘리지 않고 단계적으로 내용 면으로 내려감
2. 본문이 없는 카드 / 부제가 없는 카드 — 빈 간격·NaN 없이 배치
3. 영역 높이 0(아직 레이아웃 전) — 아무것도 내리지 않고 대기
4. 편집 모드에서 글을 줄였을 때 — 내려갔던 본문이 다시 표지로 돌아옴
5. zone 배경을 보조 레이아웃(layout-5 등)으로 발행한 기존 카드 — 기존 모양 그대로

## Tasks
1. `src/lib/zone-plan.ts` + 테스트 — `planZone(m: { zoneH; labelH; subtitleH; titleH; bodyH; gap; titleSize; minTitleSize }): { bodyBelow; subtitleBelow; headBelow; titleSize }` (한 번 호출에 한 단계만 진행 — 제목 크기는 재측정이 필요)
2. `BackgroundMeta` 에 `zone`·`aspect`·`panelColor` 추가, `src/components/cards/zone-cover.tsx`(표지+영역+측정), `ClassicTemplateCard` 에 zone 분기
3. `/typography-demo?zones=1` 영역 테두리 표시, 배경 10개 영역 지정·보정(스크린샷 확인)
4. 봉투→카드: 표지 먼저, 내용 면은 뒤이어 나타나게(기존 morph 유지), `/envelopes-demo` 로 봉투 종류별 열기 확인
5. black-gold-gala 색, 25개 판정표, 도저히 안 되는 것 수정/내림, 코드로 그린 새 템플릿(SVG 배경) 추가
6. 150장+긴 본문 QA, 최종 전체 리뷰
