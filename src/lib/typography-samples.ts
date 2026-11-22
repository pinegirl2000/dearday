/**
 * 글자 넘침 확인용 테스트 제목 — 관리자 글꼴 편집기 미리보기와 개발용 QA 페이지가 같은 문구를 쓰도록 공유.
 * 짧은 영문(기본 모양) / 긴 영문(자동 맞춤·줄바꿈) / 한글(대체 글꼴·keep-all) 세 경우를 본다.
 */
export const TYPOGRAPHY_SAMPLE_TITLES = {
  short: 'Spring Gathering',
  longLatin: 'Spring Garden Gathering Party',
  korean: '우리 가족 봄나들이 모임'
} as const;

export type SampleTitleKey = keyof typeof TYPOGRAPHY_SAMPLE_TITLES;
