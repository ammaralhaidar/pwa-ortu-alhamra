'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import {
  SESSION_EXPIRED_EVENT,
  checkSessionStatus,
  subscribeSessionExpired,
  resetSessionExpired,
} from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

export default function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeSessionExpired((expired) => {
      // Don't show modal if already on login page
      if (pathname === '/login') return;
      if (expired) {
        setIsOpen(true);
      }
    });

    // Silent session check ONLY when app returns from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname !== '/login' && isLoggedIn()) {
        checkSessionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  const handleReLogin = () => {
    setIsOpen(false);
    resetSessionExpired();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ibs_pwa_user');
    }
    router.replace('/login');
  };

  if (!isOpen || pathname === '/login') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px 24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#174D7F',
            boxShadow: '0 4px 12px rgba(23, 77, 127, 0.12)',
          }}
        >
          <Lock size={32} strokeWidth={2.2} />
        </div>

        <h3
          style={{
            fontSize: '19px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          Sesi Anda Telah Berakhir
        </h3>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#64748B',
            marginBottom: '24px',
          }}
        >
          Demi keamanan data ananda dan privasi akun Anda, sesi telah selesai. Silakan masuk kembali ke akun Anda.
        </p>

        <button
          type="button"
          onClick={handleReLogin}
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: '#174D7F',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(23, 77, 127, 0.25)',
          }}
        >
          Masuk Kembali
        </button>
      </div>
    </div>
  );
}
