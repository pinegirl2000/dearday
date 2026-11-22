# 템플릿별 타이포그래피 · 프레임 안전영역 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 템플릿 25개가 각자 글꼴·크기·자간을 갖고, 어떤 제목을 넣어도 배경 프레임 밖으로 글자가 나가지 않으며, 관리자가 미리보기로 조정할 수 있게 한다.

**Architecture:** 순수 모듈(`font-keys` · `typography` · `fit-plan`)이 글꼴 키·스타일 병합·맞춤 계산을 담당하고, React 컴포넌트 `FitText` 가 DOM 측정 결과를 `fit-plan` 에 넘겨 적용한다. 값은 DB `typography JSONB` → 템플릿 코드 기본값 → 레이아웃 기본값 순으로 속성 단위 병합되며, 기존 `templateColorOverride` 전달 경로를 그대로 탄다.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript · `next/font/google` · zod 3 · Postgres(pg) · Vitest(신규, 순수 모듈 테스트용)

**Spec:** `docs/superpowers/specs/2026-11-22-template-typography-design.md`

## Global Constraints

- 글꼴은 `next/font/google` 로만 로드, 모든 글꼴 `variable` 옵션 + `display: 'swap'`, 레지스트리 최대 9종
- 글꼴 키: `notoSerif` `notoSans` `gowunBatang` `nanumMyeongjo` `cormorant` `playfair` `greatVibes` `sacramento` `gowunDodum` — 스택은 설계 §6.1 표 그대로
- Gothic A1 은 레지스트리 밖 유지 (`var(--font-gothic-a1)` 사용처 변경 금지)
- 병합 우선순위(속성 단위): DB `typography` → 템플릿 코드 `typography` → 레이아웃 기본 → 전역 기본
- 안전영역: 흐름형만 DB `content_side` → 템플릿 `contentSide` → 20px. 절대배치 `content_side` 의미(필드 오프셋) 변경 금지
- 검증 범위: size 8~80(px), minSize 6~80, spacing −0.02~0.6(em), weight ∈ {300,400,500,600,700}, lineHeight 1.0~2.4
- 자동 맞춤 기본 하한: `minSize = size × 0.72`(반올림), `minSpacing = min(spacing, 0.04)`; 최종 안전장치 하한 10px
- 숨김 최대 300ms, 웹폰트 도착 후 재측정은 축소만
- 발행된 카드에도 즉시 반영 (스냅샷 없음). 관리자 저장 버튼 옆 문구: `발행된 카드에도 바로 적용됩니다`
- 프로젝트 규칙: 모든 함수·복잡 로직에 한국어 "왜" 주석, `any` 금지, 매직 넘버는 `UPPER_SNAKE_CASE` 상수, 파일명 kebab-case(신규 파일), 관리자 액션은 `isAdminEmail` 확인
- **이 폴더는 git 저장소가 아님** → 커밋 단계 대신 각 Task 끝에 `npx tsc --noEmit -p .` 와 `npx vitest run` 통과를 체크포인트로 삼는다
- 로컬에 DB 가 없음 → DB 관련 동작은 단위 테스트 + 타입으로 검증, 화면 검증은 Task 7 의 개발용 미리보기 페이지로 한다

## Review Focus

1. **제목에 줄바꿈(`\n`)이 들어간 경우** — 각 줄을 따로 재고 가장 넓은 줄 기준으로 맞춘다 (Task 4 `planFit` 테스트 `widest explicit line governs`)
2. **최소 크기에서도 넘치는 한 단어** (예: `Congratulations!!!`) — 10px 하한까지 더 줄여 선을 넘지 않는다 (Task 4 `single long word shrinks below minSize down to floor`)
3. **컨테이너 폭이 0** (아직 레이아웃 안 된 썸네일, 숨겨진 탭) — 맞춤을 건너뛰고 원래 스타일 유지, 하한으로 떨어지지 않는다 (Task 4 `zero available width returns base style`)
4. **빈 제목 / 편집 중 빈 값** — NaN·무한 루프 없이 원래 스타일 반환 (Task 4 `empty text returns base style`)
5. **DB 에 남은 알 수 없는 글꼴 키·범위 밖 값** (글꼴 목록 변경 후) — 해당 속성만 무시하고 하위 우선순위 값 사용 (Task 1 `unknown font key in db falls back`, Task 2 스키마 테스트)

