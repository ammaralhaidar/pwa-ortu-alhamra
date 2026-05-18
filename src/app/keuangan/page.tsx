'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';

export default function KeuanganPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    const url = siswaId ? `/odoo/api/v1/dashboard/keuangan?siswa_id=${siswaId}` : '/odoo/api/v1/dashboard/keuangan';
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const menus = [
    { 
      label: 'Tagihan', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>, 
      href: '/keuangan/tagihan', color: '#3B82F6', bg: '#EFF6FF', 
      desc: data ? `Total Tagihan: ${formatRupiah(data.total_tagihan_aktif || 0)}` : 'Memuat...',
      hasBadge: false
    },
    { 
      label: 'Uang Saku', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, 
      href: '/keuangan/uang-saku', color: '#16A34A', bg: '#F0FDF4', 
      desc: data ? `Saldo: ${formatRupiah(data.saldo_uang_saku || 0)}` : 'Memuat...',
      hasBadge: false
    },
    { 
      label: 'Kantin', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>, 
      href: '/keuangan/kantin', color: '#F97316', bg: '#FFF7ED', 
      desc: 'Cek Riwayat Belanja di Kantin',
      hasBadge: false
    },
    { 
      label: 'Menunggu Pembayaran', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>, 
      href: '/keuangan/menunggu-pembayaran', color: '#D97706', bg: '#FFFBEB', 
      desc: data ? (data.jumlah_kode_bayar_aktif > 0 ? `${data.jumlah_kode_bayar_aktif} Kode Bayar Aktif` : 'Tidak ada kode aktif') : 'Memuat...',
      hasBadge: data ? data.jumlah_kode_bayar_aktif > 0 : false
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Keuangan" showBack={false} />
      <main className="main-content" style={{ padding: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', marginBottom: '20px' }}>
          Kelola tagihan dan keuangan santri dari sini.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menus.map((m) => (
            <Link key={m.href} href={m.href} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px',
              padding: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {m.hasBadge && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '10px', height: '10px', background: 'var(--color-danger)', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{m.label}</p>
                <p style={{ fontSize: '13px', color: m.hasBadge ? 'var(--color-danger)' : 'var(--color-text-medium)', margin: 0, fontWeight: m.hasBadge ? 600 : 400 }}>{loading ? 'Memuat...' : m.desc}</p>
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
