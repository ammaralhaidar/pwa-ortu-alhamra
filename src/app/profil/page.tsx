'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getUser, logout } from '@/lib/auth';

export default function ProfilPage() {
  const router = useRouter();
  const user = getUser();
  const [showPassForm, setShowPassForm] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar?')) return;
    await logout();
    router.replace('/login');
  };

  const handleChangePass = async () => {
    if (!oldPass || !newPass) { setMsg({ type: 'error', text: 'Semua field wajib diisi.' }); return; }
    if (newPass.length < 6) { setMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/odoo/api/v1/ganti_password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const data = await res.json();
      if (data.result?.code === 200) {
        setMsg({ type: 'success', text: 'Password berhasil diubah!' });
        setOldPass(''); setNewPass('');
        setTimeout(() => setShowPassForm(false), 1500);
      } else {
        setMsg({ type: 'error', text: data.result?.error?.message || 'Gagal mengubah password.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan koneksi.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Profil" showBack={false} />
      <main className="main-content" style={{ padding: '16px' }}>
        <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 700, margin: '0 auto 12px' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 4px' }}>{user?.name || '-'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>{user?.username || '-'}</p>
          <div style={{ display: 'inline-block', background: '#EFF6FF', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', marginTop: '10px' }}>
            Wali Santri
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', marginBottom: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <button
            onClick={() => { setShowPassForm(!showPassForm); setMsg(null); }}
            style={{ width: '100%', padding: '16px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔑</span>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-high)' }}>Ganti Password</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2" style={{ transform: showPassForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
          {showPassForm && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
              {msg && (
                <div style={{ background: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`, borderRadius: '8px', padding: '10px 12px', marginTop: '12px', marginBottom: '10px', color: msg.type === 'success' ? 'var(--color-accent)' : 'var(--color-danger)', fontSize: '13px' }}>
                  {msg.text}
                </div>
              )}
              {[
                { label: 'Password Lama', value: oldPass, setter: setOldPass },
                { label: 'Password Baru', value: newPass, setter: setNewPass },
              ].map((field, i) => (
                <div key={i} style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>{field.label}</label>
                  <input
                    type="password"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '15px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                  />
                </div>
              ))}
              <button onClick={handleChangePass} disabled={saving} style={{ width: '100%', padding: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '14px', fontFamily: 'Inter, sans-serif' }}>
                {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>
          )}
        </div>

        <button
          id="btn-logout"
          onClick={handleLogout}
          style={{ width: '100%', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', color: 'var(--color-danger)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Keluar dari Akun
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--color-text-low)' }}>
          PWA Wali Santri IBS Al Hamra v1.0
        </p>
      </main>
      <BottomNav />
    </div>
  );
}