---

### Task 1: 테스트 환경 + 글꼴 키 + 스타일 병합 (순수 모듈)

**Files:**
- Modify: `package.json` (devDependency `vitest`, 스크립트 `"test": "vitest run"`)
- Create: `vitest.config.ts` (`@` → `src` alias, `environment: 'node'`, include `src/**/*.test.ts`)
- Create: `src/lib/font-keys.ts`
- Create: `src/lib/typography.ts`
- Test: `src/lib/typography.test.ts`

**Interfaces:**
- Produces:
  - `export const FONT_KEYS = ['notoSerif','notoSans','gowunBatang','nanumMyeongjo','cormorant','playfair','greatVibes','sacramento','gowunDodum'] as const`
  - `export type FontKey = (typeof FONT_KEYS)[number]`
  - `export const FONT_STACKS: Record<FontKey, string>` — 설계 §6.1 스택 문자열 (CSS 변수명: `--font-noto-serif` `--font-noto-sans` `--font-gowun-batang` `--font-nanum-myeongjo` `--font-cormorant` `--font-playfair` `--font-great-vibes` `--font-sacramento` `--font-gowun-dodum`)
  - `export function isFontKey(v: unknown): v is FontKey`
  - `export type TextRole = 'eventLabel' | 'subtitle' | 'title' | 'body'`
  - `export interface RoleStyle { font?: FontKey; size?: number; minSize?: number; spacing?: number; minSpacing?: number; weight?: 300|400|500|600|700; lineHeight?: number; uppercase?: boolean }`
  - `export type TemplateTypography = Partial<Record<TextRole, RoleStyle>>`
  - `export interface ResolvedRoleStyle { fontFamily: string; size: number; minSize: number; spacing: number; minSpacing: number; weight: number; lineHeight: number; uppercase: boolean }`
  - `export function resolveRoleStyle(role: TextRole, sources: { db?: TemplateTypography | null; template?: TemplateTypography; layout?: RoleStyle; }): ResolvedRoleStyle`
  - `export const ROLE_DEFAULTS: Record<TextRole, Required<Pick<RoleStyle,'font'|'size'|'spacing'|'weight'|'lineHeight'>>>` — 전역 기본: title `notoSerif/24/0.4/500/1.3`, subtitle `notoSerif/13/0.2/400/1.5`, eventLabel `playfair/11/0.5/600/1.4`, body `notoSerif/15/0/400/2.0` (현재 화면값과 동일하게 — 기본값만으로는 모양이 바뀌지 않도록)
  - `export function resolveContentSide(db: number | null | undefined, template: number | undefined): number` — 기본 `DEFAULT_CONTENT_SIDE = 20`
  - `export function layoutFieldToRoleStyle(field: { fontSize: number; fontWeight?: number; letterSpacing?: string; lineHeight?: number } | undefined): RoleStyle | undefined` — `'0.4em'` 문자열 → `0.4`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/typography.test.ts`
  - `db overrides single property only`: db `{title:{spacing:0.1}}`, template `{title:{font:'cormorant',size:34}}` → `{fontFamily: FONT_STACKS.cormorant, size:34, spacing:0.1}`
  - `defaults match current rendering`: 소스 없음 → title `size 24, spacing 0.4, weight 500, lineHeight 1.3, fontFamily FONT_STACKS.notoSerif`
  - `derived minimums`: template title `{size:34, spacing:0.18}` → `minSize 24`(34×0.72=24.48→24), `minSpacing 0.04`
  - `unknown font key in db falls back`: db `{title:{font:'comicSans' as never}}`, template `{title:{font:'playfair'}}` → `FONT_STACKS.playfair`
  - `layout field converts em string`: `layoutFieldToRoleStyle({fontSize:11, letterSpacing:'0.5em'})` → `{size:11, spacing:0.5}`
  - `content side precedence`: `(null, 70)`→70, `(40, 70)`→40, `(undefined, undefined)`→20
- [ ] **Step 2: 실행해 실패 확인** — Run: `npx vitest run src/lib/typography.test.ts` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: `font-keys.ts`, `typography.ts` 구현** — 병합은 속성마다 db → template → layout → ROLE_DEFAULTS 중 첫 유효값; `font` 는 `isFontKey` 통과한 값만 유효
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run` / Expected: PASS 6 tests
- [ ] **Step 5: 체크포인트** — `npx tsc --noEmit -p .` 오류 0

