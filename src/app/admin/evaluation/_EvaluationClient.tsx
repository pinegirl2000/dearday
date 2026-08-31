'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { createEvaluation, deleteEvaluation, type Evaluation } from '@/lib/actions/evaluation';
import { useRouter } from 'next/navigation';

const AGENTS = [
  { key: 'perfectionist' as const, label: '🔍 Perfectionist Critic',  desc: 'UX/UI · 완성도 (Unlighthouse 자동)',     color: 'from-purple-100 to-purple-50' },
  { key: 'compliance'    as const, label: '🛡️ Compliance Guardian',   desc: 'PDPA · 개인정보 · 신뢰 (manual/LLM)',    color: 'from-blue-100 to-blue-50' },
  { key: 'mz'            as const, label: '✨ MZ Trend Hunter',        desc: '트렌드 · 바이럴 · 심미성 + Data-Driven Emotion (Nudge · 톤 분석)', color: 'from-pink-100 to-pink-50' },
  { key: 'tech'          as const, label: '🔧 Tech & Security',        desc: '코드 · 보안 (Semgrep 자동)',             color: 'from-emerald-100 to-emerald-50' }
];

// MZ agent의 Data-Driven Emotion 하위 평가 가이드 — notes 작성 시 구조 잡기
const MZ_EMOTION_TEMPLATE = `[Data-Driven Emotion 평가]
1. 색상·톤 분석: RSVP/CTA 버튼 색상이 MZ 선호 트렌드 대비 (보수/적절/공격적) 한가?
2. Nudge 지표: 클릭 유도 성능 (밝기/대비/saturation) 수치
3. 정서적 fit: 이벤트 무드 ↔ 디자인 톤 일치도
4. 개선 제안: 예 "디자인 톤을 1.2단계 밝게 조정"

[일반 MZ 트렌드 — 바이럴·심미성]
- `;

function scoreColor(s: number) {
  if (s >= 90) return 'text-emerald-600';
  if (s >= 70) return 'text-amber-600';
  if (s >= 50) return 'text-orange-600';
  return 'text-rose-600';
}
function scoreBg(s: number) {
  if (s >= 90) return 'bg-emerald-500';
  if (s >= 70) return 'bg-amber-500';
  if (s >= 50) return 'bg-orange-500';
  return 'bg-rose-500';
}

function diffArrow(curr: number, prev: number | undefined) {
  if (prev === undefined) return null;
  const d = curr - prev;
  if (d > 0) return { icon: TrendingUp, color: 'text-emerald-600', text: `+${d}` };
  if (d < 0) return { icon: TrendingDown, color: 'text-rose-600', text: `${d}` };
  return { icon: Minus, color: 'text-hydrangea-400', text: '0' };
}

interface Props {
  initial: Evaluation[];
}

