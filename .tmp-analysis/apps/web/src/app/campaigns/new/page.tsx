'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, MediaFile, YoutubeChannel } from '@/lib/api';
import AppShell from '../../_components/AppShell';

interface TargetForm {
  channelId: string;
  title: string;
  description: string;
  tags: string;
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [channels, setChannels] = useState<YoutubeChannel[]>([]);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [selectedMedia, setSelectedMedia] = useState('');
  const [targets, setTargets] = useState<TargetForm[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const searchParams = new URLSearchParams(window.location.search);
    const preselectedMedia = searchParams.get('mediaId');

    Promise.all([api.media.list(), api.accounts.list()]).then(([files, accounts]) => {
      setMediaFiles(files);
      const allChannels = accounts.flatMap((a) => a.channels);
      setChannels(allChannels);
      if (preselectedMedia) setSelectedMedia(preselectedMedia);
    }).finally(() => setLoading(false));
  }, [router]);

  const toggleChannel = useCallback((channelId: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
        setTargets((t) => t.filter((target) => target.channelId !== channelId));
      } else {
        next.add(channelId);
        setTargets((t) => [...t, {
          channelId,
          title: campaignTitle,
          description: '',
          tags: '',
          privacy: 'PUBLIC',
        }]);
      }
      return next;
    });
  }, [campaignTitle]);

  function updateTarget(channelId: string, field: keyof TargetForm, value: string) {
    setTargets((prev) => prev.map((t) => t.channelId === channelId ? { ...t, [field]: value } : t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMedia) { setError('Please select a video'); return; }
    if (targets.length === 0) { setError('Please select at least one channel'); return; }

    setSubmitting(true);
    setError('');

    try {
      const campaign = await api.campaigns.create({
        title: campaignTitle,
        description: campaignDesc,
        mediaFileId: selectedMedia,
        targets: targets.map((t) => ({
          channelId: t.channelId,
          title: t.title,
          description: t.description,
          tags: t.tags.split(',').map((s) => s.trim()).filter(Boolean),
          privacy: t.privacy,
        })),
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell><div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div></AppShell>;

  return (
    <AppShell>
      <h1 style={{ margin: '0 0 1.5rem' }}>New Campaign</h1>

      {error && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: '#c62828' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Campaign Details</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>Campaign Title *</label>
            <input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>Description</label>
            <textarea value={campaignDesc} onChange={(e) => setCampaignDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>Video *</label>
            {mediaFiles.length === 0 ? (
              <p style={{ color: '#888' }}>No videos uploaded yet. <a href="/upload" style={{ color: '#ff0000' }}>Upload one first.</a></p>
            ) : (
              <select value={selectedMedia} onChange={(e) => setSelectedMedia(e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <option value="">Select a video...</option>
                {mediaFiles.map((f) => <option key={f.id} value={f.id}>{f.filename}</option>)}
              </select>
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Select Channels</h2>
          {channels.length === 0 ? (
            <p style={{ color: '#888' }}>No channels available. <a href="/accounts" style={{ color: '#ff0000' }}>Connect a YouTube account first.</a></p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {channels.map((ch) => (
                <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: `1px solid ${selectedChannels.has(ch.id) ? '#ff0000' : '#eee'}`, borderRadius: '6px', cursor: 'pointer', background: selectedChannels.has(ch.id) ? '#fff5f5' : 'white' }}>
                  <input type="checkbox" checked={selectedChannels.has(ch.id)} onChange={() => toggleChannel(ch.id)} />
                  {ch.thumbnail && <img src={ch.thumbnail} alt={ch.title} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />}
                  <span style={{ fontWeight: 500 }}>{ch.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {targets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {targets.map((target) => {
              const ch = channels.find((c) => c.id === target.channelId);
              return (
                <div key={target.channelId} style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ch?.thumbnail && <img src={ch.thumbnail} alt={ch?.title} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                    {ch?.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Title *</label>
                      <input value={target.title} onChange={(e) => updateTarget(target.channelId, 'title', e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Description</label>
                      <textarea value={target.description} onChange={(e) => updateTarget(target.channelId, 'description', e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tags (comma-separated)</label>
                      <input value={target.tags} onChange={(e) => updateTarget(target.channelId, 'tags', e.target.value)} placeholder="tag1, tag2, tag3" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Privacy</label>
                      <select value={target.privacy} onChange={(e) => updateTarget(target.channelId, 'privacy', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="PUBLIC">Public</option>
                        <option value="UNLISTED">Unlisted</option>
                        <option value="PRIVATE">Private</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={submitting || targets.length === 0} style={{ padding: '0.75rem 2rem', background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontSize: '0.95rem' }}>
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem' }}>
            Cancel
          </button>
        </div>
      </form>
    </AppShell>
  );
}
