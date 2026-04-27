// 이미지 클라이언트 압축 + 업로드 유틸
import imageCompression from 'browser-image-compression';

export const IMAGE_LIMITS = {
  background: {
    maxSizeMB: 0.5,            // 500KB
    maxWidthOrHeight: 1440,
    fileType: 'image/webp' as const,
    initialQuality: 0.85
  },
  attachment: {
    maxSizeMB: 0.1,            // 100KB
    maxWidthOrHeight: 1080,
    fileType: 'image/webp' as const,
    initialQuality: 0.75
  }
} as const;

export type ImageKind = keyof typeof IMAGE_LIMITS;

const ALLOWED_INPUT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function compressImage(file: File, kind: ImageKind): Promise<File> {
  if (!ALLOWED_INPUT.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    throw new Error('지원되지 않는 이미지 형식입니다. (JPG, PNG, WebP, HEIC만 가능)');
  }
  const opts = IMAGE_LIMITS[kind];
  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    fileType: opts.fileType,
    initialQuality: opts.initialQuality,
    useWebWorker: true
  });

  // 안전망: 압축 후에도 한도 초과면 에러
  if (compressed.size > opts.maxSizeMB * 1024 * 1024) {
    throw new Error(
      `이미지가 너무 큽니다 (${(compressed.size / 1024).toFixed(0)}KB). 최대 ${opts.maxSizeMB * 1024}KB까지 가능합니다.`
    );
  }
  return compressed;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}
