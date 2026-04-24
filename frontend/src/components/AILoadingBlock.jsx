const LINE_WIDTHS = ['100%', '92%', '80%', '68%'];

export default function AILoadingBlock({
  eyebrow = 'AI is thinking',
  message = 'Reading the latest F1 data and building a clean summary.',
  detail = 'This usually only takes a few seconds.',
  lines = 3,
  compact = false,
}) {
  return (
    <div
      style={{
        background: compact ? 'transparent' : 'rgba(255,255,255,0.02)',
        border: compact ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: compact ? 0 : 14,
        padding: compact ? 0 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            position: 'relative',
            width: compact ? 26 : 30,
            height: compact ? 26 : 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="animate-ping"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '999px',
              background: 'rgba(225, 6, 0, 0.15)',
            }}
          />
          <span
            className="animate-pulse"
            style={{
              position: 'relative',
              width: 10,
              height: 10,
              borderRadius: '999px',
              background: '#E10600',
              boxShadow: '0 0 12px rgba(225, 6, 0, 0.35)',
            }}
          />
        </div>

        <div>
          <p
            style={{
              margin: 0,
              color: '#E10600',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </p>
          <p style={{ margin: '4px 0 0', color: '#f2d3cd', fontSize: 13 }}>
            {message}
          </p>
        </div>
      </div>

      {detail && (
        <p style={{ margin: '0 0 14px', color: '#888', fontSize: 12, lineHeight: 1.6 }}>
          {detail}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            style={{
              width: LINE_WIDTHS[index] || LINE_WIDTHS[LINE_WIDTHS.length - 1],
              height: compact ? 10 : 12,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              className="animate-pulse"
              style={{
                width: '55%',
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(225,6,0,0), rgba(225,6,0,0.18), rgba(225,6,0,0))',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
