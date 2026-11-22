# 템플릿별 타이포그래피 · 프레임 안전영역 설계

- 작성일: 2026-11-22
- 상태: 설계 문서 최종 승인 대기 (확정 사항 반영 완료)
- 관련 화면: 초대장 열람(`/i/[slug]`), 카드 만들기 미리보기(`/cards/new`), 관리자 템플릿 편집(`/admin/templates`)

## 1. 의도와 이유

DearDay의 템플릿 25개는 배경 이미지가 모두 다른데, 글자는 모두 같은 스타일(제목 24px · 자간 0.4em · 시스템 세리프)로 찍힌다.
그 결과 ① 템플릿마다 어울리는 분위기가 나지 않고 ② 배경에 세로선·프레임이 있는 템플릿에서 제목이 선을 넘어간다
(예: Watercolor Eucalyptus 템플릿의 "Spring Gathering").

목표는 **템플릿마다 고유한 글꼴·자간·글자 폭을 갖게 하고, 사용자가 어떤 제목을 입력해도 글자가 프레임 밖으로 나가지 않게** 하는 것이다.
기본값은 개발 측이 템플릿별로 정해 두고, 운영자가 관리자 페이지에서 미리보기를 보며 계속 다듬을 수 있어야 한다 (사용자 선택: B안).

## 2. 현재 상태 (조사 결과)

| 항목 | 현재 | 문제 |
|---|---|---|
| 제목 스타일 | `ClassicTemplateCard.tsx:344` 에 `fontSize 24 / letterSpacing 0.4em` 하드코딩 | 레이아웃 파일(`lib/layouts/*.ts`)의 `title` 정의가 무시됨, 템플릿별 차이 없음 |
| 글꼴 지정 | `'Playfair Display'`, `'Sacramento'`, `'Noto Serif KR'` 등 **문자열 이름**으로 지정 | next/font는 `__Playfair_Display_9a1b34` 같은 해시 이름으로 등록하므로 **이름이 매칭되지 않아 전부 시스템 세리프로 렌더링 중** (캔버스 폭 측정으로 확인: 모두 기본 serif와 동일 574px) |
| 텍스트 영역 | 카드 440px − 좌우 20px = 400px | 프레임 안쪽 폭은 배경마다 다름(예: 약 300px). 400px 안에 들어가면 줄바꿈이 안 돼 선을 넘음 |
| 템플릿별 배치 override | `dearday_template_config` 에 `content_side` 등 존재, 관리자 `TemplateMetricsEditor` 로 편집 | 대부분 템플릿에 값 없음. 글꼴/자간 항목은 아예 없음 |
| 렌더러 | 대부분 템플릿이 `layout-classic`(흐름형, `ClassicTemplateCard`). 일부가 `layout-3/4/5/7`(절대배치, `TemplateCard`) 허용 | 두 렌더러 모두 같은 문제 |

## 3. 목표 / 비목표 / 실패 조건

