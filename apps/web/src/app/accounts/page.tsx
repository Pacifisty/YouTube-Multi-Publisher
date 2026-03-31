'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, YoutubeAccount } from '@/lib/api';
import AppShell from '../_components/AppShell';

export default function AccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<YoutubeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    if (searchParams.get('connected')) setMessage('YouTube account connected successfully!');
    if (searchParams.get('error')) setMessage('Failed to connect YouTube account. Please try again.');

    api.accounts.list()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { url } = await api.accounts.getOAuthUrl();
      window.location.href = url;
    } catch (err) {
      setMessage((err as Error).message);
      setConnecting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Disconnect this YouTube account?')) return;
    try {
      await api.accounts.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>YouTube Accounts</h1>
        <button onClick={handleConnect} disabled={connecting} style={{ background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          {connecting ? 'Redirecting...' : '+ Connect Account'}
        </button>
      </div>

      {message && (
        <div style={{ background: message.includes('success') ? '#e8f5e9' : '#ffebee', border: `1px solid ${message.includes('success') ? '#a5d6a7' : '#ef9a9a'}`, borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: message.includes('success') ? '#2e7d32' : '#c62828' }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
      ) : accounts.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', color: '#666', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No YouTube accounts connected yet.</p>
          <button onClick={handleConnect} style={{ background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {accounts.map((account) => (
            <div key={account.id} style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{account.displayName}</div>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>{account.email}</div>
                </div>
                <button onClick={() => handleDelete(account.id)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#666', fontSize: '0.8rem' }}>
                  Disconnect
                </button>
              </div>

              {account.channels.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Channels ({account.channels.length})</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {account.channels.map((ch) => (
                      <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f5f5f5', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                        {ch.thumbnail && <img src={ch.thumbnail} alt={ch.title} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />}
                        {ch.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
