'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Megaphone, Calendar, Filter, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { formatDateTime } from '@/lib/utils';
import {
  PengumumanItem,
  fetchPengumumanList,
  getReadPengumumanIds,
  markPengumumanAsRead,
} from '@/lib/pengumuman';

const CATEGORIES = [
  { id: 'semua', label: 'Semua' },
  { id: 'pinned', label: '📌 Penting' },
  { id: 'akademik', label: 'Akademik' },
  { id: 'kesantrian', label: 'Kesantrian' },
  { id: 'keuangan', label: 'Keuangan' },
  { id: 'umum', label: 'Umum' },
];

export default function PengumumanListPage() {
  const router = useRouter();
  const [items, setItems] = useState<PengumumanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState<number[]>([]);

  useEffect(() => {
    setReadIds(getReadPengumumanIds());
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchPengumumanList();
      setItems(data);
    } catch (err) {
      console.error('Failed to load pengumuman:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetail = (item: PengumumanItem) => {
    markPengumumanAsRead(item.id);
    router.push(`/kesantrian/pengumuman/${item.id}`);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory === 'pinned' && !item.is_pinned) {
        return false;
      }
      if (
        selectedCategory !== 'semua' &&
        selectedCategory !== 'pinned' &&
        item.kategori !== selectedCategory
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPreview = (item.preview || '').toLowerCase().includes(q);
        const matchKategori = (item.kategori_label || item.kategori).toLowerCase().includes(q);
        if (!matchTitle && !matchPreview && !matchKategori) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !readIds.includes(item.id)).length;
  }, [items, readIds]);

  const getKategoriStyle = (kategori: string) => {
    switch (kategori) {
      case 'kesantrian':
        return { bg: '#FEF3C7', color: '#B45309' };
      case 'akademik':
        return { bg: '#EFF6FF', color: '#1D4ED8' };
      case 'keuangan':
        return { bg: '#DCFCE7', color: '#15803D' };
      default:
        return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: '80px' }}>
      <PageHeader title="Pengumuman" showBack={true} />

      <main className="main-content" style={{ padding: '16px' }}>
        {/* Banner Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            borderRadius: '18px',
            padding: '16px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '1px solid #BFDBFE',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'var(--color-primary, #174D7F)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Megaphone size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3A8A', margin: 0 }}>
                Pengumuman Resmi
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '100px',
                  }}
                >
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#1E40AF', margin: '2px 0 0', opacity: 0.85 }}>
              Surat edaran, kalender kegiatan, dan info resmi Pesantren IBS Al Hamra.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: '12px',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 42px',
              borderRadius: '14px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '13px',
              color: 'var(--color-text-high)',
              outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '14px',
            scrollbarWidth: 'none',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive
                    ? '1.5px solid var(--color-primary, #174D7F)'
                    : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-primary, #174D7F)' : 'var(--color-surface)',
                  color: isActive ? '#ffffff' : 'var(--color-text-medium)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '96px',
                  background: 'var(--color-surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '20px',
              padding: '40px 20px',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#F1F5F9',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Megaphone size={28} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 4px' }}>
              Tidak ada pengumuman
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>
              {searchQuery
                ? `Tidak ditemukan pengumuman dengan kata kunci "${searchQuery}"`
                : 'Belum ada pengumuman untuk kategori yang dipilih.'}
            </p>
            {(searchQuery || selectedCategory !== 'semua') && (
              <button
                onClick={() => {
                  setSelectedCategory('semua');
                  setSearchQuery('');
                }}
                style={{
                  marginTop: '14px',
                  background: '#F1F5F9',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-primary, #174D7F)',
                  cursor: 'pointer',
                }}
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map((item) => {
              const isRead = readIds.includes(item.id);
              const isPinned = item.is_pinned;
              const katStyle = getKategoriStyle(item.kategori);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  style={{
                    background: isPinned
                      ? 'linear-gradient(180deg, #FFFDF5 0%, #FFFFFF 100%)'
                      : 'var(--color-surface)',
                    borderRadius: '18px',
                    padding: '16px',
                    border: isPinned ? '1.5px solid #FDE68A' : '1px solid var(--color-border)',
                    boxShadow: isPinned
                      ? '0 4px 12px rgba(245, 158, 11, 0.08)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPinned && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#B45309',
                            background: '#FEF3C7',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          📌 PENTING
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: katStyle.color,
                          background: katStyle.bg,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.kategori_label || item.kategori}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: 'var(--color-text-medium)',
                        }}
                      >
                        <Calendar size={12} />
                        <span>{item.tanggal ? formatDateTime(item.tanggal) : '-'}</span>
                      </div>
                      {!isRead && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#3B82F6',
                            flexShrink: 0,
                          }}
                          title="Belum dibaca"
                        />
                      )}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {item.cover_image_url && (
                      <div
                        style={{
                          position: 'relative',
                          width: '72px',
                          height: '72px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <Image
                          src={item.cover_image_url}
                          alt={item.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: isRead ? 600 : 700,
                          color: 'var(--color-text-high)',
                          margin: '0 0 4px',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-medium)',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.preview || 'Klik untuk membaca detail pengumuman lengkap...'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Footer Label */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '8px',
                      fontSize: '11px',
                      color: 'var(--color-text-low)',
                    }}
                  >
                    <span>Pesantren IBS Al Hamra</span>
                    <span style={{ color: 'var(--color-primary, #174D7F)', fontWeight: 600 }}>
                      Baca Selengkapnya →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
