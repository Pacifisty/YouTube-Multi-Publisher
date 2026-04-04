'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f5' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '480px', textAlign: 'center', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
            <p style={{ margin: 0, color: '#ff0000', fontWeight: 700, letterSpacing: '0.08em' }}>Application error</p>
            <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.75rem' }}>The app hit an unexpected problem</h1>
            <p style={{ margin: '0.75rem 0 0', color: '#666', lineHeight: 1.5 }}>
              {error.message || 'Please refresh and try again.'}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                background: '#ff0000',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
