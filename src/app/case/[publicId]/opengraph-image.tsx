import { INITIAL_CASES } from '@/server/mock-data';
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ publicId: string }>;
}

export default async function Image({ params }: Props) {
  const { publicId } = await params;
  const caseItem = INITIAL_CASES.find((c) => c.public_id === publicId);

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#080c14',
        color: '#ffffff',
        padding: '60px',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '36px' }}>🚧</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
            Pothole America
          </span>
        </div>
        <div
          style={{
            fontSize: '22px',
            fontFamily: 'monospace',
            backgroundColor: '#1e293b',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        >
          {caseItem?.public_id || publicId}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', margin: 0, lineHeight: 1.2 }}>
          {caseItem?.title || 'Road Hazard Report'}
        </h1>
        <p style={{ fontSize: '24px', color: '#94a3b8', margin: 0 }}>
          {caseItem?.address || 'Sacramento, CA'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #1e293b',
          paddingTop: '24px',
        }}
      >
        <div style={{ fontSize: '22px', color: '#38bdf8' }}>
          👥 {caseItem?.confirmation_count || 1} Residents Confirmed
        </div>
        <div style={{ fontSize: '22px', color: '#10b981', fontWeight: 'bold' }}>
          Community Status: {caseItem?.community_status || 'OPEN'}
        </div>
      </div>
    </div>,
    { ...size }
  );
}