**목표**
- 텍스트 역할 4개 — `eventLabel`(YOU'RE INVITED 등), `subtitle`(greeting_oneliner), `title`, `body` — 에 대해 템플릿별 글꼴·크기·자간·굵기·행간 지정
- 각 템플릿의 프레임 안쪽 폭(안전영역)을 코드 기본값으로 지정 → DB 값 없이도 선을 넘지 않음
- 제목·eventLabel·subtitle 자동 맞춤: 넘치면 자간 → 크기 → 단어 단위 줄바꿈 순으로 줄여 안전영역 안에 넣음
- 관리자 페이지에 '글꼴' 편집기 추가 (기존 '배치' 편집기와 같은 흐름, 미리보기 즉시 반영)
- 지정한 글꼴이 실제로 렌더링되도록 글꼴 등록 방식 수정

**비목표**
- 사용자(카드 작성자)가 글꼴을 고르는 기능 — 템플릿이 결정, 운영자만 조정
- 날짜·장소 정보 박스 내부 타이포 — 이번 범위 아님 (기존 `box_max_width` 유지)
- 봉투(envelopes) 글꼴
- 임의의 Google Fonts 추가 — 큐레이션된 목록만

**실패 조건 (동작해도 실패로 봄)**
- 카드를 열 때 글자가 한 번 크게 그려졌다가 줄어드는 깜빡임이 보임
- 한글 제목에서 글자가 두부(□)로 보이거나 라틴 전용 글꼴의 대체 글꼴이 들쭉날쭉함
- 한 단어가 음절 중간에서 끊김 (한국어 `keep-all` 위반)
- 자간 때문에 가운데 정렬이 오른쪽 여백만큼 왼쪽으로 쏠림

## 4. 제약

- Next.js 14 App Router, `next/font/google` 로만 글꼴 로드 (런타임 외부 CSS 금지 — 깜빡임·속도)
- 글꼴 추가는 다운로드 용량 증가 → 큐레이션 목록 최대 9개 패밀리, `display: 'swap'`
- 발행된 카드도 템플릿 설정을 실시간으로 읽음(`getAllTemplateColors`) → **이번 변경은 이미 보낸 카드의 모양도 바꾼다** (§8 참고)
- DB 마이그레이션은 `scripts/migrate.js` 의 `ADD COLUMN IF NOT EXISTS` 패턴(멱등)
- 프로젝트 규칙: 한국어 주석(왜 중심), `any` 금지, 매직 넘버 상수화, 입력 검증, 관리자 권한 확인

## 5. 접근법 (검토한 대안)

| 결정 | 선택 | 대안 | 선택 이유 |
|---|---|---|---|
| 누가 값을 정하나 | **B: 코드 기본값 + 관리자 페이지 조정** (사용자 선택) | A: 코드에만 지정 | 이미 배치 설정을 관리자에서 하고 있어 같은 흐름 |
| 글꼴 적용 방식 | **next/font CSS 변수 + 글꼴 키 레지스트리** | 외부 Google Fonts `<link>` | 외부 로드는 깜빡임·추가 요청. 현재 문자열 이름 방식은 아예 동작 안 함 |
| 저장 구조 | **`typography JSONB` 컬럼 1개** | 역할×속성별 개별 컬럼(약 20개) | 역할·속성이 늘어도 마이그레이션 불필요, 부분 override 표현이 자연스러움 |
| 넘침 방지 | **측정 기반 자동 맞춤 컴포넌트(FitText)** + CSS 기본 줄바꿈 | CSS만(`text-wrap: balance`, `overflow-wrap`) | CSS는 자간을 폭에 맞춰 줄일 수 없고, 긴 단어 하나는 결국 선을 넘거나 음절 중간에서 끊김 |
| 안전영역 | **기존 `content_side` 재사용** + 템플릿 코드 기본값 `contentSide` 추가 | 새 `safeWidth` 개념 | 같은 목적의 설정이 이미 있음 — 개념 중복 방지 |

## 6. 설계

### 6.1 글꼴 레지스트리 (`src/lib/fonts.ts` 신규)

- `layout.tsx` 에서 모든 글꼴을 `variable` 옵션으로 등록하고 `<html>` 에 변수 클래스 부여
- 글꼴 키 → CSS 값 매핑. 라틴 전용 글꼴은 **한글 대체 글꼴을 짝지어** 스택 구성

| 키 | 용도 | font-family 스택 |
|---|---|---|
| `notoSerif` | 기본 한글 세리프 | `var(--font-noto-serif), serif` |
| `notoSans` | 기본 고딕 | `var(--font-noto-sans), sans-serif` |
| `gowunBatang` (신규) | 부드러운 한글 명조 | `var(--font-gowun-batang), var(--font-noto-serif), serif` |
| `nanumMyeongjo` (신규) | 클래식 한글 명조 | `var(--font-nanum-myeongjo), var(--font-noto-serif), serif` |
| `cormorant` | 우아한 라틴 세리프 | `var(--font-cormorant), var(--font-noto-serif), serif` |
| `playfair` | 대비 강한 라틴 세리프 | `var(--font-playfair), var(--font-noto-serif), serif` |
| `greatVibes` | 라틴 필기체 | `var(--font-great-vibes), var(--font-gowun-batang), cursive` |
| `sacramento` | 가는 라틴 필기체 | `var(--font-sacramento), var(--font-gowun-batang), cursive` |
| `gowunDodum` (신규) | 둥근 한글 고딕 (Teddy·Balloons 계열) | `var(--font-gowun-dodum), var(--font-noto-sans), sans-serif` |

- *(결정)* Gothic A1 은 봉투 수신자 이름 전용(`EnvelopeBlackGold`, `InvitationView`, 마법사)으로 이미 `var(--font-gothic-a1)` 로 정상 사용 중 → 레지스트리 밖에 그대로 둔다. 9개 상한은 레지스트리 9종 기준

- 기존 코드의 문자열 글꼴 지정(`SERIF`, `SANS`, 레이아웃 `fontFamily`, `layout.tsx` 미사용 글꼴)은 레지스트리 값으로 교체

### 6.2 데이터 모델

```ts
type TextRole = 'eventLabel' | 'subtitle' | 'title' | 'body';
interface RoleStyle {
  font?: FontKey;          // §6.1 키
  size?: number;           // px, 기준 카드폭(card_max_width||440) 기준
  minSize?: number;        // 자동 맞춤 하한(px). 미지정 시 size × 0.72
  spacing?: number;        // em, -0.02 ~ 0.6
  minSpacing?: number;     // 자동 맞춤 하한(em). 미지정 시 min(spacing, 0.04)
  weight?: 300|400|500|600|700;
  lineHeight?: number;     // 1.0 ~ 2.4
  uppercase?: boolean;     // eventLabel 등
}
type TemplateTypography = Partial<Record<TextRole, RoleStyle>>;
```

- `TemplateMeta` 에 `typography?: TemplateTypography`, `contentSide?: number` 추가 (코드 기본값)
- DB: `ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS typography JSONB;`
- **우선순위 (속성 단위 병합):** DB `typography` → 템플릿 코드 `typography` → 레이아웃 기본 → 전역 기본
  - 예: DB에 `title.spacing` 만 있으면 나머지 title 속성은 코드 기본값 사용
- 안전영역 우선순위: DB `content_side` → 템플릿 코드 `contentSide` → 20px
- *(결정)* **`contentSide` 코드 기본값은 흐름형(`ClassicTemplateCard`)에서만 좌우 padding 으로 쓴다.** 절대배치(`TemplateCard`)의 `content_side` 는 기존대로 필드 위치 오프셋(`FieldOffsetCtx`) 의미를 유지하고 코드 기본값을 적용하지 않는다 — 기존 절대배치 카드 배치가 틀어지지 않도록. 절대배치의 FitText 폭은 각 필드의 `w%` 박스 폭

### 6.3 자동 맞춤 컴포넌트 (`FitText`)

- 대상: `title`, `eventLabel`, `subtitle` (body 는 여러 줄 본문이라 줄바꿈만, 크기 축소 없음)
- 알고리즘 (컨테이너 폭 = 안전영역 내부 폭):
  1. 지정 크기·자간으로 측정, 한 줄도 넘치지 않으면 종료
  2. 자간을 `spacing → minSpacing` 으로 단계적으로 줄임
  3. 그래도 넘치면 크기를 `size → minSize` 로 줄임
  4. 그래도 넘치면 하한 크기에서 단어 단위 줄바꿈 허용 (`word-break: keep-all`, `text-wrap: balance`)
  5. 단일 단어가 하한에서도 넘치면 그 단어만 크기를 더 줄임(최종 안전장치, 선 넘김 금지가 우선)
- 측정 시점: `useLayoutEffect`(첫 그리기 전) + `ResizeObserver`(화면 회전·폭 변화) + `document.fonts.ready` 후 1회 재측정
- 깜빡임 방지 *(결정)*: next/font 의 크기 보정 대체 글꼴(`adjustFontFallback`, 기본값)로 첫 측정을 하고, 측정 완료 전에는 `visibility: hidden`(공간 유지). **숨김은 최대 300ms** — 그 안에 웹폰트가 오면 웹폰트 기준으로 측정 후 표시, 넘으면 대체 글꼴 기준으로 표시. 웹폰트 도착 후 재측정은 **줄이는 방향만** 적용(커지는 재배치 금지) → '크게 그렸다 줄어듦' 은 보정된 대체 글꼴 오차 범위로 제한
- **자간 가운데 쏠림 보정:** 마지막 글자 뒤 자간만큼 `padding-left` 를 같은 값(em)으로 줌
- 편집 모드(카드 만들기 미리보기)에서 입력 변경 시 다시 측정
- *(결정)* **적용 범위: 같은 카드 컴포넌트를 쓰는 모든 곳**(관리자 브라우저·최근 카드 선택·마법사 축소 미리보기 포함) — 썸네일에서도 실제 카드와 같은 줄바꿈을 보여야 함. 폭은 `offsetWidth`(transform 영향 없음)로 재고, 측정은 요소당 ResizeObserver 1개 · 이진 탐색 대신 단계 축소(최대 약 12회)로 수십 개 동시 표시에도 부담 작게
- 측정 결과는 렌더 중 상태로만 보관, 저장하지 않음

### 6.4 렌더러 적용

- `ClassicTemplateCard`: eventLabel·subtitle·title·body 의 하드코딩 스타일 → `resolveTypography(template, layout, dbOverride)` 결과 + `FitText`
  - `thank_classic` 의 필기체 제목 분기도 동일 구조로 흡수(해당 템플릿의 코드 기본값으로 이동)
- `TemplateCard`(절대배치): `fields.title` 의 `w%` 를 컨테이너 폭으로 하는 `FitText` 적용, 글꼴은 레지스트리 키로
- `VintageScriptCard`: 글꼴 문자열만 레지스트리로 교체 (자동 맞춤은 범위 외)
- 해석 함수는 순수 함수로 `src/lib/typography.ts` 에 두고 단위 테스트 가능하게

### 6.5 관리자 '글꼴' 편집기

- 위치: `/admin/templates` 템플릿 상세의 기존 '배치'(`TemplateMetricsEditor`) 옆 탭/섹션
- 역할 4개 × (글꼴 드롭다운(글꼴 미리보기 포함), 크기, 자간 슬라이더, 굵기, 행간)
- 각 항목 '기본값으로' 버튼 (DB 값 지우기 → 코드 기본값 복귀)
- **미리보기 테스트 문구 전환:** 짧은 제목 / 긴 영문 제목 / 한글 제목 — 넘침 여부를 바로 확인
- 저장: server action `saveTemplateTypography(templateId, typography)`
  - 관리자 권한 확인(`isAdminEmail`), zod 로 키·범위 검증(글꼴 키 enum, size 8~80, spacing −0.02~0.6 등), 빈 역할 제거 후 JSONB 저장
  - 저장 후 `revalidatePath('/admin/templates')`, `revalidatePath('/cards/new')`
- 조회: `getAllTemplateColors` 에 `typography` 컬럼 포함 (기존 전달 경로 `templateColorOverride` 재사용)

### 6.6 템플릿 25개 기본값 큐레이션

- 각 배경을 보고 분위기에 맞는 글꼴 조합·자간과 `contentSide`(프레임 안쪽 여백) 지정
  - 예) Watercolor Eucalyptus: 세로선 안쪽 기준 contentSide ≈ 70px, title `cormorant` 34px · 0.18em, eventLabel `playfair` 11px · 0.42em
  - 예) Teddy/Balloons 계열: 둥근 고딕·좁은 자간 / Vintage Gold: `playfair` 대비 강조
- 검증: 템플릿마다 375px·440px 폭 × (짧은 제목 / 긴 영문 "Spring Garden Gathering" / 한글 "우리 가족 봄나들이 모임") 스크린샷으로 선 넘김·깜빡임 확인

## 7. 빌더에게 맡기는 것

- 글꼴 드롭다운·슬라이더 UI 세부 모양, 단계 축소 폭(예: 자간 0.02em씩), 파일 분리 단위
- 템플릿별 구체 수치 (§6.6 기준·예시를 따르되 화면 보고 결정)
- 단위 테스트 범위: `resolveTypography` 병합 우선순위, zod 검증(정상/경계/오류 각 1개 이상)

## 8. 확정된 사항

- **발행된 카드에도 즉시 반영한다** (사용자 결정, 2026-11-22). 템플릿 설정을 실시간으로 읽는 기존 동작을 유지하며, 발행 시점 스냅샷·버전 관리는 만들지 않는다.
  - 따라서 템플릿 기본값·관리자 수정은 이미 받은 초대장의 모양도 바꾼다 → 관리자 편집기 저장 버튼 옆에 "발행된 카드에도 바로 적용됩니다" 안내 문구 표시