### Task 2: DB 컬럼 · 검증 스키마 · 저장/조회 액션

**Files:**
- Modify: `scripts/migrate.js` (183행 `box_max_width` 다음 줄)
- Create: `src/lib/typography-schema.ts`
- Test: `src/lib/typography-schema.test.ts`
- Modify: `src/lib/actions/templateConfig.ts` (`TemplateColors`, `getAllTemplateColors`, 신규 `saveTemplateTypography`)
- Modify: `src/app/i/[slug]/_components/ClassicTemplateCard.tsx:41-53`, `src/app/i/[slug]/_components/TemplateCard.tsx:36-47` — `templateColorOverride` 타입에 `typography?: TemplateTypography | null` 추가

**Interfaces:**
- Consumes: `FONT_KEYS`, `TemplateTypography` (Task 1)
- Produces:
  - SQL: `ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS typography JSONB;`
  - `export const typographySchema: z.ZodType<TemplateTypography>` — 각 역할 optional, 범위는 Global Constraints, `.strict()` 로 알 수 없는 키 거부
  - `export function sanitizeTypography(input: unknown): TemplateTypography | null` — 파싱 실패 시 `null`; 빈 역할(속성 0개) 제거, 전부 비면 `null`
  - `TemplateColors.typography: TemplateTypography | null` — `getAllTemplateColors` 가 컬럼을 읽고 `sanitizeTypography` 를 거쳐 넣음 (DB 의 잘못된 값이 화면을 깨지 않도록), `hasAny` 조건에 포함
  - `export async function saveTemplateTypography(templateId: string, typography: unknown): Promise<{ ok: boolean; error?: string }>` — 관리자 확인 → `typographySchema.safeParse` 실패 시 `{ok:false, error:'글꼴 설정 값이 올바르지 않습니다'}` → `sanitizeTypography` 결과를 upsert(`allowed_layouts` 는 `'{}'` 기본, 기존 `saveTemplateColors` 패턴) → `revalidatePath('/admin/templates')`, `revalidatePath('/cards/new')`, `revalidatePath('/i/[slug]', 'page')`

- [ ] **Step 1: 실패하는 테스트** — `src/lib/typography-schema.test.ts`
  - `accepts valid partial`: `{title:{font:'cormorant', size:34, spacing:0.18}}` → success
  - `boundary values`: size 8·80, spacing −0.02·0.6 → success; size 7·81, spacing 0.61 → fail
  - `rejects unknown font and unknown key`: `{title:{font:'arial'}}` fail, `{title:{color:'#000'}}` fail, `{header:{}}` fail
  - `sanitize drops empty roles`: `{title:{}, body:{size:15}}` → `{body:{size:15}}`; `{title:{}}` → `null`; `'garbage'` → `null`
- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/typography-schema.test.ts` / Expected: FAIL
- [ ] **Step 3: 스키마·sanitize 구현, migrate.js 한 줄 추가, 액션·타입 수정**
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run` / Expected: PASS (Task 1 포함 전부)
- [ ] **Step 5: 체크포인트** — `npx tsc --noEmit -p .` 오류 0

