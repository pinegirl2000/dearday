'use client';

import { useState } from 'react';
import {
  ENVELOPE_ANIMS,
  ClassicEnvelope,
  EnvelopeBeige,
  EnvelopeMint,
  EnvelopeCoral,
  EnvelopeBlue,
  EnvelopeBlackGold,
  NoneEnvelope
} from '@/components/envelopes';

const ENVELOPE_MAP: Record<string, React.ComponentType<any>> = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'envelope-3': EnvelopeMint,
  'envelope-4': EnvelopeCoral,
  'envelope-5': EnvelopeBlue,
  'envelope-6': EnvelopeBlackGold,
  'none': NoneEnvelope
};

export default function EnvelopesAdminClient() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ENVELOPE_ANIMS.map((e) => {
        const Comp = ENVELOPE_MAP[e.id];
        const isOpen = openId === e.id;
        return (
          <div key={e.id} className="rounded-2xl border border-hydrangea-100 bg-white p-4">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-hydrangea-700">{e.name}</div>
                <div className="text-[11px] text-hydrangea-400">{e.recommend}</div>
              </div>
              <code className="text-[10px] font-mono text-hydrangea-400">{e.id}</code>
            </div>
            <p className="text-xs text-hydrangea-500 mb-3">{e.desc}</p>
            <div className="min-h-[200px] flex items-end justify-center bg-hydrangea-50/40 rounded-xl py-3">
              <div onClick={() => setOpenId(isOpen ? null : e.id)} className="cursor-pointer active:scale-95 transition">
                {Comp && (
                  <Comp isOpen={e.id === 'none' ? true : isOpen} width={180}>
                    <div className="text-center">
                      <p className="font-serif text-sm text-neutral-700">Sample Card</p>
                    </div>
                  </Comp>
                )}
              </div>
            </div>
            {e.id !== 'none' && (
              <p className="text-[10px] text-hydrangea-400 text-center mt-2">click to {isOpen ? 'close' : 'open'}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
