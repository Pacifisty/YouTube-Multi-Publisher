'use client';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/accounts', label: '🔗 Accounts' },
  { href: '/upload', label: '⬆️ Upload' },
  { href: '/campaigns', label: '🎬 Campaigns' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '220px', background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1rem' }}>
          📺 YT Publisher
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: pathname.startsWith(item.href) ? 'white' : 'rgba(255,255,255,0.6)',
                background: pathname.startsWith(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                borderLeft: pathname.startsWith(item.href) ? '3px solid #ff0000' : '3px solid transparent',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button onClick={handleLogout} style={{ margin: '1rem', padding: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
          Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
