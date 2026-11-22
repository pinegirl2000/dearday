'use client';

import { Bell, Mail, BellOff } from 'lucide-react';
import { buildReminderEmail, buildReminderPush, reminderChannels, reminderSchedule, SEND_HOUR_SG, type ReminderLocale } from '@/lib/reminder-message';

interface Props {
  personName: string;
  occasion: string;
  occasionLabel: string;
  month: number;
  day: number;
  notifyDaysBefore: number;
  locale: ReminderLocale;
  emailOptIn: boolean;
  pushSubscribed: boolean;
}

/** 미리보기에서 이름을 아직 안 적었을 때 보여 줄 자리표시 이름 */
const PLACEHOLDER_NAME: Record<ReminderLocale, string> = { en: 'Mom', ko: '엄마' };

/** 이메일 미리보기 높이(px) — 실제 메일 본문(480px 폭)을 축소해 보여 주므로 고정 */
const EMAIL_FRAME_HEIGHT = 420;

/**
 * 등록 전에 "언제, 어떤 알림이 오는지" 보여 주는 미리보기.
 * 실제 발송(cron)과 같은 함수(reminder-message.ts)로 문구·발송일을 만들기 때문에 보이는 그대로 간다.
 * 리마인더는 등록한 본인에게만 오며 상대방에게 카드를 보내지 않는다는 점도 여기서 분명히 한다.
 */
export default function ReminderPreview(p: Props) {
  const name = p.personName.trim() || PLACEHOLDER_NAME[p.locale];
  const schedule = reminderSchedule({ month: p.month, day: p.day, notifyDaysBefore: p.notifyDaysBefore });
  const input = { locale: p.locale, personName: name, occasion: p.occasion, occasionLabel: p.occasionLabel, daysAway: schedule.daysAwayAtSend };
  const email = buildReminderEmail(input);
  const push = buildReminderPush(input);
  // 이메일 주소 유무는 화면에서 알 수 없지만 로그인 계정에는 항상 있으므로 동의 여부로만 판단
  const channels = reminderChannels({ emailOptIn: p.emailOptIn, hasEmail: true, pushSubscribed: p.pushSubscribed });
  const ko = p.locale === 'ko';

  const sendOn = schedule.sendDate.toLocaleDateString(ko ? 'ko-KR' : 'en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const sendTime = `${SEND_HOUR_SG}${ko ? '시' : ':00 AM'}`;

  return (
    <section aria-label={ko ? '받게 될 알림 미리보기' : 'Preview of your reminder'} className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-hydrangea-700">{ko ? '이렇게 알려 드려요' : "Here's what you'll get"}</h4>
        <p className="text-xs text-hydrangea-500 mt-0.5 leading-relaxed">
          {ko
            ? <><strong className="text-hydrangea-700">{sendOn} {sendTime}</strong>에 본인에게 알림이 와요. 상대방에게는 아무것도 보내지 않아요.</>
            : <>Sent to you on <strong className="text-hydrangea-700">{sendOn} at {sendTime}</strong> (Singapore time). Nothing is sent to {name}.</>}
        </p>
      </div>

      {!channels.email && !channels.push && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <BellOff className="w-4 h-4 flex-shrink-0 mt-px" aria-hidden />
          <span>{ko ? '이메일과 푸시 알림이 모두 꺼져 있어 이 리마인더는 오지 않아요. 위에서 하나를 켜 주세요.' : 'Email and push are both off, so this reminder will not reach you. Turn one on above.'}</span>
        </div>
      )}

      {channels.push && (
        <div>
          <p className="text-[11px] font-medium text-hydrangea-500 mb-1 flex items-center gap-1"><Bell className="w-3 h-3" aria-hidden />{ko ? '휴대폰 알림' : 'Phone notification'}</p>
          <div className="flex items-start gap-2.5 rounded-2xl bg-white/90 border border-hydrangea-100 shadow-sm px-3 py-2.5">
            <span className="w-8 h-8 rounded-lg bg-hydrangea-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden>DD</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-hydrangea-800 leading-snug">{push.title}</p>
              <p className="text-xs text-hydrangea-500">{push.body}</p>
            </div>
          </div>
        </div>
      )}

      {channels.email && (
        <div>
          <p className="text-[11px] font-medium text-hydrangea-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" aria-hidden />{ko ? '이메일' : 'Email'}</p>
          <div className="rounded-2xl border border-hydrangea-100 overflow-hidden bg-white">
            <div className="px-3 py-2 border-b border-hydrangea-100 text-xs">
              <p className="text-hydrangea-500">DearDay &lt;reminders@dearday.sg&gt;</p>
              <p className="font-semibold text-hydrangea-800 truncate">{email.subject}</p>
            </div>
            {/* 실제 발송 HTML 을 그대로 — sandbox(스크립트·링크 이동 차단)로 안전하게 표시 */}
            <iframe
              title={ko ? '이메일 미리보기' : 'Email preview'}
              srcDoc={email.html}
              sandbox=""
              className="w-full block pointer-events-none"
              style={{ height: EMAIL_FRAME_HEIGHT, border: 0 }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
