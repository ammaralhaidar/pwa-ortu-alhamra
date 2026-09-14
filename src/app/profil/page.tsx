'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getUser, logout, isCalonOrangtua } from '@/lib/auth';
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribePush,
  sendSubscriptionToServer,
  showLocalNotification,
} from '@/lib/push';

export default function ProfilPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notifLoading, setNotifLoading] = useState(false);
  const [testNotifMsg, setTestNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }
  }, []);

  const handleToggleNotif = async () => {
    setTestNotifMsg(null);
    if (notifPermission === 'granted') {
      setNotifLoading(true);
      try {
        const ok = await showLocalNotification(
          'Uji Coba Notifikasi',
          'Notifikasi IBS Al Hamra berhasil terhubung dengan perangkat Anda!',
          '/profil'
        );
        if (ok) {
          setTestNotifMsg({
            type: 'success',
            text: 'Perintah notifikasi berhasil dikirim! Jika banner tidak muncul di layar, periksa apakah mode "Jangan Ganggu" (Focus) aktif atau izin browser diizinkan di Pengaturan Sistem macOS (Pengaturan Sistem > Pemberitahuan).',
          });
        } else {
          setTestNotifMsg({
            type: 'error',
            text: 'Gagal memicu notifikasi. Pastikan browser mendukung notifikasi.',
          });
        }
      } finally {
        setNotifLoading(false);
      }
      return;
    }
    setNotifLoading(true);
    try {
      const perm = await requestNotificationPermission();
      if (perm) setNotifPermission(perm);
      if (perm === 'granted') {
        const reg = await registerServiceWorker();
        if (reg) {
          const sub = await subscribePush(reg);
          if (sub) {
            await sendSubscriptionToServer(sub);
          }
        }
        await showLocalNotification(
          'Notifikasi Diaktifkan',
          'Perangkat ini sekarang siap menerima info tagihan dan pengumuman pondok.',
          '/profil'
        );
        setTestNotifMsg({
          type: 'success',
          text: 'Notifikasi berhasil diaktifkan!',
        });
      }
    } catch (e) {
      console.error(e);
      setTestNotifMsg({
        type: 'error',
        text: 'Terjadi kesalahan saat mengaktifkan notifikasi.',
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const user = mounted ? getUser() : null;
  const isCalon = mounted ? isCalonOrangtua() : false;
  const [showPassForm, setShowPassForm] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
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
        body: JSON.stringify({ params: { old_password: oldPass, new_password: newPass } }),
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
      <main
        className="main-content"
        style={{
          paddingTop: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingBottom: 'calc(var(--bottom-nav-height) + 24px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 700, margin: '0 auto 12px', overflow: 'hidden' }}>
            {user?.avatar_128 ? (
              <img src={`data:image/jpeg;base64,${user.avatar_128}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              user?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 4px' }}>{user?.name || '-'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>{user?.username || '-'}</p>
          <div style={{ display: 'inline-block', background: '#EFF6FF', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', marginTop: '10px' }}>
            {isCalon ? 'Calon Wali Santri' : 'Wali Santri'}
          </div>
        </div>

        {/* Card Notifikasi */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', marginBottom: '12px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-high)' }}>Notifikasi Push</span>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '2px 0 0', lineHeight: 1.35 }}>
                  {notifPermission === 'granted'
                    ? 'Perangkat aktif menerima notifikasi tagihan & info.'
                    : notifPermission === 'denied'
                    ? 'Notifikasi diblokir di setelan browser HP Anda.'
                    : notifPermission === 'unsupported'
                    ? 'Browser ini tidak mendukung notifikasi push.'
                    : 'Aktifkan agar tidak ketinggalan tagihan & pengumuman.'}
                </p>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background:
                    notifPermission === 'granted'
                      ? '#DCFCE7'
                      : notifPermission === 'denied'
                      ? '#FEE2E2'
                      : '#F1F5F9',
                  color:
                    notifPermission === 'granted'
                      ? '#16A34A'
                      : notifPermission === 'denied'
                      ? '#DC2626'
                      : 'var(--color-text-medium)',
                }}
              >
                {notifPermission === 'granted'
                  ? 'Aktif'
                  : notifPermission === 'denied'
                  ? 'Diblokir'
                  : notifPermission === 'unsupported'
                  ? 'Tidak Didukung'
                  : 'Belum Aktif'}
              </span>
            </div>
          </div>
          {notifPermission !== 'unsupported' && notifPermission !== 'denied' && (
            <button
              onClick={handleToggleNotif}
              disabled={notifLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                marginTop: '12px',
                background: notifPermission === 'granted' ? '#F8FAFC' : 'var(--color-primary)',
                color: notifPermission === 'granted' ? 'var(--color-primary)' : '#ffffff',
                border: notifPermission === 'granted' ? '1px solid var(--color-border)' : 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: notifLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {notifLoading
                ? 'Memproses...'
                : notifPermission === 'granted'
                ? '🔔 Kirim Tes Notifikasi ke HP'
                : 'Aktifkan Notifikasi Sekarang'}
            </button>
          )}
          {testNotifMsg && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: 1.4,
                background: testNotifMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                color: testNotifMsg.type === 'success' ? '#166534' : '#991B1B',
                border: `1px solid ${testNotifMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
              }}
            >
              {testNotifMsg.text}
            </div>
          )}
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
          onClick={() => setShowLogoutModal(true)}
          style={{ width: '100%', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', color: 'var(--color-danger)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Keluar dari Akun
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--color-text-low)' }}>
          PWA Wali Santri IBS Al Hamra v1.0
        </p>
      </main>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '24px', width: '100%', maxWidth: '340px', padding: '24px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--color-danger)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>Konfirmasi Keluar</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', margin: '0 0 24px', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>Apakah Anda yakin ingin keluar dari akun Anda?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Batal
              </button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '12px', background: 'var(--color-danger)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}