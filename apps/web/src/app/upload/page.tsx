'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, MediaFile } from '@/lib/api';
import AppShell from '../_components/AppShell';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState<MediaFile | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }

    setUploading(true);
    setError('');
    setProgress('Uploading...');

    try {
      const formData = new FormData();
      formData.append('video', file);
      const result = await api.media.upload(formData);
      setUploaded(result);
      setProgress('Upload complete!');
    } catch (err) {
      setError((err as Error).message);
      setProgress('');
    } finally {
      setUploading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function formatSize(bytes: string) {
    const n = parseInt(bytes);
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
    return `${(n / 1e3).toFixed(1)} KB`;
  }

  return (
    <AppShell>
      <h1 style={{ margin: '0 0 1.5rem' }}>Upload Video</h1>

      <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
        {!uploaded ? (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? '#ff0000' : '#ddd'}`,
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#fff5f5' : '#fafafa',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Drop your video here</div>
              <div style={{ color: '#888', fontSize: '0.875rem' }}>or click to browse</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.5rem' }}>Supports all video formats up to 256GB</div>
            </div>

            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleInputChange} style={{ display: 'none' }} />

            {uploading && (
              <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
                <div style={{ marginBottom: '0.5rem' }}>⏳ {progress}</div>
                <div style={{ height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#ff0000', width: '60%', animation: 'progress 1s ease infinite' }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: '1rem', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '4px', padding: '0.75rem', color: '#c62828' }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <h2 style={{ margin: '0 0 0.5rem' }}>Upload Successful!</h2>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div><strong>File:</strong> {uploaded.filename}</div>
              <div><strong>Size:</strong> {formatSize(uploaded.fileSize)}</div>
              <div><strong>Type:</strong> {uploaded.mimeType}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => router.push(`/campaigns/new?mediaId=${uploaded.id}`)} style={{ flex: 1, padding: '0.75rem', background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem' }}>
                Create Campaign →
              </button>
              <button onClick={() => setUploaded(null)} style={{ padding: '0.75rem 1rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem' }}>
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