### Task 3: 글꼴 등록 수정 + 깨진 글꼴 문자열 교체

**Files:**
- Create: `src/lib/fonts.ts` — `next/font/google` 인스턴스 9종 + Gothic A1, `export const FONT_VARIABLE_CLASSNAMES: string` (모든 `.variable` 을 공백으로 연결)
- Modify: `src/app/layout.tsx` — 기존 글꼴 선언 제거, `<html className={FONT_VARIABLE_CLASSNAMES}>`
- Modify: `src/lib/layouts/*.ts` 의 모든 `fontFamily` 문자열 → `FONT_STACKS[...]`
- Modify: `ClassicTemplateCard.tsx:71-72` (`SERIF`, `SANS`), 같은 파일·`TemplateCard.tsx`·`VintageScriptCard.tsx` 안의 `'Sacramento'`·`'Playfair Display'`·`'Cormorant Garamond'`·`'Great Vibes'` 문자열 리터럴 → `FONT_STACKS`

**Interfaces:**
- Consumes: `FONT_STACKS`, `FontKey` (Task 1)
- Produces: `FONT_VARIABLE_CLASSNAMES`; CSS 변수 9종이 `<html>` 에 정의됨

- 글꼴 옵션: `Noto_Serif_KR`(300–700), `Noto_Sans_KR`(300,400,500,700), `Gowun_Batang`(400,700), `Nanum_Myeongjo`(400,700,800), `Cormorant_Garamond`(400–700), `Playfair_Display`(400–700, normal·italic), `Great_Vibes`(400), `Sacramento`(400), `Gowun_Dodum`(400), `Gothic_A1`(300,400,500). 모두 `subsets: ['latin']`, `display: 'swap'`. 한글 전용(`Gowun_*`, `Nanum_Myeongjo`)은 `preload: false` (용량 큰 한글 서브셋을 모든 페이지에서 미리 받지 않도록)

- [ ] **Step 1: 실패하는 확인 스크립트 준비** — 브라우저(`/`)에서 실행할 캔버스 폭 비교: `ctx.font = '40px ' + FONT_STACKS[k]` 와 `'40px serif'` 의 `measureText('Spring Gathering 봄 모임').width` 가 키마다 **달라야** 함. 현재 상태에서 실행 → `playfair`·`sacramento` 등이 serif 와 같은 값(574)으로 FAIL 확인
- [ ] **Step 2: `fonts.ts` 작성, `layout.tsx`·레이아웃·카드 문자열 교체**
- [ ] **Step 3: 같은 스크립트 재실행** — Expected: 9개 키 모두 serif 기준값과 다른 폭 (글꼴 실제 적용)
- [ ] **Step 4: 잔존 리터럴 0 확인** — Run: `grep -rnE "'(Playfair Display|Sacramento|Great Vibes|Cormorant Garamond|Noto Serif KR|Noto Sans KR)'" src --include='*.ts' --include='*.tsx' | grep -v font-keys.ts` / Expected: 출력 없음
- [ ] **Step 5: 체크포인트** — `npx tsc --noEmit -p .`, `npx vitest run` 통과

### Task 4: 맞춤 계산(`planFit`) + `FitText` 컴포넌트

**Files:**
- Create: `src/lib/fit-plan.ts`
- Test: `src/lib/fit-plan.test.ts`
- Create: `src/components/typography/fit-text.tsx`

