'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { setUser } from '@/lib/auth';

const DB = process.env.NEXT_PUBLIC_ODOO_DB || 'db_SIPP';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ibs_pwa_user');
    if (stored) router.replace('/');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use Next.js proxy route to avoid CORS issue
      const res = await fetch(`/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: { db: DB, login: email, password } }),
      });

      const data = await res.json();
      const result = data?.result;

      if (!result || result?.error) {
        setError(result?.error?.message || 'Email atau password salah.');
        return;
      }

      if (!result.orangtua_id) {
        setError('Akun ini bukan akun Wali Santri. Silakan hubungi admin.');
        return;
      }

      setUser({
        uid: result.uid,
        partner_id: result.partner_id,
        name: result.name,
        username: result.username,
        orangtua_id: result.orangtua_id,
        siswa_id: result.siswa_id,
      });

      router.replace('/');
    } catch {
      setError('Koneksi ke server gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #174D7F 0%, #0f3659 55%, #0a2540 100%)',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px 32px',
        gap: '16px',
      }}>
        <Image
          src="/logo-typograpy.png"
          alt="IBS Al Hamra"
          width={240}
          height={100}
          style={{ objectFit: 'contain', background: '#ffffff', padding: '8px', borderRadius: '12px' }}
          priority
        />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'center', letterSpacing: '0.3px' }}>
          Portal Wali Santri
        </p>
      </div>

      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-high)', marginBottom: '8px' }}>
          Masuk ke Akun
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', marginBottom: '28px' }}>
          Gunakan email dan password yang diberikan oleh pihak pesantren.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-high)', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              required
              style={{
                width: '100%', padding: '13px 14px',
                border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                borderRadius: '12px', fontSize: '16px', outline: 'none',
                fontFamily: 'Inter, sans-serif', color: 'var(--color-text-high)',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-high)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                style={{
                  width: '100%', padding: '13px 44px 13px 14px',
                  border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  borderRadius: '12px', fontSize: '16px', outline: 'none',
                  fontFamily: 'Inter, sans-serif', color: 'var(--color-text-high)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-medium)', display: 'flex', alignItems: 'center' }}
              >
                {showPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px', color: 'var(--color-danger)', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#94A3B8' : 'var(--color-primary)',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--color-text-medium)' }}>
          Lupa password? Hubungi pihak pesantren.
        </p>
      </div>
    </div>
  );
}