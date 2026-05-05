'use client';

import { useState } from 'react';
import { ClassicEnvelope, EnvelopeBeige, EnvelopeMint, EnvelopeCoral, NoneEnvelope } from '@/components/envelopes';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BaseCard, BackgroundId, EnvelopeAnimId } from '@/types/card';

interface PairSet {
  key: string;
  label: string;        // "Wedding · Romantic"
  description: string;  // 짧은 설명
  envelopeId: EnvelopeAnimId;
  EnvelopeComponent: React.ComponentType<any>;
  bg_id: BackgroundId;
  card: Partial<BaseCard>;
  highlight?: boolean;
}

const SETS: PairSet[] = [
  {
    key: 'purple-set',
    label: 'Wedding · Romantic',
    description: 'Classic lavender — timeless and elegant',
    envelopeId: 'envelope-1',
    EnvelopeComponent: ClassicEnvelope,
    bg_id: 'bg-1',
    highlight: true,
    card: {
      title: '민준 ♥ 서연',
      greeting_oneliner: '두 사람의 새로운 시작',
      body: '오랜 시간 함께 걸어온\n두 사람이 부부가 됩니다.\n축복해주세요.',
      event_date: '2026-06-14T11:00:00.000Z',
      event_place: '서울 그랜드 호텔'
    }
  },
  {
    key: 'beige-set',
    label: 'Baptism · Warm',
    description: 'Cream beige — gentle and reverent',
    envelopeId: 'envelope-2',
    EnvelopeComponent: EnvelopeBeige,
    bg_id: 'bg-2',
    card: {
      title: '하준 세례식',
      greeting_oneliner: '귀한 자녀의 첫 걸음',
      body: '하나님의 자녀로\n새 이름을 받는 날\n함께해주세요.',
      event_date: '2026-05-03T10:30:00.000Z',
      event_place: '평강교회 본당'
    }
  },
  {
    key: 'mint-set',
    label: 'Spring · Casual',
    description: 'Soft mint — fresh and breezy',
    envelopeId: 'envelope-3',
    EnvelopeComponent: EnvelopeMint,
    bg_id: 'bg-3',
    card: {
      title: '봄날의 모임',
      greeting_oneliner: '오랜만에 함께',
      body: '새로 핀 꽃처럼\n반갑게 만나요.',
      event_date: '2026-04-12T14:00:00.000Z',
      event_place: '한강공원 잔디광장'
    }
  },
  {
    key: 'coral-set',
    label: 'Birthday · Lively',
    description: 'Light coral — joyful and bright',
    envelopeId: 'envelope-4',
    EnvelopeComponent: EnvelopeCoral,
    bg_id: 'bg-4',
    card: {
      title: '소율의 첫 생일',
      greeting_oneliner: '아기의 첫 1년',
      body: '소중한 첫 생일을\n함께 축하해주세요.',
      event_date: '2026-07-05T12:00:00.000Z',
      event_place: '리츠칼튼 그랜드볼룸'
    }
  },
  {
    key: 'watercolor-set',
    label: 'Special · Watercolor',
    description: 'Hand-painted background with classic envelope',
    envelopeId: 'envelope-1',
    EnvelopeComponent: ClassicEnvelope,
    bg_id: 'bg-img-1',
    card: {
      title: 'Opening Ceremony',
      greeting_oneliner: '새로운 공간을 엽니다',
      body: '오랜 준비의 결실을\n함께 나누고 싶습니다.',
      event_date: '2026-09-20T17:00:00.000Z',
      event_place: '강남 라운지'
    }
  }
];

function buildPreviewCard(set: PairSet): BaseCard {
  return {
    id: 'preview',
    slug: 'preview',
    event_type: 'etc',
    layout_id: 'layout-classic',
    envelope_anim: set.envelopeId,
    bg_id: set.bg_id,
    theme: 'hydrangea',
    font_family: 'serif',
    title: set.card.title || '',
    greeting_oneliner: set.card.greeting_oneliner,
    body: set.card.body,
    event_date: set.card.event_date,
    event_place: set.card.event_place,
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default function EnvelopesDemoPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f3fb] to-[#ece2f5] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-serif text-[#4a3570]">Template Preview</h1>
          <p className="mt-2 text-neutral-500 text-sm">Recommended envelope &amp; card pairings — click an envelope to open</p>
          <p className="mt-1 text-neutral-400 text-xs">You can also mix &amp; match envelope and background colors freely in the editor.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SETS.map((set) => {
            const isOpen = !!open[set.key];
            const card = buildPreviewCard(set);
            return (
              <section
                key={set.key}
                className={`bg-white/70 backdrop-blur rounded-2xl p-5 shadow-sm ${set.highlight ? 'ring-2 ring-[#7B5EA7]/40' : ''}`}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#7B5EA7]/10 text-[10px] font-semibold text-[#4a3570] tracking-wide uppercase">
                      {set.highlight ? '⭐ Recommended' : 'Recommended'}
                    </span>
                    <h2 className="font-serif text-lg text-[#4a3570] mt-1">{set.label}</h2>
                    <p className="text-xs text-neutral-500">{set.description}</p>
                  </div>
                </div>

                {/* 봉투 */}
                <div className="flex justify-center min-h-[200px] items-end mb-4">
                  <div onClick={() => toggle(set.key)} className="cursor-pointer active:scale-95 transition">
                    <set.EnvelopeComponent isOpen={isOpen} width={200}>
                      <div className="text-center">
                        <p className="font-serif text-base text-neutral-700">{set.card.title}</p>
                      </div>
                    </set.EnvelopeComponent>
                  </div>
                </div>

                {/* 카드 미리보기 */}
                <div className="mt-2">
                  <p className="text-[10px] text-neutral-400 text-center mb-2 uppercase tracking-widest">— Card —</p>
                  <TemplateCard card={card} recipientName="John" />
                </div>
              </section>
            );
          })}

          {/* None 봉투: 카드만 */}
          <section className="bg-white/70 backdrop-blur rounded-2xl p-5 shadow-sm">
            <div className="mb-3">
              <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-600 tracking-wide uppercase">
                Minimal
              </span>
              <h2 className="font-serif text-lg text-[#4a3570] mt-1">No envelope</h2>
              <p className="text-xs text-neutral-500">Show the card directly — quick &amp; simple</p>
            </div>
            <div className="mt-4">
              <TemplateCard
                card={buildPreviewCard({
                  ...SETS[0],
                  envelopeId: 'none',
                  EnvelopeComponent: NoneEnvelope,
                  bg_id: 'bg-1',
                  card: {
                    title: '간편 모임',
                    greeting_oneliner: 'Quick & simple',
                    body: '봉투 없이\n바로 펼쳐지는 미니멀.',
                    event_date: '2026-08-10T18:00:00.000Z',
                    event_place: 'Cafe Round'
                  }
                })}
                recipientName="John"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
