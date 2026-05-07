'use server';

import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'invitation@dearday.sg';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'DearDay';

interface SendArgs {
  to: string;
  recipientName: string;
  cardTitle: string;
  greeting?: string | null;
  invitationUrl: string;
}

export async function sendInvitationEmail(args: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY 환경변수가 설정되지 않았습니다.' };

  const resend = new Resend(apiKey);
  const { to, recipientName, cardTitle, greeting, invitationUrl } = args;

  const subject = `${recipientName}님께 — ${cardTitle}`;
  const html = renderInvitationHtml({ recipientName, cardTitle, greeting: greeting || '', invitationUrl });

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
}) {
  const { recipientName, cardTitle, greeting, invitationUrl } = args;
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${safe(cardTitle)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:'Cormorant Garamond','Playfair Display','Noto Serif KR',Georgia,serif;color:#3A2E55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(58,46,85,0.08);">
          <tr>
            <td style="padding:48px 32px 32px;text-align:center;background:linear-gradient(135deg,#FBF7EC 0%,#F0E5CD 100%);">
              <div style="font-size:11px;letter-spacing:0.32em;color:#9C8B6E;text-transform:uppercase;margin-bottom:16px;">Invitation</div>
              <div style="font-size:24px;font-weight:500;color:#3A2E55;line-height:1.4;margin-bottom:8px;">${safe(cardTitle)}</div>
              ${greeting ? `<div style="font-size:14px;color:#6E5A3D;line-height:1.6;margin-top:12px;">${safe(greeting)}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <div style="font-size:13px;color:#5A3D7A;letter-spacing:0.05em;margin-bottom:8px;">받는 분</div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#3A2E55;font-variant:small-caps;letter-spacing:0.12em;margin-bottom:32px;">${safe(recipientName)}</div>
              <a href="${invitationUrl}" style="display:inline-block;padding:14px 36px;background:#7B5EA7;color:#FFFFFF;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.05em;border-radius:24px;">초대장 열기</a>
              <div style="font-size:11px;color:#9C8B6E;margin-top:24px;line-height:1.5;">
                또는 아래 링크를 복사해 브라우저에서 열어주세요:<br />
                <a href="${invitationUrl}" style="color:#7B5EA7;text-decoration:underline;word-break:break-all;">${invitationUrl}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background:#FBF7EC;font-size:11px;color:#9C8B6E;font-family:Arial,sans-serif;">
              Powered by <a href="https://dearday.sg" style="color:#7B5EA7;text-decoration:none;font-weight:600;">DearDay</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
