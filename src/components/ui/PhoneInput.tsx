'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CountryDef {
  code: string;       // ISO (sg, kr...)
  dial: string;       // +65
  flag: string;       // 🇸🇬
  name: string;
  groups: number[];   // [4, 4] → 0000-0000
  example: string;
}

const COUNTRIES: CountryDef[] = [
  { code: 'sg', dial: '+65', flag: '🇸🇬', name: 'Singapore', groups: [4, 4], example: '9123-4567' },
  { code: 'kr', dial: '+82', flag: '🇰🇷', name: 'Korea',     groups: [3, 4, 4], example: '010-1234-5678' },
  { code: 'us', dial: '+1',  flag: '🇺🇸', name: 'USA',       groups: [3, 3, 4], example: '212-555-0123' },
  { code: 'jp', dial: '+81', flag: '🇯🇵', name: 'Japan',     groups: [3, 4, 4], example: '090-1234-5678' },
  { code: 'cn', dial: '+86', flag: '🇨🇳', name: 'China',     groups: [3, 4, 4], example: '138-1234-5678' },
  { code: 'hk', dial: '+852',flag: '🇭🇰', name: 'Hong Kong', groups: [4, 4],   example: '5123-4567' },
  { code: 'tw', dial: '+886',flag: '🇹🇼', name: 'Taiwan',    groups: [4, 6],   example: '0912-345678' },
  { code: 'my', dial: '+60', flag: '🇲🇾', name: 'Malaysia',  groups: [3, 4, 4], example: '012-345-6789' },
  { code: 'th', dial: '+66', flag: '🇹🇭', name: 'Thailand',  groups: [3, 3, 4], example: '081-234-5678' },
  { code: 'vn', dial: '+84', flag: '🇻🇳', name: 'Vietnam',   groups: [3, 4, 4], example: '091-234-5678' },
  { code: 'id', dial: '+62', flag: '🇮🇩', name: 'Indonesia', groups: [3, 4, 4], example: '081-234-5678' },
  { code: 'ph', dial: '+63', flag: '🇵🇭', name: 'Philippines', groups: [3, 3, 4], example: '917-123-4567' },
  { code: 'au', dial: '+61', flag: '🇦🇺', name: 'Australia', groups: [3, 3, 3], example: '412-345-678' },
  { code: 'gb', dial: '+44', flag: '🇬🇧', name: 'UK',        groups: [4, 6],   example: '7700-900123' },
  { code: 'in', dial: '+91', flag: '🇮🇳', name: 'India',     groups: [5, 5],   example: '98765-43210' }
];

function formatNumber(digits: string, groups: number[]): string {
  const max = groups.reduce((a, b) => a + b, 0);
  const trimmed = digits.replace(/\D/g, '').slice(0, max);
  const parts: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= trimmed.length) break;
    parts.push(trimmed.slice(i, i + g));
    i += g;
  }
  return parts.join('-');
}

interface Props {
  value: string;
  onChange: (full: string) => void;
  label?: string;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, label }: Props) {
  // value 형태: "+65 9123-4567" 으로 저장
  const initial = value || '';
  const initialCountry = COUNTRIES.find((c) => initial.startsWith(c.dial)) || COUNTRIES[0];
  const [country, setCountry] = useState<CountryDef>(initialCountry);
  const [number, setNumber] = useState(() => initial.replace(initialCountry.dial, '').trim());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const formatted = formatNumber(number, country.groups);
    const full = formatted ? `${country.dial} ${formatted}` : '';
    if (full !== value) onChange(full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number, country]);

  return (
    <div className="w-full relative">
      {label && <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">{label}</label>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-h-[48px] px-3 rounded-xl border border-hydrangea-100 bg-white flex items-center gap-1.5 text-sm font-medium text-hydrangea-700 active:scale-95 transition"
          style={{ minWidth: 100 }}
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span>{country.dial}</span>
          <ChevronDown className="w-4 h-4 text-hydrangea-400" />
        </button>
        <input
          type="tel"
          inputMode="numeric"
          value={formatNumber(number, country.groups)}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={country.example}
          className="flex-1 min-h-[48px] px-4 rounded-xl border border-hydrangea-100 bg-white text-hydrangea-700 placeholder:text-hydrangea-300 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
          style={{ fontSize: '16px' }}
        />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-hydrangea-100 rounded-xl shadow-xl max-h-64 overflow-y-auto w-64">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCountry(c); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-hydrangea-50 text-left text-sm ${country.code === c.code ? 'bg-hydrangea-50' : ''}`}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="font-medium text-hydrangea-700 flex-1">{c.name}</span>
                <span className="text-hydrangea-400 text-xs">{c.dial}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
