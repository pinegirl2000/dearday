# 로컬 E2E 테스트 환경

운영 DB·Google 로그인 없이 "카드 만들기 → 발행 → 초대장 열람 → RSVP → 응답 현황"을 끝까지 돌려 보는 방법.

## 준비 (한 번만)
1. 로컬 Postgres 에 테스트 DB 생성: `createdb dearday_e2e`
2. `.env.local` (저장소에 올라가지 않음)
   ```
   DATABASE_URL=postgresql://<로컬사용자>@localhost:5432/dearday_e2e?sslmode=disable
   NEXTAUTH_SECRET=<openssl rand -hex 32 로 만든 테스트 값>
   NEXTAUTH_URL=http://localhost:3002
   ```
   - `sslmode=disable` 이 있어야 한다 — `src/lib/db.ts` 가 SSL 을 켜 두는데 로컬 Postgres 는 SSL 이 없다
3. 스키마: `DATABASE_URL=<위 값> node scripts/migrate.js`
   - **반드시 DATABASE_URL 을 지정하고 실행.** 지정하지 않으면 스크립트에 적힌 기본 주소로 접속한다

## 테스트 로그인
Google 로그인 대신 테스트 세션 쿠키를 쓴다 (로컬 전용, `NEXTAUTH_SECRET` 이 테스트 값일 때만 유효).
1. `dearday_user` 에 테스트 사용자 한 명 추가 (provider='google', provider_id 임의)
2. `next-auth/jwt` 의 `encode({ token: { name, email, sub, uid: <사용자 id> }, secret })` 로 토큰 생성
3. 브라우저에 `next-auth.session-token` 쿠키로 설정 (domain localhost)

## 확인한 흐름 (2026-11-22)
- 홈 → 행사 선택 → 템플릿 선택 → 문구 편집(추천 문구) → 발행
- 받는 사람: 봉투 열기 → 카드 → 참석/불참 응답
- 주최자: 내 카드의 응답 통계, 수신자 관리, 리마인더

## 이 테스트로 찾아 고친 것
- RSVP 저장 실패: 마이그레이션에 `adult_count`·`child_count` 컬럼 누락 → 추가
- 손님 화면에 DB 오류 문구 노출 → 일반 안내 문구로
- 내 카드 페이지 하이드레이션 오류(날짜 표기 언어·시간대 불일치)
- 샘플 행사 날짜가 과거로 고정 → 오늘 기준 미래 날짜
- 편집 화면: 토글 손잡이 위치, 번호 배지가 상단 헤더를 덮는 문제
- RSVP 버튼 34px → 44px, 응답 후 무엇으로 답했는지 표시
