'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Campaign } from '@/lib/api';
import AppShell from '../_components/AppShell';

const statusColor: Record<string, string> = {
  DRAFT: '#888',
  SCHEDULED: '#2196F3',
  RUNNING: '#FF9800',
  COMPLETED: '#4CAF50',
  FAILED: '#F44336',
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    api.campaigns.list()
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, [router]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this campaign?')) return;
    await api.campaigns.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Campaigns</h1>
        <button onClick={() => router.push('/campaigns/new')} style={{ background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          + New Campaign
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', color: '#666', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          No campaigns yet. <button onClick={() => router.push('/campaigns/new')} style={{ background: 'none', border: 'none', color: '#ff0000', cursor: 'pointer' }}>Create one</button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Title</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Video</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Status</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Targets</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>Created</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/campaigns/${c.id}`)} style={{ cursor: 'pointer', borderTop: '1px solid #eee' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')} onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500 }}>{c.title}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#666', fontSize: '0.875rem' }}>{c.mediaFile?.filename}</td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <span style={{ background: `${statusColor[c.status]}22`, color: statusColor[c.status], padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#666' }}>{c.targets?.length ?? 0}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#666', fontSize: '0.875rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <button onClick={(e) => handleDelete(c.id, e)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#666', fontSize: '0.8rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
