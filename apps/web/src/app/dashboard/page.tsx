'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Campaign } from '@/lib/api';
import AppShell from '../_components/AppShell';

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    api.campaigns.list()
      .then(setCampaigns)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = {
    total: campaigns.length,
    running: campaigns.filter((c) => c.status === 'RUNNING').length,
    completed: campaigns.filter((c) => c.status === 'COMPLETED').length,
    failed: campaigns.filter((c) => c.status === 'FAILED').length,
    draft: campaigns.filter((c) => c.status === 'DRAFT').length,
  };

  const statusColor = {
    DRAFT: '#888',
    SCHEDULED: '#2196F3',
    RUNNING: '#FF9800',
    COMPLETED: '#4CAF50',
    FAILED: '#F44336',
  };

  return (
    <AppShell>
      <h1 style={{ margin: '0 0 1.5rem' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total', value: stats.total, color: '#333' },
          { label: 'Running', value: stats.running, color: '#FF9800' },
          { label: 'Completed', value: stats.completed, color: '#4CAF50' },
          { label: 'Failed', value: stats.failed, color: '#F44336' },
          { label: 'Draft', value: stats.draft, color: '#888' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Recent Campaigns</h2>
          <button onClick={() => router.push('/campaigns/new')} style={{ background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            + New Campaign
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No campaigns yet. <a href="/campaigns/new" style={{ color: '#ff0000' }}>Create one</a></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Title</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Status</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Targets</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 10).map((c) => (
                <tr key={c.id} onClick={() => router.push(`/campaigns/${c.id}`)} style={{ cursor: 'pointer', borderTop: '1px solid #eee' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')} onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500 }}>{c.title}</td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <span style={{ background: `${statusColor[c.status]}22`, color: statusColor[c.status], padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#666' }}>{c.targets?.length ?? 0} channels</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#666', fontSize: '0.875rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