**Interfaces:**
- Consumes: `ResolvedRoleStyle` (Task 1)
- Produces:
  - `export interface FitMeasure { widestLine(size: number, spacing: number): number; longestWord(size: number, spacing: number): number }`
  - `export interface FitResult { size: number; spacing: number; wrap: boolean }`
  - `export function planFit(text: string, available: number, style: Pick<ResolvedRoleStyle,'size'|'minSize'|'spacing'|'minSpacing'>, measure: FitMeasure): FitResult`
  - 상수: `SPACING_STEP = 0.02`, `SIZE_STEP = 1`, `FLOOR_SIZE = 10`
  - `export function FitText(props: { as?: 'h1' | 'div'; text: string; style: ResolvedRoleStyle; color: string; align?: 'left' | 'center' | 'right'; shrinkToFit?: boolean; children?: React.ReactNode; className?: string }): JSX.Element` — `children` 이 있으면 그걸 렌더(편집 모드 `Editable` 래핑용), 측정은 `text` 로. `shrinkToFit=false` 면 줄바꿈 규칙만 적용(body)

- 알고리즘(`planFit`, 순서 고정):
  1. `text.trim()` 비었거나 `available <= 0` → `{size, spacing, wrap:false}` 그대로
  2. `widestLine(size, spacing) <= available` → 그대로
  3. spacing 을 `SPACING_STEP` 씩 `minSpacing` 까지 줄이며 맞으면 반환
  4. size 를 `SIZE_STEP` 씩 `minSize` 까지 줄이며(spacing=minSpacing) 맞으면 반환
  5. `wrap: true`, size=minSize. `longestWord(minSize, minSpacing) <= available` 이면 반환
  6. 아니면 `FLOOR_SIZE` 까지 size 를 더 줄여 `longestWord` 가 맞는 첫 값(못 맞추면 FLOOR_SIZE), `wrap: true`
- `FitText` DOM 규칙:
  - 측정은 숨겨진 형제 `<span aria-hidden>`(같은 글꼴 속성, `white-space: pre`, `position:absolute; visibility:hidden`)의 `offsetWidth` — transform(축소 썸네일)에 영향받지 않음. 가용 폭 = 컨테이너 `clientWidth`
  - `widestLine`: `text.split('\n')` 각 줄 / `longestWord`: 공백 기준 단어
  - 실행: `useLayoutEffect`(첫 그리기 전) + 컨테이너 `ResizeObserver` + `text`/`style` 변경 시 전체 재계산
  - 첫 표시: `document.fonts.status === 'loaded'` 면 즉시, 아니면 `Promise.race([document.fonts.ready, 300ms])` 후 측정·표시. 그 전엔 `visibility: hidden`(공간 유지)
  - 웹폰트 도착 후 재측정: 새 결과의 size 가 현재보다 작을 때만 적용
  - 출력 스타일: `fontFamily, fontWeight, lineHeight, letterSpacing: ${spacing}em, fontSize: ${size}px`, `text-transform: uppercase`(옵션), `white-space: pre-wrap`, `word-break: keep-all`, `overflow-wrap: normal`, wrap 일 때 `text-wrap: balance`; `align==='center'` 이면 `padding-left: ${spacing}em` (마지막 글자 뒤 자간 보정)

- [ ] **Step 1: 실패하는 테스트** — `src/lib/fit-plan.test.ts` (가짜 measure: 글자 수 × size × (0.6 + spacing))
  - `fits without change`: 짧은 텍스트 → 입력 그대로, wrap false
  - `reduces spacing before size`: spacing 만 줄여서 맞는 폭 → size 불변, spacing < 입력, ≥ minSpacing
  - `reduces size after spacing floor`: → spacing === minSpacing, minSize ≤ size < 입력
  - `wraps at minSize when line still too wide`: 여러 단어 → `wrap: true`, size === minSize
  - `widest explicit line governs`: `'Hi\nSpring Garden Gathering'` 결과가 `'Spring Garden Gathering'` 단독 결과와 같음
  - `single long word shrinks below minSize down to floor`: `'Congratulations!!!'`, 좁은 폭 → size < minSize, size ≥ 10
  - `zero available width returns base style`, `empty text returns base style`
- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/fit-plan.test.ts` / Expected: FAIL
- [ ] **Step 3: `planFit` 구현 → 테스트 통과 확인** — Run: `npx vitest run` / Expected: PASS
- [ ] **Step 4: `FitText` 구현** (DOM 부분은 Task 7 미리보기 페이지에서 화면 검증)
- [ ] **Step 5: 체크포인트** — `npx tsc --noEmit -p .` 오류 0

### Task 5: 흐름형 카드(`ClassicTemplateCard`) 적용

**Files:**
- Modify: `src/lib/templates.ts` — `TemplateMeta` 에 `typography?: TemplateTypography`, `contentSide?: number` 필드만 추가(값은 Task 8)
- Modify: `src/app/i/[slug]/_components/ClassicTemplateCard.tsx` — 205-220행 padding, 300-370행 eventLabel·subtitle·title·body

**Interfaces:**
- Consumes: `resolveRoleStyle`, `resolveContentSide`, `layoutFieldToRoleStyle` (Task 1), `FitText` (Task 4), `templateColorOverride.typography` (Task 2)

- 규칙:
  - 각 역할: `resolveRoleStyle(role, { db: templateColorOverride?.typography, template: tpl?.typography, layout: layoutFieldToRoleStyle(lay.fields[role 대응 필드]) })` — 대응: eventLabel→`eventLabel`, subtitle→`subtitle`, title→`title`, body→`body`
  - **단, 레이아웃 기본은 eventLabel 에만 사용** — 현재 화면이 title/subtitle/body 에서 레이아웃 정의를 무시하고 있어, 기본 모양 유지를 위해 그 셋은 `layout` 을 넘기지 않음 (ROLE_DEFAULTS 가 현재 화면값)
  - `thank_classic` 제목 분기(344행 필기체 44px)는 코드에서 제거하고 해당 템플릿 기본값(`tpl-*` 중 `layout_id: 'thank_classic'` 인 템플릿의 `typography.title = { font:'sacramento', size:44, spacing:0.01, weight:400, lineHeight:1.15 }`)으로 이동 — 이 값은 이 Task 에서 넣는다(모양 유지)
  - title·eventLabel·subtitle 는 `FitText`(shrinkToFit), body 는 `FitText shrinkToFit={false}`
  - 좌우 padding: `content_side` DB 값이 없어도 `resolveContentSide(db, tpl?.contentSide)` 를 `pctOf` 로 적용 (기존 shorthand 의 20px 대체)
  - 색상·Editable 래핑·margin 은 기존 그대로

- [ ] **Step 1: 동작 유지 확인 기준 기록** — 수정 전 `/typography-demo` 가 아직 없으므로 `/cards/new?type=birthday` 미리보기의 제목 계산 스타일(`getComputedStyle(h1)` fontSize·letterSpacing)을 기록: 24px / 9.6px
- [ ] **Step 2: 구현**
- [ ] **Step 3: 기본값 유지 확인** — 같은 화면에서 제목 짧을 때 fontSize 24px · letterSpacing 9.6px · 글꼴은 Noto Serif KR 실제 적용(Task 3 스크립트)
- [ ] **Step 4: 체크포인트** — `npx tsc --noEmit -p .`, `npx vitest run` 통과

### Task 6: 절대배치 카드(`TemplateCard`) · `VintageScriptCard` 적용

**Files:**
- Modify: `src/app/i/[slug]/_components/TemplateCard.tsx:178-202` (`FieldText`), 311·341·342·617행 호출부
- Modify: `src/app/i/[slug]/_components/VintageScriptCard.tsx` (글꼴은 Task 3 에서 교체됨 — 여기선 변경 없음 확인만)

**Interfaces:**
- Consumes: Task 1·4 와 동일
- 규칙:
  - `FieldText` 에 `role?: TextRole` prop 추가. role 이 있으면 `resolveRoleStyle(role, { db, template, layout: layoutFieldToRoleStyle(field) })` 결과로 `FitText` 렌더(절대배치는 레이아웃 정의가 실제로 쓰이므로 `layout` 전달). 위치·폭 계산(`calc(${field.x}% + ${off.side}px)` 등)은 그대로
  - role 지정: eventLabel(311) `eventLabel`, subtitle(341) `subtitle`, title(342) `title`, body(617) `body`. date/place/extra 는 role 없음(기존 렌더)
  - 절대배치에는 `contentSide` 코드 기본값을 적용하지 않는다(Global Constraints)

- [ ] **Step 1: 구현**
- [ ] **Step 2: 확인** — layout-4 를 허용하는 템플릿(`tpl-watercolor-purple`)을 Task 7 페이지에서 layout-4 로 렌더, 긴 제목이 `w%` 박스 안에 머무는지
- [ ] **Step 3: 체크포인트** — `npx tsc --noEmit -p .`, `npx vitest run` 통과

### Task 7: 개발용 미리보기 페이지 (`/typography-demo`)

**Files:**
- Create: `src/app/(dev)/typography-demo/page.tsx`

**Interfaces:**
- Consumes: `TEMPLATES`, `getTemplateLayouts` (`src/lib/templates.ts`), `buildSamplePreviewCard(t, ev?, layoutOverride?)` (`src/lib/templates/sampleData.ts:71`), `TemplateCard`(내부에서 레이아웃별로 Classic/Vintage 분기)
- 규칙:
  - `process.env.NODE_ENV === 'production'` 이면 `notFound()`
  - 쿼리: `?tpl=<id>`(없으면 전체), `?layout=<id>`, `?w=375|440`(카드 컨테이너 폭, 기본 440)
  - 템플릿마다 제목 3종으로 카드 3장 가로 나열: `Spring Gathering` / `Spring Garden Gathering Party` / `우리 가족 봄나들이 모임`
  - 각 카드 아래 템플릿 id·레이아웃 id 텍스트
  - DB 없이 동작해야 함 (서버에서 DB 호출 금지, `templateColorOverride` 미전달)

- [ ] **Step 1: 페이지 작성**
- [ ] **Step 2: 확인** — `http://localhost:3002/typography-demo?tpl=tpl-watercolor-green` 열어 카드 3장 렌더, 콘솔 오류 0
- [ ] **Step 3: 체크포인트** — `npx tsc --noEmit -p .` 오류 0

