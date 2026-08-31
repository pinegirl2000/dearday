'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, BellRing, Plus, Trash2, Mail, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  createReminder,
  deleteReminder,
  setReminderEmailOptIn,
  setReminderLocale,
  savePushSubscription,
  removePushSubscription,
  type Reminder
} from '@/lib/actions/reminders';

// VAPID 공개 키 (env에서 받아옴) — base64url → Uint8Array 변환 헬퍼
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const OCCASIONS = [
  { id: 'birthday',         emoji: '🎂', label: 'Birthday' },
  { id: 'mothers-day',      emoji: '💝', label: "Mother's Day" },
  { id: 'fathers-day',      emoji: '💙', label: "Father's Day" },
  { id: 'wedding-anniversary', emoji: '💑', label: 'Wedding Anniversary' },
  { id: 'graduation',       emoji: '🎓', label: 'Graduation' },
  { id: 'other',            emoji: '📅', label: 'Other (custom)' }
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysUntil(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  const nextYear = new Date(now.getFullYear() + 1, month - 1, day);
  const target = thisYear >= today ? thisYear : nextYear;
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

interface Props {
  initialReminders: Reminder[];
  initialOptIn: { email: boolean; pushSubscribed: boolean; locale: 'en' | 'ko' };
}

export default function RemindersClient({ initialReminders, initialOptIn }: Props) {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [emailOptIn, setEmailOptIn] = useState(initialOptIn.email);
  const [pushOn, setPushOn] = useState(initialOptIn.pushSubscribed);
  const [locale, setLocaleState] = useState<'en' | 'ko'>(initialOptIn.locale);
  const [pending, startTransition] = useTransition();
  const [pushBusy, setPushBusy] = useState(false);

  const handleTogglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      // 권한·SW 지원 체크
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('This browser does not support push notifications');
        return;
      }
      const vapidPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPub) {
        toast.error('Push not configured');
        return;
      }

      if (pushOn) {
        // 구독 해제
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await removePushSubscription();
        setPushOn(false);
        toast.success('Push notifications off');
      } else {
        // 권한 요청
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toast.error('Notification permission denied');
          return;
        }
        // SW 등록
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        // 푸시 구독
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPub) as BufferSource
        });
        const res = await savePushSubscription(sub.toJSON());
        if (!res.ok) {
          toast.error(res.error || 'Failed to save');
          await sub.unsubscribe();
          return;
        }
        setPushOn(true);
        toast.success('Push notifications on');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Push setup failed');
    } finally {
      setPushBusy(false);
    }
  };

  const handleLocaleChange = (next: 'en' | 'ko') => {
    setLocaleState(next);
    startTransition(async () => {
      const res = await setReminderLocale(next);
      if (!res.ok) {
        toast.error(res.error || 'Failed');
        setLocaleState(locale);
      } else {
        toast.success(next === 'ko' ? '한국어로 발송됩니다' : 'English email selected');
      }
    });
  };

  // 새 reminder 입력
  const [addOpen, setAddOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [occasion, setOccasion] = useState('birthday');
  const [occasionLabel, setOccasionLabel] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [day, setDay] = useState<number>(1);
  const [notifyDays, setNotifyDays] = useState<number>(7);

  const handleToggleEmail = (next: boolean) => {
    setEmailOptIn(next);
    startTransition(async () => {
      const res = await setReminderEmailOptIn(next);
      if (!res.ok) {
        toast.error(res.error || 'Failed to update');
        setEmailOptIn(!next);
      } else {
        toast.success(next ? 'Email reminders on' : 'Email reminders off');
      }
    });
  };

  const handleAdd = () => {
    if (!personName.trim()) { toast.error('Please enter a name'); return; }
    startTransition(async () => {
      const res = await createReminder({
        person_name: personName.trim(),
        occasion,
        occasion_label: occasion === 'other' ? occasionLabel.trim() : null,
        event_month: month,
        event_day: day,
        notify_days_before: notifyDays,
        email_enabled: true
      });
      if (!res.ok) { toast.error(res.error || 'Failed'); return; }
      toast.success('Reminder added');
      setPersonName('');
      setOccasionLabel('');
      setAddOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    startTransition(async () => {
      const res = await deleteReminder(id);
      if (!res.ok) { toast.error(res.error || 'Failed'); return; }
      setReminders((rs) => rs.filter((r) => r.id !== id));
      toast.success('Reminder deleted');
    });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 안내 + 이메일 opt-in */}
      <div className="rounded-2xl bg-gradient-to-br from-hydrangea-50 to-white border border-hydrangea-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-hydrangea-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-hydrangea-700 mb-1">Never miss a date</h2>
            <p className="text-xs text-hydrangea-500 leading-relaxed mb-3">
              Add birthdays, anniversaries, and special days. We'll email you a friendly reminder
              with a one-tap link to create a card.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => handleToggleEmail(e.target.checked)}
                className="w-4 h-4 rounded border-hydrangea-300 text-hydrangea-500 focus:ring-hydrangea-300"
              />
              <Mail className="w-3.5 h-3.5 text-hydrangea-500" />
              <span className="text-xs font-medium text-hydrangea-700">Email me reminders</span>
            </label>
            <button
              type="button"
              onClick={handleTogglePush}
              disabled={pushBusy}
              className="mt-1.5 flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`relative w-4 h-4 rounded border-2 flex items-center justify-center ${pushOn ? 'bg-hydrangea-500 border-hydrangea-500' : 'bg-white border-hydrangea-300'}`}>
                {pushOn && <span className="text-white text-[10px]">✓</span>}
              </span>
              <BellRing className="w-3.5 h-3.5 text-hydrangea-500" />
              <span className="text-xs font-medium text-hydrangea-700">Push notifications (browser)</span>
            </button>
            <p className="text-[10px] text-hydrangea-400 mt-1.5 leading-snug">
              Your reminders are private — only sent to you. You can turn off any time.
            </p>
            {/* 이메일 언어 선택 */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[10px] text-hydrangea-500">Email language:</span>
              <button
                type="button"
                onClick={() => handleLocaleChange('en')}
                className={`text-[10px] px-2 py-0.5 rounded-full transition active:scale-95 ${
                  locale === 'en' ? 'bg-hydrangea-500 text-white' : 'bg-white text-hydrangea-600 border border-hydrangea-200'
                }`}
              >English</button>
              <button
                type="button"
                onClick={() => handleLocaleChange('ko')}
                className={`text-[10px] px-2 py-0.5 rounded-full transition active:scale-95 ${
                  locale === 'ko' ? 'bg-hydrangea-500 text-white' : 'bg-white text-hydrangea-600 border border-hydrangea-200'
                }`}
              >한국어</button>
            </div>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold text-hydrangea-700">
            My reminders ({reminders.length})
          </h3>
          <button
            type="button"
            onClick={() => setAddOpen(!addOpen)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-hydrangea-500 text-white text-xs font-medium active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* 추가 폼 */}
        {addOpen && (
          <div className="rounded-2xl bg-white border border-hydrangea-200 p-4 mb-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">Who?</label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Mom, Sarah, friend's name"
                className="w-full px-3 py-2 rounded-xl border border-hydrangea-200 text-sm focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">Occasion</label>
              <div className="grid grid-cols-3 gap-1.5">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.id)}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-medium transition active:scale-95 ${
                      occasion === occ.id
                        ? 'bg-hydrangea-500 text-white'
                        : 'bg-hydrangea-50 text-hydrangea-700 hover:bg-hydrangea-100'
                    }`}
                  >
                    <span className="text-lg">{occ.emoji}</span>
                    <span className="text-[9px] leading-tight">{occ.label}</span>
                  </button>
                ))}
              </div>
              {occasion === 'other' && (
                <input
                  type="text"
                  value={occasionLabel}
                  onChange={(e) => setOccasionLabel(e.target.value)}
                  placeholder="e.g. Promotion, Anniversary..."
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-hydrangea-200 text-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">Date</label>
              <div className="flex gap-2">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl border border-hydrangea-200 text-sm"
                >
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-hydrangea-200 text-sm"
                >
                  {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">Remind me</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { v: 0,  l: 'Day of' },
                  { v: 1,  l: '1 day before' },
                  { v: 3,  l: '3 days before' },
                  { v: 7,  l: '1 week before' },
                  { v: 14, l: '2 weeks before' },
                  { v: 30, l: '1 month before' }
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setNotifyDays(opt.v)}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition active:scale-95 ${
                      notifyDays === opt.v
                        ? 'bg-hydrangea-500 text-white'
                        : 'bg-hydrangea-50 text-hydrangea-700 hover:bg-hydrangea-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-hydrangea-400 mt-1.5">
                D-30 추천 — 시즌 카드 미리 준비할 시간이 충분해요
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-hydrangea-200 text-hydrangea-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={pending}
                className="flex-1 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold disabled:opacity-60 active:scale-95 transition"
              >
                {pending ? 'Adding…' : 'Save reminder'}
              </button>
            </div>
          </div>
        )}

        {reminders.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-hydrangea-200 mb-3" />
            <p className="text-sm text-hydrangea-400">No reminders yet.</p>
            <p className="text-xs text-hydrangea-400 mt-1">Tap "Add" to register your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const daysAway = daysUntil(r.event_month, r.event_day);
              const occMeta = OCCASIONS.find((o) => o.id === r.occasion);
              const label = r.occasion === 'other' ? (r.occasion_label || 'Other') : (occMeta?.label || r.occasion);
              const emoji = occMeta?.emoji || '📅';
              const dateStr = `${MONTH_NAMES[r.event_month - 1]} ${r.event_day}`;
              return (
                <div key={r.id} className="rounded-xl bg-white border border-hydrangea-100 p-3 flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-hydrangea-700 truncate">
                      {r.person_name}'s {label}
                    </div>
                    <div className="text-[11px] text-hydrangea-500">
                      {dateStr} · {daysAway === 0 ? 'Today' : `in ${daysAway} ${daysAway === 1 ? 'day' : 'days'}`}
                    </div>
                  </div>
                  {daysAway <= 14 && (
                    <Link
                      href={`/cards/new?type=${r.occasion === 'other' ? 'etc' : r.occasion}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-hydrangea-500 text-white text-[10px] font-semibold active:scale-95 transition flex-shrink-0"
                    >
                      Make card <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="text-hydrangea-400 hover:text-red-500 p-1 active:scale-95 transition"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
