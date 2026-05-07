import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const GOLD = '#C4A36A';
const PURPLE_DEEP = '#5A3D7A';
const PURPLE = '#7B5EA7';
const CREAM = '#FAEFD8';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, #F4ECFA 0%, ${CREAM} 60%, #E8DFF3 100%)`,
          padding: '60px',
          position: 'relative'
        }}
      >
        {/* gold corner ornaments */}
        <div style={{
          position: 'absolute', top: 50, left: 50,
          width: 80, height: 80,
          borderTop: `2px solid ${GOLD}`,
          borderLeft: `2px solid ${GOLD}`,
          opacity: 0.6
        }} />
        <div style={{
          position: 'absolute', bottom: 50, right: 50,
          width: 80, height: 80,
          borderBottom: `2px solid ${GOLD}`,
          borderRight: `2px solid ${GOLD}`,
          opacity: 0.6
        }} />

        {/* Card mock */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 540,
            height: 380,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 16,
            border: `1px solid ${GOLD}55`,
            boxShadow: '0 24px 48px rgba(123,94,167,0.18)',
            padding: '40px',
            marginBottom: 36
          }}
        >
          <div style={{ fontSize: 16, color: GOLD, letterSpacing: '0.4em', marginBottom: 18 }}>
            ✽
          </div>
          <div style={{
            fontSize: 22,
            color: PURPLE,
            letterSpacing: '0.45em',
            marginBottom: 20,
            fontWeight: 500
          }}>
            INVITATION
          </div>
          <div style={{
            fontSize: 56,
            color: PURPLE_DEEP,
            letterSpacing: '0.06em',
            fontFamily: 'serif',
            marginBottom: 18
          }}>
            Daniel ♥ Olivia
          </div>
          <div style={{ fontSize: 18, color: '#7C6E92', letterSpacing: '0.18em' }}>
            14 · JUNE · 2026
          </div>
        </div>

        {/* DearDay mark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: 64,
            color: PURPLE_DEEP,
            fontFamily: 'serif',
            letterSpacing: '0.04em'
          }}>
            DearDay
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 22,
            color: GOLD,
            letterSpacing: '0.32em'
          }}>
            INVITE THE DEAREST DAY
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
