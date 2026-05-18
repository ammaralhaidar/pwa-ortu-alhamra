'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';

const menus = [
  { 
    label: 'Tahfidz', desc: 'Riwayat setoran hafalan Al-Quran', 
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>, 
    href: '/kesantrian/tahfidz', color: '#16A34A', bg: '#F0FDF4' 
  },
  { 
    label: 'Mutabaah', desc: 'Laporan aktivitas harian santri', 
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>, 
    href: '/kesantrian/mutabaah', color: '#3B82F6', bg: '#EFF6FF' 
  },
  { 
    label: 'Kesehatan', desc: 'Riwayat pemeriksaan medis UKS', 
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>, 
    href: '/kesantrian/kesehatan', color: '#EC4899', bg: '#FDF2F8' 
  },
  { 
    label: 'Pelanggaran', desc: 'Histori kedisiplinan & poin', 
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, 
    href: '/kesantrian/pelanggaran', color: '#F59E0B', bg: '#FFFBEB' 
  },
];

export default function KesantrianPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Kesantrian" showBack={false} />
      <main className="main-content" style={{ padding: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', marginBottom: '20px' }}>
          Pantau aktivitas dan perkembangan santri secara real-time.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menus.map(m => (
            <Link key={m.href} href={m.href} style={{ 
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', 
              padding: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{m.label}</p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>{m.desc}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
