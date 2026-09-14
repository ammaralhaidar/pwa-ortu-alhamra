'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BellRing, ReceiptText, CreditCard, Megaphone, CheckCircle, X } from 'lucide-react';
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribePush,
  sendSubscriptionToServer,
} from '@/lib/push';

export default function NotificationPromptModal() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Never show on login page
    if (pathname === '/login') return;

    // 2. Check if Notification API is supported
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // 3. If already granted, ensure subscription is active in background and exit
    if (Notification.permission === 'granted') {
      (async () => {
        try {
          const reg = await registerServiceWorker();
          if (reg) {
            const sub = await subscribePush(reg);
            if (sub) {
              await sendSubscriptionToServer(sub);
            }
          }
        } catch {
          // silently handle background sync
        }
      })();
      return;
    }

    // 4. If already permanently denied by browser setting, don't nag with popup
    if (Notification.permission === 'denied') {
      return;
    }

    // 5. Check if user dismissed recently (e.g. within last 3 days)
    const dismissedUntil = localStorage.getItem('push_prompt_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 6. Check iOS standalone status:
    // On iOS Safari, Web Push is only supported if added to Home Screen (standalone).
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true);

    // If iOS and not installed yet, let InstallPrompt take priority
    if (isIOS && !isStandalone) {
      return;
    }

    // Delay 1.5s after page load for smooth UX
    const timer = setTimeout(() => {
      setShow(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        const reg = await registerServiceWorker();
        if (reg) {
          const sub = await subscribePush(reg);
          if (sub) {
            await sendSubscriptionToServer(sub);
          }
        }
        setSuccess(true);
        setTimeout(() => {
          setShow(false);
        }, 1500);
      } else {
        // Dismiss if user denied or closed browser native prompt
        handleDismiss();
      }
    } catch (e) {
      console.error('Failed to enable push notifications:', e);
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Dismiss for 3 days
    const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('push_prompt_dismissed_until', String(threeDays));
  };

  if (!show || pathname === '/login') return null;

  return (
    <>
      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          zIndex: 95,
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          animation: 'slideUpModal 0.3s ease-out',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
          boxSizing: 'border-box',
        }}
      >
        {/* Top drag bar indicator */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: '#CBD5E1',
            borderRadius: '2px',
            margin: '0 auto 18px',
          }}
        />

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#DCFCE7',
                color: 'var(--color-accent, #16A34A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 6px' }}>
              Notifikasi Berhasil Diaktifkan!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>
              Anda akan menerima info tagihan dan pengumuman terbaru langsung di HP Anda.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #174D7F 0%, #1E3A8A 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(23,77,127,0.25)',
                }}
              >
                <BellRing size={24} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 4px' }}>
                  Aktifkan Notifikasi Portal
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0, lineHeight: 1.4 }}>
                  Jangan lewatkan informasi penting pondok dan tagihan santri.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-low, #94A3B8)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Benefit list */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '22px',
              }}
            >
              {[
                {
                  icon: <ReceiptText size={18} style={{ color: 'var(--color-primary)' }} />,
                  title: 'Tagihan Baru Terbit',
                  desc: 'Pemberitahuan instan saat SPP bulanan atau tagihan baru diterbitkan.',
                },
                {
                  icon: <CreditCard size={18} style={{ color: '#16A34A' }} />,
                  title: 'Konfirmasi Pembayaran',
                  desc: 'Notifikasi otomatis saat pembayaran transfer/VA berhasil diterima.',
                },
                {
                  icon: <Megaphone size={18} style={{ color: '#D97706' }} />,
                  title: 'Pengumuman & Agenda',
                  desc: 'Info jadwal liburan, kepulangan, dan surat resmi pesantren.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 2px' }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: '11.5px', color: 'var(--color-text-medium)', margin: 0, lineHeight: 1.35 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleEnable}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--color-primary, #174D7F)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(23,77,127,0.25)',
                }}
              >
                {loading ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  color: 'var(--color-text-medium)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Nanti Saja
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
