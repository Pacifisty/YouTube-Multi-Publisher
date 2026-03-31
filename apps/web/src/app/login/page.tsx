'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = isSetup
        ? await api.auth.setup(email, password)
        : await api.auth.login(email, password);

      localStorage.setItem('token', result.token);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
          📺 YouTube Multi-Publisher
        </h1>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 500, textAlign: 'center', color: '#666' }}>
          {isSetup ? 'Create Admin Account' : 'Sign In'}
        </h2>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: '#c00' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSetup ? 8 : 6}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Loading...' : isSetup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
          {isSetup ? (
            <>Already have an account? <button onClick={() => setIsSetup(false)} style={{ background: 'none', border: 'none', color: '#ff0000', cursor: 'pointer' }}>Sign in</button></>
          ) : (
            <>First time? <button onClick={() => setIsSetup(true)} style={{ background: 'none', border: 'none', color: '#ff0000', cursor: 'pointer' }}>Create admin account</button></>
          )}
        </p>
      </div>
    </div>
  );
}