export default function EvaluationClient({ initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  // 새 평가 form
  const [addOpen, setAddOpen] = useState(false);
  const [scores, setScores] = useState({ perfectionist: 70, compliance: 70, mz: 70, tech: 70 });
  const [notes, setNotes] = useState({ perfectionist: '', compliance: '', mz: '', tech: '' });
  const [summary, setSummary] = useState('');
  const [recs, setRecs] = useState('');

  const latest = items[0];
  const previous = items[1];

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await createEvaluation({
        perfectionist_score: scores.perfectionist,
        compliance_score: scores.compliance,
        mz_score: scores.mz,
        tech_score: scores.tech,
        perfectionist_notes: notes.perfectionist,
        compliance_notes: notes.compliance,
        mz_notes: notes.mz,
        tech_notes: notes.tech,
        summary,
        ai_recommendations: recs
      });
      if (!res.ok) { toast.error(res.error || 'Failed'); return; }
      toast.success('Evaluation logged');
      setAddOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this evaluation?')) return;
    startTransition(async () => {
      const res = await deleteEvaluation(id);
      if (!res.ok) { toast.error(res.error || 'Failed'); return; }
      setItems((xs) => xs.filter((x) => x.id !== id));
    });
  };

  return (
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
      {/* 최신 평가 — 4 score 카드 */}
      {latest && (
        <div className="rounded-2xl bg-gradient-to-br from-white to-hydrangea-50/40 border border-hydrangea-200 p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-hydrangea-700">Latest evaluation</h2>
              <p className="text-[10px] text-hydrangea-400">{new Date(latest.evaluated_at).toLocaleString()} · {latest.evaluated_by}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-extrabold ${scoreColor(latest.total_score)}`}>
                {latest.total_score}<span className="text-base font-medium text-hydrangea-400">/100</span>
              </div>
              <div className="text-[10px] text-hydrangea-400">Weighted total</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AGENTS.map((a) => {
              const score = (latest as any)[`${a.key}_score`] as number;
              const noteText = (latest as any)[`${a.key}_notes`] as string | null;
              const prevScore = previous ? ((previous as any)[`${a.key}_score`] as number) : undefined;
              const diff = diffArrow(score, prevScore);
              return (
                <div key={a.key} className={`rounded-xl bg-gradient-to-br ${a.color} border border-white p-3`}>
                  <div className="text-[10px] font-semibold text-hydrangea-700 mb-0.5">{a.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-extrabold ${scoreColor(score)}`}>{score}</span>
                    <span className="text-[10px] text-hydrangea-400">/100</span>
                    {diff && (
                      <span className={`text-[10px] font-semibold ${diff.color} ml-auto inline-flex items-center gap-0.5`}>
                        <diff.icon className="w-3 h-3" /> {diff.text}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${scoreBg(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  {noteText && (
                    <p className="mt-1.5 text-[9px] text-hydrangea-500 leading-snug line-clamp-2">{noteText}</p>
                  )}
                </div>
              );
            })}
          </div>
          {latest.summary && (
            <div className="mt-3 p-2 rounded-lg bg-white/70 text-[11px] text-hydrangea-600 leading-relaxed">
              <span className="font-semibold">Summary:</span> {latest.summary}
            </div>
          )}
          {latest.ai_recommendations && (
            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
              <span className="font-semibold">100점 가는 길:</span> {latest.ai_recommendations}
            </div>
          )}
        </div>
      )}

      {/* Add manual evaluation */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold text-hydrangea-700">History ({items.length})</h3>
          <button
            type="button"
            onClick={() => setAddOpen(!addOpen)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-hydrangea-500 text-white text-xs font-medium active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add manual evaluation
          </button>
        </div>

        {addOpen && (
          <div className="rounded-2xl bg-white border border-hydrangea-200 p-4 mb-3 space-y-3">
            {AGENTS.map((a) => (
              <div key={a.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-hydrangea-700">{a.label}</label>
                  <span className={`text-sm font-bold ${scoreColor(scores[a.key])}`}>{scores[a.key]}/100</span>
                </div>
                <div className="text-[10px] text-hydrangea-400 mb-1">{a.desc}</div>
                <input
                  type="range" min={0} max={100}
                  value={scores[a.key]}
                  onChange={(e) => setScores((s) => ({ ...s, [a.key]: Number(e.target.value) }))}
                  className="w-full accent-hydrangea-500"
                />
                {a.key === 'mz' && !notes.mz && (
                  <button
                    type="button"
                    onClick={() => setNotes((n) => ({ ...n, mz: MZ_EMOTION_TEMPLATE }))}
                    className="mt-1 text-[10px] text-hydrangea-500 underline decoration-dotted hover:text-hydrangea-700"
                  >
                    📊 Data-Driven Emotion 템플릿 삽입
                  </button>
                )}
                <textarea
                  placeholder={a.key === 'mz'
                    ? '[Data-Driven Emotion] RSVP/CTA 톤 분석, Nudge 지표, 개선 제안 ...'
                    : 'Notes / observations...'}
                  value={notes[a.key]}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.key]: e.target.value }))}
                  rows={a.key === 'mz' ? 6 : 2}
                  className="mt-1 w-full px-2 py-1.5 rounded-md border border-hydrangea-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-hydrangea-300 font-mono"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 rounded-md border border-hydrangea-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-hydrangea-700 mb-1">100점으로 가는 길</label>
              <textarea
                value={recs}
                onChange={(e) => setRecs(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 rounded-md border border-hydrangea-200 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 py-2 rounded-lg border border-hydrangea-200 text-hydrangea-600 text-sm"
              >Cancel</button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className="flex-1 py-2 rounded-lg bg-hydrangea-500 text-white text-sm font-semibold disabled:opacity-60"
              >{pending ? 'Saving…' : 'Save evaluation'}</button>
            </div>
          </div>
        )}

        {/* History list */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-hydrangea-400">No evaluations yet.</div>
        ) : (
          <div className="space-y-1.5">
            {items.map((ev) => (
              <div key={ev.id} className="rounded-lg bg-white border border-hydrangea-100 p-2.5 flex items-center gap-2 text-xs">
                <div className={`w-10 text-center font-bold ${scoreColor(ev.total_score)}`}>{ev.total_score}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-hydrangea-700 truncate">{new Date(ev.evaluated_at).toLocaleString()}</div>
                  <div className="text-[10px] text-hydrangea-400 truncate">
                    P:{ev.perfectionist_score} · C:{ev.compliance_score} · M:{ev.mz_score} · T:{ev.tech_score} · by {ev.evaluated_by}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
                  className="text-hydrangea-300 hover:text-rose-500 p-1"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="rounded-xl bg-hydrangea-50/40 border border-hydrangea-100 p-3 text-[11px] text-hydrangea-500 leading-relaxed">
        <p className="font-semibold mb-1 text-hydrangea-700">📊 자동 평가 설정</p>
        <p>GitHub Action <code>.github/workflows/daily-evaluation.yml</code>이 매일 01:00 SGT에:</p>
        <ul className="list-disc ml-5 mt-1 space-y-0.5">
          <li><strong>Unlighthouse</strong> → Perfectionist 점수 (Perf/A11y/SEO/BP 평균)</li>
          <li><strong>Semgrep</strong> → Tech 점수 (errors×5 + warnings×1 감점)</li>
          <li>Compliance · MZ 점수는 가장 최근 manual 값 재사용</li>
        </ul>
        <p className="mt-2">GitHub repo secrets에 <code>EVAL_SUBMIT_SECRET</code> 추가 필요. 가중치는 4 영역 각 25%.</p>
      </div>
    </div>
  );
}
