'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getActiveSiswaId } from '@/lib/auth';

const navItems = [
  {
    href: '/',
    label: 'Beranda',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/keuangan',
    label: 'Keuangan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/kesantrian',
    label: 'Kesantrian',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hasKeuanganNotif, setHasKeuanganNotif] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;
    const siswaId = getActiveSiswaId();
    const url = siswaId ? `/odoo/api/v1/dashboard/keuangan?siswa_id=${siswaId}` : '/odoo/api/v1/dashboard/keuangan';
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) {
          if (d.data.total_tagihan_aktif > 0 || d.data.jumlah_kode_bayar_aktif > 0) {
            setHasKeuanganNotif(true);
          } else {
            setHasKeuanganNotif(false);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname === '/login') return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '8px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-low)',
              transition: 'color 0.2s',
              minWidth: 60,
              position: 'relative'
            }}
          >
            {item.href === '/keuangan' && hasKeuanganNotif && (
              <div style={{ position: 'absolute', top: '8px', right: '18px', width: '8px', height: '8px', background: 'var(--color-danger)', borderRadius: '50%', border: '1.5px solid var(--color-surface)', zIndex: 2 }} />
            )}
            <span style={{ display: 'flex', opacity: isActive ? 1 : 0.6 }}>
              {item.icon}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.3px',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
