'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/config';
import { setLocaleAction } from '@/lib/actions/setLocale';

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // 🔧 키보드 사용자가 메뉴를 닫을 수 있도록 Escape 지원 (열렸을 때만 리스너 등록)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (l: Locale) => {
    setOpen(false);
    if (l === current) return;
    startTransition(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 h-10 px-2.5 rounded-full text-xs font-medium text-hydrangea-600 hover:bg-hydrangea-50 active:bg-hydrangea-100 transition disabled:opacity-50"
        disabled={pending}
        aria-label="언어 / Language"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5" />
        {!compact && <span>{LOCALE_NAMES[current]}</span>}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute top-full right-0 mt-1 z-50 bg-white border border-hydrangea-100 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            {LOCALES.map((l) => (
              <button
                key={l}
                role="menuitemradio"
                aria-checked={current === l}
                onClick={() => handleSelect(l)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-hydrangea-50 ${current === l ? 'text-hydrangea-700 font-medium' : 'text-hydrangea-600'}`}
              >
                {LOCALE_NAMES[l]}
                {current === l && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