### Task 8: 템플릿 25개 기본값 큐레이션

**Files:**
- Modify: `src/lib/templates.ts` — 25개 템플릿 각각 `typography`, `contentSide`

**Interfaces:**
- Consumes: `FontKey`(Task 1), `/typography-demo`(Task 7)
- 대상: `tpl-lavender-classic` `tpl-cream-classic` `tpl-watercolor-purple` `tpl-watercolor-purple-soft` `tpl-watercolor-green` `tpl-beige-warm` `tpl-mint-fresh` `tpl-coral-bright` `tpl-vintage-gold` `tpl-teddy-pink` `tpl-teddy-blue` `tpl-pink-ribbon-arch` `tpl-pink-ribbon-mono` `tpl-eucalyptus-gold` `tpl-bear-blue-sky` `tpl-party-balloons-cake` `tpl-pink-castle` `tpl-sage-teddy` `tpl-pressed-flowers` `tpl-pastel-cake-bunting` `tpl-rose-gold-balloons` `tpl-gold-splatter` `tpl-black-gold-gala` `tpl-iris-hearts` `tpl-lavender-peony`
- 기준 (설계 §6.6):
  - `contentSide`: 배경 이미지의 프레임·세로선 안쪽 가장자리에서 12px 이상 안쪽이 되도록 440px 기준 px 로 지정 (프레임 없는 그라데이션 배경은 지정하지 않음 → 20px)
  - 고정 예: `tpl-watercolor-green` → `contentSide: 70`, `title { font:'cormorant', size:34, spacing:0.18 }`, `eventLabel { font:'playfair', size:11, spacing:0.42 }`
  - Teddy·Balloons·Cake·Castle 계열 → 제목 `gowunDodum` 계열, 자간 0.02~0.08; Vintage·Gold·Gala 계열 → `playfair`; 수채화·꽃 계열 → `cormorant` / `gowunBatang`; 필기체(`greatVibes`·`sacramento`)는 제목 전용, eventLabel·body 금지(가독성)
  - 한 템플릿 안에서 글꼴은 최대 2종
