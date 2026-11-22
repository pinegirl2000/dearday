import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 순수 모듈(글꼴 키·스타일 병합·맞춤 계산) 단위 테스트용 — DOM·DB 없이 node 환경에서 실행
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
