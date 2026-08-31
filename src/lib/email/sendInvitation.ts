'use server';

import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'invitation@dearday.sg';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'DearDay';

interface PaletteColors {
  body: string;
  bodyTint: string;
  bodyMid: string;
  bodyDark: string;
  flap: string;
  flapShadow: string;
  ink: string;
  goldHighlight: string;
  goldLight: string;
  gold: string;
  goldDeep: string;
}

interface SendArgs {
  to: string;
  recipientName: string;
  cardTitle: string;
  greeting?: string | null;
  invitationUrl: string;
  palette?: PaletteColors;
  senderName?: string | null;   // 호스트 이름 (예: "Sarah")
  eventDate?: string | null;    // ISO 날짜
}

export async function sendInvitationEmail(args: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY 환경변수가 설정되지 않았습니다.' };

  const resend = new Resend(apiKey);
  const { to, recipientName, cardTitle, greeting, invitationUrl } = args;

  const sender = args.senderName?.trim() || '';
  const subject = sender
    ? `${sender} sent you an invitation — ${cardTitle}`
    : `${recipientName}님께 — ${cardTitle}`;
  const html = renderInvitationHtml({
    recipientName, cardTitle, greeting: greeting || '', invitationUrl,
    palette: args.palette, senderName: sender, eventDate: args.eventDate || null
  });

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    if ((result as any).error) {
      return { ok: false, error: (result as any).error.message || 'Email send failed' };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Email send failed' };
  }
}

function renderInvitationHtml(args: {
  recipientName: string;
  cardTitle: string;
  greeting: string;
  invitationUrl: string;
  palette?: PaletteColors;
  senderName?: string;
  eventDate?: string | null;
}) {
  const { recipientName, cardTitle, greeting, invitationUrl, senderName, eventDate } = args;
  const formatDateLong = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      // 예: "Saturday, May 30, 2026"
      return d.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return ''; }
  };
  const dateLong = formatDateLong(eventDate);
  // 기본 라벤더 팔레트 (palette 미지정 시)
  const p: PaletteColors = args.palette || {
    body: '#C8B0E2', bodyTint: '#E8DCF3', bodyMid: '#D2B8E5', bodyDark: '#9C82BE',
    flap: '#D2B8E5', flapShadow: '#B89AD2',
    ink: '#3A2E55',
    goldHighlight: '#FBEFA8', goldLight: '#F0DC78', gold: '#DCB748', goldDeep: '#A8862E'
  };
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // SVG 봉투 — 닫힌 상태 (V flap + 우표 + 받는 분 이름)
  // 비율 380:285 (4:3) — 실제 봉투와 동일
  const envelopeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 285" width="380" height="285" style="display:block;max-width:100%;height:auto;">
    <defs>
      <linearGradient id="bd" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.bodyTint}" />
        <stop offset="50%" stop-color="${p.body}" />
        <stop offset="100%" stop-color="${p.bodyDark}" />
      </linearGradient>
      <linearGradient id="fl" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.bodyTint}" />
        <stop offset="60%" stop-color="${p.bodyMid}" />
        <stop offset="100%" stop-color="${p.flap}" />
      </linearGradient>
      <linearGradient id="gd" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.goldHighlight}" />
        <stop offset="35%" stop-color="${p.goldLight}" />
        <stop offset="60%" stop-color="${p.gold}" />
        <stop offset="100%" stop-color="${p.goldDeep}" />
      </linearGradient>
    </defs>
    <!-- body rectangle -->
    <rect x="0" y="0" width="380" height="285" rx="8" ry="8" fill="url(#bd)" />
    <!-- closed V flap -->
    <path d="M 0 0 L 380 0 L 213 257 Q 190 285 167 257 Z" fill="url(#fl)" opacity="0.95" />
    <!-- gold border inset -->
    <rect x="8" y="8" width="364" height="269" rx="6" ry="6" fill="none" stroke="${p.gold}" stroke-opacity="0.35" stroke-width="1" />
    <!-- stamp top-right (white background + gold inner + DearDay) -->
    <g transform="translate(320, 14)">
      <rect width="46" height="56" fill="#FFFFFF" rx="2" />
      <rect x="4" y="4" width="38" height="48" fill="url(#gd)" rx="1" />
      <text x="23" y="26" font-family="Georgia, serif" font-style="italic" font-size="10" fill="${p.ink}" text-anchor="middle" font-weight="400">Dear</text>
      <text x="23" y="40" font-family="Georgia, serif" font-style="italic" font-size="10" fill="${p.ink}" text-anchor="middle" font-weight="400">Day</text>
    </g>
    <!-- recipient name center-ish -->
    <text x="190" y="200" font-family="'Cormorant Garamond', Georgia, serif" font-size="22" fill="${p.ink}" text-anchor="middle" font-weight="500" letter-spacing="2">${safe(recipientName).toUpperCase()}</text>
  </svg>`;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${safe(cardTitle)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:'Cormorant Garamond','Playfair Display','Noto Serif KR',Georgia,serif;color:${p.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
          <!-- 헤더 메시지: "X sent you an invitation for / Title / Date" -->
          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              ${senderName
                ? `<div style="font-size:14px;color:${p.bodyDark};line-height:1.5;margin-bottom:8px;font-family:Arial,sans-serif;">${safe(senderName)} sent you an invitation for</div>`
                : `<div style="font-size:11px;letter-spacing:0.32em;color:${p.gold};text-transform:uppercase;margin-bottom:12px;font-family:Arial,sans-serif;">Invitation</div>`}
              <div style="font-size:24px;font-weight:600;color:${p.ink};line-height:1.3;margin-bottom:8px;">${safe(cardTitle)}</div>
              ${dateLong ? `<div style="font-size:14px;color:${p.bodyDark};line-height:1.5;font-family:Arial,sans-serif;">${safe(dateLong)}</div>` : ''}
              ${greeting ? `<div style="font-size:13px;color:${p.bodyDark};line-height:1.6;margin-top:12px;">${safe(greeting)}</div>` : ''}
            </td>
          </tr>
          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:8px 32px 24px;text-align:center;">
              <a href="${invitationUrl}" style="display:inline-block;padding:14px 40px;background:${p.gold};color:#FFFFFF;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.05em;border-radius:24px;">Open Invitation</a>
            </td>
          </tr>
          <!-- 봉투 SVG (CTA 아래) — 클릭 시 invitation으로 이동 -->
          <tr>
            <td style="padding:8px 24px 32px;text-align:center;">
              <a href="${invitationUrl}" style="display:inline-block;text-decoration:none;">
                ${envelopeSvg}
              </a>
              <div style="font-size:11px;color:${p.bodyDark};margin-top:16px;line-height:1.5;font-family:Arial,sans-serif;">
                또는 아래 링크를 복사해 브라우저에서 열어주세요:<br />
                <a href="${invitationUrl}" style="color:${p.gold};text-decoration:underline;word-break:break-all;">${invitationUrl}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background:${p.bodyTint};font-size:11px;color:${p.bodyDark};font-family:Arial,sans-serif;">
              Curated by <a href="https://dearday.sg" style="color:${p.ink};text-decoration:none;font-weight:600;">DearDay</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