- [ ] **Step 1: 값 입력** (템플릿 묶음별로)
- [ ] **Step 2: 화면 검증** — 25개 × `w=375`·`w=440` 스크린샷을 `/private/tmp/.../scratchpad/typography-qa/` 에 저장하고 각 장에서 ① 선/프레임 넘김 0 ② 한글 두부 0 ③ 음절 중간 끊김 0 확인. 넘김이 있으면 해당 템플릿 `contentSide` 를 늘림
- [ ] **Step 3: 체크포인트** — `npx tsc --noEmit -p .`, `npx vitest run` 통과

### Task 9: 관리자 '글꼴' 편집기

**Files:**
- Create: `src/app/admin/templates/_TemplateTypographyEditor.tsx`
- Modify: `src/app/admin/templates/_TemplateBrowser.tsx:205-212` (배치 편집기 바로 아래 마운트), 미리보기 카드에 테스트 문구 전환 적용

**Interfaces:**
- Consumes: `saveTemplateTypography` (Task 2), `FONT_KEYS`·`FONT_STACKS` (Task 1), `TemplateTypography`
- Produces: `export default function TemplateTypographyEditor(props: { templateId: string; codeDefaults?: TemplateTypography; initial?: TemplateTypography | null; onChange: (t: TemplateTypography | null) => void; onSaved?: (t: TemplateTypography | null) => void; sampleTitle: SampleTitleKey; onSampleTitleChange: (k: SampleTitleKey) => void }): JSX.Element`, `export type SampleTitleKey = 'short' | 'longLatin' | 'korean'`
- 규칙:
  - 역할 4개 섹션: 글꼴 `<select>`(각 option 에 `style={{fontFamily: FONT_STACKS[k]}}`), 크기 number, 자간 range(−0.02~0.6, step 0.01), 굵기 select, 행간 number. 빈 값 = 코드 기본값 사용(placeholder 에 코드 기본값 표시)
  - 역할별 '기본값으로' 버튼 → 해당 역할 DB 값 제거
  - 변경 즉시 `onChange` 로 부모 `localColors[tpl].typography` 갱신 → 미리보기 즉시 반영(저장 전)
  - 테스트 문구 전환 3버튼 → 부모가 `buildPreview` 결과의 `title` 을 Task 7 의 3문구로 교체
  - 저장 버튼 옆 문구: `발행된 카드에도 바로 적용됩니다`; 저장 결과 `toast.success('글꼴 저장됨')` / `toast.error(res.error)`
  - 기존 `TemplateMetricsEditor` 의 레이아웃·스타일 패턴을 따름
- [ ] **Step 1: 구현**
- [ ] **Step 2: 확인** — 로컬엔 DB·관리자 로그인이 없으므로 화면 검증은 하지 않는다. `npx tsc` 로 타입만 검증하고, "DB 환경에서 글꼴 저장 → 미리보기·`/i/[slug]` 반영"을 완료 보고의 사용자 확인 항목에 넣는다
- [ ] **Step 3: 체크포인트** — `npx tsc --noEmit -p .`, `npx vitest run` 통과

---

## 완료 보고 시 포함할 것

- 변경 파일 목록, `npx vitest run` 결과, `npx tsc` 결과
- Task 8 QA 스크린샷 폴더 경로와 넘김 0 확인 결과
- DB 환경에서 사용자가 확인할 항목: `npm run migrate` 로 컬럼 추가 → 관리자 글꼴 저장 → 초대장 반영
