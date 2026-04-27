'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, formatBytes, type ImageKind } from '@/lib/image';

interface Props {
  kind: ImageKind;
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}

export function ImageUploader({ kind, value, onChange, label, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewSize, setPreviewSize] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, kind);
      setPreviewSize(compressed.size);

      const form = new FormData();
      form.append('file', compressed);
      form.append('kind', kind);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '업로드 실패');

      onChange(json.url);
      toast.success('이미지가 업로드되었어요');
    } catch (e: any) {
      toast.error(e.message || '업로드 중 오류');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewSize(null);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">{label}</label>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleSelect} className="hidden" />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-hydrangea-100">
          <img src={value} alt="" className="w-full h-40 object-cover" />
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
            aria-label="제거"
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
          {previewSize && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] text-white">
              {formatBytes(previewSize)}
            </span>
          )}
        </div>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 rounded-2xl border-2 border-dashed border-hydrangea-200 bg-hydrangea-50/50 flex flex-col items-center justify-center gap-2 text-hydrangea-400 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">업로드 중...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">이미지 선택</span>
              <span className="text-xs">JPG · PNG · WebP</span>
            </>
          )}
        </motion.button>
      )}

      {hint && <p className="text-xs text-hydrangea-400 mt-1">{hint}</p>}
    </div>
  );
}

interface MultiProps {
  onChange: (urls: string[]) => void;
  value: string[];
  max?: number;
}

export function MultiImageUploader({ onChange, value, max = 9 }: MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    if (value.length + files.length > max) {
      toast.error(`최대 ${max}장까지 업로드 가능합니다`);
      return;
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const f of Array.from(files)) {
        const compressed = await compressImage(f, 'attachment');
        const form = new FormData();
        form.append('file', compressed);
        form.append('kind', 'attachment');
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || '업로드 실패');
        newUrls.push(json.url);
      }
      onChange([...value, ...newUrls]);
      toast.success(`${newUrls.length}장 업로드 완료`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />

      <div className="grid grid-cols-3 gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative aspect-square rounded-xl overflow-hidden border border-hydrangea-100">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
              aria-label="제거"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-hydrangea-200 bg-hydrangea-50/50 flex flex-col items-center justify-center text-hydrangea-400 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            <span className="text-[10px] mt-1">{uploading ? '업로드' : `${value.length}/${max}`}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
