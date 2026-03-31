'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Campaign, JobLog } from '@/lib/api';
import AppShell from '../../_components/AppShell';

const statusColor: Record<string, string> = {
  PENDING: '#888',
  PROCESSING: '#FF9800',
  PUBLISHED: '#4CAF50',
  FAILED: '#F44336',
};

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, JobLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Set<string>>(new Set());

  const loadCampaign = useCallback(() => {
    api.campaigns.get(params.id)
      .then(setCampaign)
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadCampaign();

    const TERMINAL_STATES = ['COMPLETED', 'FAILED'];
    if (campaign && TERMINAL_STATES.includes(campaign.status)) return;

    const interval = setInterval(loadCampaign, 5000);
    return () => clearInterval(interval);
  }, [router, loadCampaign, campaign?.status]);

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.campaigns.publish(params.id);
      loadCampaign();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLogs(targetId: string) {
    if (expandedLogs[targetId]) {
      setExpandedLogs((prev) => { const next = { ...prev }; delete next[targetId]; return next; });
      return;
    }

    setLoadingLogs((prev) => new Set(prev).add(targetId));
    try {
      const logs = await api.jobs.getLogs(targetId);
      setExpandedLogs((prev) => ({ ...prev, [targetId]: logs }));
    } finally {
      setLoadingLogs((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
    }
  }

  async function handleRetry(targetId: string) {
    try {
      await api.jobs.retry(targetId);
      loadCampaign();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (loading) return <AppShell><div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div></AppShell>;
  if (!campaign) return <AppShell><div>Campaign not found</div></AppShell>;

  const canPublish = campaign.status === 'DRAFT' && campaign.targets.some((t) => t.status === 'PENDING');
  const campaignStatusColor: Record<string, string> = {
    DRAFT: '#888',
    SCHEDULED: '#2196F3',
    RUNNING: '#FF9800',
    COMPLETED: '#4CAF50',
    FAILED: '#F44336',
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <button onClick={() => router.push('/campaigns')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← Back to campaigns
          </button>
          <h1 style={{ margin: 0 }}>{campaign.title}</h1>
          {campaign.description && <p style={{ color: '#666', margin: '0.25rem 0 0' }}>{campaign.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ background: `${campaignStatusColor[campaign.status]}22`, color: campaignStatusColor[campaign.status], padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
            {campaign.status}
          </span>
          {canPublish && (
            <button onClick={handlePublish} disabled={publishing} style={{ background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}>
              {publishing ? 'Publishing...' : '▶ Publish'}
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>Video:</strong> {campaign.mediaFile?.filename}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Upload Targets ({campaign.targets.length})</h2>
        </div>

        {campaign.targets.map((target) => (
          <div key={target.id} style={{ borderTop: '1px solid #eee', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{target.channel?.title || target.channelId}</div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>{target.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ background: `${statusColor[target.status]}22`, color: statusColor[target.status], padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {target.status}
                </span>
                {target.youtubeVideoId && (
                  <a href={`https://youtube.com/watch?v=${target.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#ff0000' }}>
                    Watch ↗
                  </a>
                )}
                {target.status === 'FAILED' && (
                  <button onClick={() => handleRetry(target.id)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}>
                    Retry
                  </button>
                )}
                <button onClick={() => toggleLogs(target.id)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}>
                  {expandedLogs[target.id] ? 'Hide Logs' : 'View Logs'}
                </button>
              </div>
            </div>

            {target.errorMessage && (
              <div style={{ marginTop: '0.5rem', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '4px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#c62828' }}>
                Error: {target.errorMessage}
              </div>
            )}

            {loadingLogs.has(target.id) && <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Loading logs...</div>}

            {expandedLogs[target.id] && (
              <div style={{ marginTop: '0.75rem', background: '#1a1a2e', borderRadius: '6px', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#ccc', maxHeight: '200px', overflowY: 'auto' }}>
                {expandedLogs[target.id].length === 0 ? (
                  <div style={{ color: '#888' }}>No logs yet.</div>
                ) : (
                  expandedLogs[target.id].map((log) => (
                    <div key={log.id} style={{ marginBottom: '0.25rem', color: log.level === 'ERROR' ? '#ef9a9a' : log.level === 'WARN' ? '#FFD54F' : '#A5D6A7' }}>
                      [{new Date(log.createdAt).toLocaleTimeString()}] [{log.level}] {log.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
