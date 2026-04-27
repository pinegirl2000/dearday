import { customAlphabet } from 'nanoid';

// URL-safe, lowercase, no ambiguous characters
const nano = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 8);

export function generateSlug(): string {
  return nano();
}

export function generateOwnerToken(): string {
  return customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32)();
}
