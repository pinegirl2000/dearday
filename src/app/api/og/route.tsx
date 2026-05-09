import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const GOLD = '#C4A36A';
const PURPLE_DEEP = '#5A3D7A';
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
