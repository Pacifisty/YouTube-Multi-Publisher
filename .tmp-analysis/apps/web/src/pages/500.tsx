export default function Custom500() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f5f5f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
        <p style={{ margin: 0, color: '#ff0000', fontWeight: 700, letterSpacing: '0.08em' }}>500</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.75rem' }}>Server error</h1>
        <p style={{ margin: '0.75rem 0 0', color: '#666', lineHeight: 1.5 }}>
          Something unexpected happened while loading the page.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            background: '#ff0000',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Return home
        </a>
      </div>
    </main>
  );
}
