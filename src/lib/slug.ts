import { customAlphabet } from 'nanoid';

// URL-safe, lowercase, no ambiguous characters
const nano = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 8);

export function generateSlug(): string {
  return nano();
}

export function generateOwnerToken(): string {
  return customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32)();
}

// 수신자별 비공개 토큰 — URL에 노출되며 추측 불가해야 함
const recipientNano = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 6);
export function generateRecipientToken(): string {
  return recipientNano();
}
