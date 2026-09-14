'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, ChevronRight, ChevronLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import {
  getUser,
  getActiveSiswaId,
  updateActiveSiswa,
  logout,
  isCalonOrangtua,
  getCalonSiswaId,
  getActiveCalonSiswaId,
  updateActiveCalonSiswa,
  getCalonSiswaList,
  updateCalonSiswaList,
  CalonSiswaSummary,
} from '@/lib/auth';
import { formatRupiah, formatShortDate } from '@/lib/utils';
import {
  PengumumanItem,
  fetchPengumumanList,
  getReadPengumumanIds,
  markPengumumanAsRead,
  isPengumumanRead,
} from '@/lib/pengumuman';
import { apiFetch } from '@/lib/api';

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
  const [calonList, setCalonList] = useState<CalonSiswaSummary[]>([]);
  const [activeCalonId, setActiveCalonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Pengumuman state
  const [pengumumanList, setPengumumanList] = useState<PengumumanItem[]>([]);
  const [loadingPengumuman, setLoadingPengumuman] = useState(true);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [activePengumumanIdx, setActivePengumumanIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSiswaModal, setShowSiswaModal] = useState(false);

  const isCalon = isCalonOrangtua();

  useEffect(() => {
    setMounted(true);
    setReadIds(getReadPengumumanIds());
    loadPengumuman();
    if (!user) { router.replace('/login'); return; }
    if (isCalonOrangtua()) {
      fetchCalonSiswaList();
      return;
    }
    fetchSiswaList();
  }, []);

  async function fetchCalonSiswaList() {
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; data: CalonSiswaSummary[] }>('/api/v1/calon-siswa/list');
      if (data?.success && data?.data?.length) {
        setCalonList(data.data);
        updateCalonSiswaList(data.data);
        const currActive = getActiveCalonSiswaId() || data.data[0].id;
        setActiveCalonId(currActive);
      } else {
        const localList = getCalonSiswaList();
        setCalonList(localList);
        if (localList.length > 0) setActiveCalonId(localList[0].id);
      }
    } catch {
      const localList = getCalonSiswaList();
      setCalonList(localList);
      if (localList.length > 0) setActiveCalonId(localList[0].id);
    } finally {
      setLoading(false);
    }
  }

  const displayUser = mounted ? user : null;

  async function loadPengumuman() {
    setLoadingPengumuman(true);
    try {
      const data = await fetchPengumumanList(undefined, 3);
      setPengumumanList(data);
    } catch {
      setPengumumanList([]);
    } finally {
      setLoadingPengumuman(false);
    }
  }

  async function fetchSiswaList() {
    try {
      const data = await apiFetch<{ success: boolean; data: SiswaOption[] }>('/api/v1/siswa/list');
      if (data?.success && data?.data?.length) {
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
      const path = siswaId
        ? `/api/v1/dashboard/overview?siswa_id=${siswaId}`
        : `/api/v1/dashboard/overview`;
      const data = await apiFetch<{ success: boolean; data: DashboardData }>(path);
      if (data?.success) setDashboard(data.data);
    } catch { /* session expired or error handled */ }
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

  if (!mounted) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
        <header style={{
          background: 'var(--color-primary)',
          padding: '16px 20px 20px',
          borderRadius: '0 0 24px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: '70px', height: '30px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div style={{ width: '120px', height: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '6px' }} />
          <div style={{ width: '180px', height: '22px', background: 'rgba(255,255,255,0.3)', borderRadius: '6px', marginBottom: '16px' }} />
          <div style={{ height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px' }} />
        </header>
        <main
          className="main-content"
          style={{
            paddingTop: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingBottom: 'calc(var(--bottom-nav-height) + 28px + env(safe-area-inset-bottom))',
          }}
        >
          <div style={{ height: '90px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '16px', opacity: 0.6 }} />
          <div style={{ height: '140px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', opacity: 0.6 }} />
        </main>
      </div>
    );
  }

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
        
        {/* Siswa Selector for Regular Santri */}
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

        {/* Calon Santri Info Badge for Calon Orang Tua (Header Bar) */}
        {isCalon && (
          <div 
            style={{ 
              background: 'rgba(255,255,255,0.12)', 
              borderRadius: '12px', 
              padding: '10px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '15px' }}>📋</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Portal Pendaftaran Santri Baru
              </span>
            </div>
            {calonList.length > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                {calonList.length} Calon Santri
              </span>
            )}
          </div>
        )}
      </header>

      <main
        className="main-content"
        style={{
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: 'calc(var(--bottom-nav-height) + 28px + env(safe-area-inset-bottom))',
        }}
      >

        {/* Pengumuman Widget Section */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-high)', margin: 0 }}>
                Pengumuman
              </h2>
              {pengumumanList.filter(p => !readIds.includes(p.id)).length > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px' }}>
                  {pengumumanList.filter(p => !readIds.includes(p.id)).length} Baru
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pengumumanList.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setActivePengumumanIdx(prev => (prev - 1 + pengumumanList.length) % pengumumanList.length)}
                    aria-label="Pengumuman sebelumnya"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-text-medium)',
                      padding: 0,
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setActivePengumumanIdx(prev => (prev + 1) % pengumumanList.length)}
                    aria-label="Pengumuman berikutnya"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-text-medium)',
                      padding: 0,
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <Link
                href="/kesantrian/pengumuman"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary, #174D7F)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                Lihat Semua
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {loadingPengumuman ? (
            <div style={{ height: '88px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', opacity: 0.6 }} />
          ) : pengumumanList.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-medium)', fontSize: '13px' }}>
              Belum ada pengumuman terbaru.
            </div>
          ) : (() => {
            const item = pengumumanList[activePengumumanIdx] || pengumumanList[0];
            const isRead = readIds.includes(item.id);
            const isPinned = item.is_pinned;

            return (
              <div
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null || pengumumanList.length <= 1) return;
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartX - touchEndX;
                  if (diff > 40) {
                    setActivePengumumanIdx(prev => (prev + 1) % pengumumanList.length);
                  } else if (diff < -40) {
                    setActivePengumumanIdx(prev => (prev - 1 + pengumumanList.length) % pengumumanList.length);
                  }
                  setTouchStartX(null);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {/* Active Card */}
                <div
                  onClick={() => router.push(`/kesantrian/pengumuman/${item.id}`)}
                  style={{
                    background: isPinned
                      ? 'linear-gradient(180deg, #FFFDF5 0%, #FFFFFF 100%)'
                      : 'var(--color-surface)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: isPinned ? '1.5px solid #FDE68A' : '1px solid var(--color-border)',
                    boxShadow: isPinned
                      ? '0 4px 12px rgba(245, 158, 11, 0.08)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {!isRead && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                      }}
                    />
                  )}

                  {item.cover_image_url ? (
                    <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                      <Image src={item.cover_image_url} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isPinned ? '#FEF3C7' : '#EFF6FF',
                        color: isPinned ? '#D97706' : 'var(--color-primary, #174D7F)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPinned ? <span style={{ fontSize: '18px' }}>📌</span> : <Megaphone size={20} />}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      {isPinned && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: '4px' }}>
                          PENTING
                        </span>
                      )}
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary, #174D7F)', textTransform: 'uppercase' }}>
                        {item.kategori_label || item.kategori}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-low)' }}>•</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-medium)' }}>
                        {item.tanggal ? formatShortDate(item.tanggal) : '-'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: isRead ? 600 : 700, color: 'var(--color-text-high)', margin: '0 0 3px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.preview || 'Klik untuk membaca detail selengkapnya'}
                    </p>
                  </div>
                </div>

                {/* Carousel Pagination Dots */}
                {pengumumanList.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {pengumumanList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePengumumanIdx(idx)}
                        aria-label={`Slide ${idx + 1}`}
                        style={{
                          width: activePengumumanIdx === idx ? '16px' : '6px',
                          height: '6px',
                          borderRadius: '100px',
                          background: activePengumumanIdx === idx ? 'var(--color-primary, #174D7F)' : '#CBD5E1',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* CALON ORANG TUA SECTION (OPTION C HYBRID PROGRESS DASHBOARD) */}
        {isCalon ? (
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-high)', margin: 0 }}>
                Status Pendaftaran Santri Baru
              </h2>
              {calonList.length > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary, #174D7F)', background: '#EFF6FF', padding: '3px 8px', borderRadius: '8px' }}>
                  {calonList.length} Calon Santri
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '140px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', opacity: 0.6 }} />
              </div>
            ) : calonList.length === 0 ? (
              <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '24px 16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '14px', margin: 0 }}>Belum ada data calon santri yang terhubung dengan akun Anda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {calonList.map((c) => {
                  const isLunas = c.state === 'lunas' || c.state === 'sudah_dimigrasi';
                  const isDitagih = c.state === 'sudah_ditagih';
                  const isDiterima = c.state === 'diterima';
                  const isDataComplete = c.is_data_complete;

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--color-surface)',
                        borderRadius: '20px',
                        padding: '18px',
                        border: isLunas
                          ? '1.5px solid #BBF7D0'
                          : (isDitagih ? '1.5px solid #FED7AA' : '1px solid var(--color-border)'),
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Accent Stripe */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: isLunas
                            ? '#16A34A'
                            : (isDitagih ? '#F59E0B' : 'var(--color-primary, #174D7F)'),
                        }}
                      />

                      {/* Header Card: Nama, NIS, Jenjang */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: isLunas ? '#DCFCE7' : '#EFF6FF',
                              color: isLunas ? '#15803D' : 'var(--color-primary, #174D7F)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '16px',
                              flexShrink: 0,
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 2px' }}>
                              {c.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-low)' }}>
                                NIS: {c.nis}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-low)' }}>•</span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4338CA', background: '#EEF2FF', padding: '1px 6px', borderRadius: '4px' }}>
                                {c.jenjang_display || c.jenjang?.toUpperCase() || 'Pendaftaran'}
                              </span>
                              {c.tahunajaran_name && (
                                <span style={{ fontSize: '11px', color: 'var(--color-text-medium)' }}>
                                  TA {c.tahunajaran_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div>
                          {isLunas ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                              ✓ Lunas
                            </span>
                          ) : isDitagih ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                              ⏳ Menunggu Bayar
                            </span>
                          ) : isDiterima ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4338CA', background: '#EEF2FF', padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                              📋 Diterima
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                              📝 Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Checklist Summary */}
                      <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-medium)' }}>
                            Kelengkapan Pendaftaran
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isLunas ? '#16A34A' : 'var(--color-primary, #174D7F)' }}>
                            {c.progress_pct || (isLunas && isDataComplete ? 100 : (isDataComplete || isLunas ? 50 : 25))}%
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${c.progress_pct || (isLunas && isDataComplete ? 100 : (isDataComplete || isLunas ? 50 : 25))}%`,
                              background: isLunas ? '#16A34A' : 'var(--color-primary, #174D7F)',
                              borderRadius: '100px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>

                        {/* Checklist Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isDataComplete ? '#15803D' : '#94A3B8' }}>
                            <span>{isDataComplete ? '✓' : '○'}</span>
                            <span style={{ fontWeight: isDataComplete ? 600 : 400 }}>Data Diri {isDataComplete ? 'Lengkap' : 'Belum'}</span>
                          </div>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isLunas ? '#15803D' : (isDitagih ? '#B45309' : '#94A3B8') }}>
                            <span>{isLunas ? '✓' : '○'}</span>
                            <span style={{ fontWeight: isLunas ? 600 : 400 }}>Daftar Ulang {isLunas ? 'Lunas' : (isDitagih ? 'Ditagih' : 'Belum')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          onClick={() => {
                            updateActiveCalonSiswa(c.id);
                            setActiveCalonId(c.id);
                            router.push('/calon-siswa');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: !isDataComplete ? 'var(--color-primary, #174D7F)' : '#EFF6FF',
                            color: !isDataComplete ? '#ffffff' : 'var(--color-primary, #174D7F)',
                            border: '1px solid ' + (!isDataComplete ? 'var(--color-primary, #174D7F)' : '#BFDBFE'),
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                          {!isDataComplete ? 'Lengkapi Berkas' : 'Lihat Berkas'}
                        </button>

                        <button
                          onClick={() => {
                            updateActiveCalonSiswa(c.id);
                            setActiveCalonId(c.id);
                            router.push('/keuangan/tagihan-calon');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: isDitagih && !isLunas ? '#FEF2F2' : (isLunas ? '#F0FDF4' : '#F8FAFC'),
                            color: isDitagih && !isLunas ? 'var(--color-danger)' : (isLunas ? '#15803D' : '#64748B'),
                            border: '1px solid ' + (isDitagih && !isLunas ? '#FCA5A5' : (isLunas ? '#BBF7D0' : '#E2E8F0')),
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                          {isLunas ? 'Tagihan Lunas ✓' : (isDitagih ? 'Bayar Tagihan →' : 'Tagihan')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Keuangan Section */}
            <div style={{ padding: '20px 16px 0' }}>
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
            <div style={{ padding: '20px 16px 0' }}>
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px 24px calc(24px + env(safe-area-inset-bottom))', maxHeight: '80dvh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }}>
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
                      {isActive && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </div>
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