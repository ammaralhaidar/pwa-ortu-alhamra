'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { getUser, getActiveSiswaId, updateActiveSiswa, logout, isCalonOrangtua, getCalonSiswaId } from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';

interface DashboardData {
  siswa_info: { id: number; name: string };
  overview_keuangan: {
    total_tagihan_aktif: number;
    saldo_uang_saku: number;
    saldo_dompet_kantin: number;
  };
  overview_kesantrian: {
    setoran_terakhir: string;
    total_baris_disetor: number;
    pencapaian_tahfidz?: string;
  };
}

interface SiswaOption { id: number; name: string; nis: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState] = useState(getUser());
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [siswas, setSiswas] = useState<SiswaOption[]>([]);
  const [activeSiswaId, setActiveSiswaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSiswaModal, setShowSiswaModal] = useState(false);

  const isCalon = isCalonOrangtua();
  const calonSiswaId = getCalonSiswaId();

  useEffect(() => {
    setMounted(true);
    if (!user) { router.replace('/login'); return; }
    if (isCalonOrangtua()) { setTimeout(() => setLoading(false), 0); return; }
    fetchSiswaList();
  }, []);

  const displayUser = mounted ? user : null;

  async function fetchSiswaList() {
    try {
      const res = await fetch('/odoo/api/v1/siswa/list', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data?.length) {
        setSiswas(data.data);
        const activeId = getActiveSiswaId() || data.data[0].id;
        setActiveSiswaId(activeId);
        updateActiveSiswa(activeId);
        fetchDashboard(activeId);
      } else {
        fetchDashboard(null);
      }
    } catch {
      fetchDashboard(null);
    }
  }

  const fetchDashboard = async (siswaId: number | null) => {
    setLoading(true);
    try {
      const url = siswaId
        ? `/odoo/api/v1/dashboard/overview?siswa_id=${siswaId}`
        : `/odoo/api/v1/dashboard/overview`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSiswaChange = (siswaId: number) => {
    setActiveSiswaId(siswaId);
    updateActiveSiswa(siswaId);
    fetchDashboard(siswaId);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const keuangan = dashboard?.overview_keuangan;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <header style={{
        background: 'var(--color-primary)',
        padding: '16px 20px 20px',
        borderRadius: '0 0 24px 24px',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Image src="/logo-square.png" alt="IBS Al Hamra" width={36} height={36} style={{ borderRadius: '8px', background: '#ffffff', padding: '4px' }} />
          <button 
            onClick={() => setShowLogoutModal(true)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(239, 68, 68, 0.2)', 
              border: '1px solid rgba(239, 68, 68, 0.4)', 
              borderRadius: '12px', 
              padding: '6px 12px', 
              color: '#FECACA', 
              fontSize: '13px', 
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Keluar
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '2px' }}>
          Assalamu&apos;alaikum,
        </p>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
          {displayUser?.name || 'Wali Santri'}
        </h1>
        
        {/* Siswa Selector */}
        {!isCalon && (
        <div 
          onClick={() => siswas.length > 1 && setShowSiswaModal(true)} 
          style={{ 
            background: 'rgba(255,255,255,0.12)', 
            borderRadius: '12px', 
            padding: '10px 14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '10px',
            cursor: siswas.length > 1 ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {siswas.find(s => s.id === activeSiswaId)?.name || dashboard?.siswa_info?.name || 'Memuat...'}
            </span>
          </div>
          {siswas.length > 1 && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          )}
        </div>
        )}
      </header>

      <main className="main-content" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>

        {isCalon ? (
          <div style={{ padding: '20px 20px 0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '12px' }}>
              Pendaftaran Santri
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Card 1: Tagihan Daftar Ulang */}
              <Link href="/keuangan/tagihan-calon" style={{
                background: 'var(--color-surface)', borderRadius: '16px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEF2F2', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 2px' }}>Tagihan Daftar Ulang</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>Lihat dan bayar tagihan pendaftaran</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
        
              {/* Card 2: Lengkapi Data */}
              <Link href="/calon-siswa" style={{
                background: 'var(--color-surface)', borderRadius: '16px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 2px' }}>Lengkapi Data Calon Siswa</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>Isi data diri, alamat, dan orang tua</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Keuangan Section */}
            <div style={{ padding: '20px 20px 0' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '12px' }}>
                Ringkasan Keuangan
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Link href="/keuangan/tagihan" style={{ gridColumn: '1 / -1', background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: keuangan?.total_tagihan_aktif ? '1px solid #FEE2E2' : '1px solid var(--color-border)', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', marginBottom: '4px' }}>Total Tagihan Aktif</p>
                      {loading ? (
                        <div style={{ height: '28px', width: '140px', background: '#E2E8F0', borderRadius: '8px' }} />
                      ) : (
                        <p style={{ fontSize: '22px', fontWeight: 700, color: keuangan?.total_tagihan_aktif ? 'var(--color-danger)' : 'var(--color-accent)', margin: 0 }} className="rupiah">
                          {formatRupiah(keuangan?.total_tagihan_aktif || 0)}
                        </p>
                      )}
                    </div>
                    <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Bayar →
                    </div>
                  </div>
                </Link>
    
                <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', marginBottom: '4px' }}>Uang Saku</p>
                  {loading ? <div style={{ height: '22px', width: '80px', background: '#E2E8F0', borderRadius: '6px' }} /> : (
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 10px' }} className="rupiah">
                      {formatRupiah(keuangan?.saldo_uang_saku || 0)}
                    </p>
                  )}
                  <Link href="/keuangan/uang-saku" style={{ display: 'block', textAlign: 'center', background: '#F0FDF4', color: 'var(--color-accent)', textDecoration: 'none', padding: '6px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #BBF7D0' }}>
                    Isi Saldo
                  </Link>
                </div>
    
                <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', marginBottom: '4px' }}>Dompet Kantin</p>
                  {loading ? <div style={{ height: '22px', width: '80px', background: '#E2E8F0', borderRadius: '6px' }} /> : (
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 10px' }} className="rupiah">
                      {formatRupiah(keuangan?.saldo_dompet_kantin || 0)}
                    </p>
                  )}
                  <Link href="/keuangan/kantin" style={{ display: 'block', textAlign: 'center', background: '#EFF6FF', color: 'var(--color-primary)', textDecoration: 'none', padding: '6px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #BFDBFE' }}>
                    Riwayat
                  </Link>
                </div>
              </div>
            </div>
    
            {/* Aktivitas Santri */}
            <div style={{ padding: '20px 20px 0' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '12px' }}>
                Aktivitas Kesantrian
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Card Khusus Tahfidz */}
                <Link href="/kesantrian/tahfidz" style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-high)', margin: 0 }}>Progress Tahfidz</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>Total Hafalan: <span style={{ fontWeight: 600, color: 'var(--color-text-high)' }}>{loading ? '...' : (dashboard?.overview_kesantrian?.pencapaian_tahfidz || '-')}</span></p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>Setoran Terakhir:</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', margin: 0 }}>{loading ? '...' : (dashboard?.overview_kesantrian?.setoran_terakhir || 'Belum ada setoran')}</p>
                  </div>
                </Link>
    
                {[
                  { label: 'Mutabaah Harian', value: 'Lihat Riwayat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>, href: '/kesantrian/mutabaah', color: '#3B82F6', bg: '#EFF6FF' },
                  /* Temporarily Hidden
                  { label: 'Kesehatan', value: 'Riwayat Pemeriksaan', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>, href: '/kesantrian/kesehatan', color: '#EC4899', bg: '#FDF2F8' },
                  { label: 'Pelanggaran', value: 'Histori & Poin', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, href: '/kesantrian/pelanggaran', color: '#F59E0B', bg: '#FFFBEB' },
                  */
                ].map((item, index) => (
                  <Link key={item.href + index} href={item.href} style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>{item.value}</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />

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

      {/* Custom Bottom Sheet Student Selector Modal */}
      {showSiswaModal && (
        <div onClick={() => setShowSiswaModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', maxHeight: '80dvh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '36px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 20px' }} />
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>Pilih Anak</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {siswas.map((siswa) => {
                const isActive = siswa.id === activeSiswaId;
                const initial = siswa.name ? siswa.name.charAt(0).toUpperCase() : '?';
                return (
                  <div 
                    key={siswa.id} 
                    onClick={() => {
                      handleSiswaChange(siswa.id);
                      setShowSiswaModal(false);
                    }} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '14px', 
                      borderRadius: '16px', 
                      background: isActive ? '#EFF6FF' : '#F8FAFC', 
                      border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: isActive ? 'var(--color-primary)' : '#E2E8F0', 
                      color: isActive ? '#fff' : '#64748B', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700,
                      fontSize: '15px'
                    }}>
                      {initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 2px', fontFamily: 'Inter, sans-serif' }}>
                        {siswa.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-low)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                        NIS: {siswa.nis || '-'}
                      </p>
                    </div>
                    {isActive && (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}