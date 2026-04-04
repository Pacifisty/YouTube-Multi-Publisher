'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
        <p style={{ margin: 0, color: '#ff0000', fontWeight: 700, letterSpacing: '0.08em' }}>Something went wrong</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.75rem' }}>We could not load this page</h1>
        <p style={{ margin: '0.75rem 0 0', color: '#666', lineHeight: 1.5 }}>
          {error.message || 'Please try again in a moment.'}
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
          Try again
        </button>
      </div>
    </main>
  );
}
