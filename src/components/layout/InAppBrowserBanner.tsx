'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

/**
 * 카카오톡/인스타그램/페이스북 등 in-app webview에서 진입 시 외부 브라우저 열기 안내.
 * Google OAuth가 'disallowed_useragent' (403)으로 차단되기 때문.
 *
 * - Android: intent:// 스킴으로 Chrome 직접 열기 시도
 * - iOS: 시스템 share 안내 (자동 강제 불가)
 * - 한 번 닫으면 sessionStorage에 기록 → 같은 세션에서 재표시 X
 */

function detectInAppBrowser(): { isInApp: boolean; appKey: string | null; isAndroid: boolean; isIOS: boolean } {
  if (typeof navigator === 'undefined') return { isInApp: false, appKey: null, isAndroid: false, isIOS: false };
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  let appKey: string | null = null;
  if (/KAKAOTALK/i.test(ua)) appKey = 'kakao';
  else if (/Instagram/i.test(ua)) appKey = 'instagram';
  else if (/FBAN|FBAV/i.test(ua)) appKey = 'facebook';
  else if (/Line\//i.test(ua)) appKey = 'line';
  else if (/NAVER/i.test(ua)) appKey = 'naver';
  else if (/MicroMessenger/i.test(ua)) appKey = 'wechat';
  return { isInApp: !!appKey, appKey, isAndroid, isIOS };
}

export default function InAppBrowserBanner() {
  const t = useTranslations('InAppBrowser');
  const [info, setInfo] = useState<{ isInApp: boolean; appKey: string | null; isAndroid: boolean; isIOS: boolean }>({
    isInApp: false, appKey: null, isAndroid: false, isIOS: false
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInfo(detectInAppBrowser());
    if (typeof window !== 'undefined' && sessionStorage.getItem('dearday:inapp-dismissed') === '1') {
      setDismissed(true);
    }
  }, []);

  const openExternal = () => {
    const currentUrl = window.location.href;
    if (info.isAndroid) {
      // Chrome으로 강제 열기
      const intentUrl = currentUrl.replace(/^https?:\/\//, '').split('?')[0];
      const params = currentUrl.includes('?') ? currentUrl.split('?')[1] : '';
      const intent = `intent://${intentUrl}${params ? `?${params}` : ''}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intent;
    } else if (info.isIOS) {
      // iOS는 webview에서 강제 외부 브라우저 호출 불가 — 안내 토스트
      navigator.clipboard?.writeText(currentUrl).catch(() => {});
      toast.message(t('copiedForSafari'), { duration: 6000 });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dearday:inapp-dismissed', '1');
    }
  };

  if (!info.isInApp || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-50 border-b border-amber-300 px-3 py-2.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-amber-900 leading-snug">
            {t('blocked', { app: info.appKey ? t(info.appKey) : '' })}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5 leading-snug">
            {info.isAndroid
              ? t('openInChrome')
              : info.isIOS
                ? t('openInSafari')
                : t('openExternal')}
          </div>
          {(info.isAndroid || info.isIOS) && (
            <button
              type="button"
              onClick={openExternal}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 active:scale-95 transition"
            >
              <ExternalLink className="w-3 h-3" />
              {info.isAndroid ? t('openChromeBtn') : t('copyForSafari')}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('closeAria')}
          className="flex-shrink-0 p-1 rounded text-amber-700 hover:bg-amber-100 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
