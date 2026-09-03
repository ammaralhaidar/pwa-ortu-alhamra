'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Share2, Megaphone, ArrowLeft, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import {
  PengumumanItem,
  fetchPengumumanDetail,
  markPengumumanAsRead,
} from '@/lib/pengumuman';
import { formatFullDateTime } from '@/lib/utils';

export default function PengumumanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [item, setItem] = useState<PengumumanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.replace('/kesantrian/pengumuman');
      return;
    }

    async function loadDetail() {
      setLoading(true);
      try {
        const data = await fetchPengumumanDetail(id);
        if (data) {
          setItem(data);
          markPengumumanAsRead(id);
        }
      } catch (err) {
        console.error('Failed to load pengumuman detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id, router]);

  const handleShare = async () => {
    if (!item) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.preview || item.title,
          url,
        });
      } catch {
        // Ignored if cancelled
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'kesantrian':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Kesantrian' };
      case 'akademik':
        return { bg: '#EFF6FF', color: '#1D4ED8', label: 'Akademik' };
      case 'keuangan':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Keuangan' };
      default:
        return { bg: '#F1F5F9', color: '#475569', label: 'Umum' };
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: '90px' }}>
      <PageHeader title="Detail Pengumuman" showBack={true} />

      <main className="main-content" style={{ padding: '16px', maxWidth: '640px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
            <div style={{ height: '220px', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', opacity: 0.6 }} />
            <div style={{ height: '32px', width: '60%', background: 'var(--color-surface)', borderRadius: '8px', opacity: 0.6 }} />
            <div style={{ height: '120px', background: 'var(--color-surface)', borderRadius: '16px', opacity: 0.6 }} />
          </div>
        ) : !item ? (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '20px',
              padding: '48px 20px',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
              marginTop: '20px',
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
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-high)', margin: '0 0 6px' }}>
              Pengumuman Tidak Ditemukan
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: '0 0 16px' }}>
              Pengumuman yang Anda cari mungkin sudah diarsipkan atau telah dihapus.
            </p>
            <button
              onClick={() => router.push('/kesantrian/pengumuman')}
              style={{
                background: 'var(--color-primary, #174D7F)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Kembali ke Daftar
            </button>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Banner Image */}
            {item.cover_image_url && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                }}
              >
                <Image
                  src={item.cover_image_url}
                  alt={item.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: '24px 20px' }}>
              {/* Badges & Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {item.is_pinned && (
                  <span
                    style={{
                      background: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    📌 PENTING
                  </span>
                )}
                {(() => {
                  const badge = getKategoriBadge(item.kategori);
                  return (
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '100px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {item.kategori_label || badge.label}
                    </span>
                  );
                })()}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#64748B',
                    fontSize: '12px',
                    marginLeft: 'auto',
                  }}
                >
                  <Calendar size={13} />
                  <span>{item.tanggal ? formatFullDateTime(item.tanggal) : '-'}</span>
                </div>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 12px',
                  lineHeight: 1.45,
                }}
              >
                {item.title}
              </h1>

              {/* Publisher Official Tag */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F8FAFC',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #F1F5F9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span>Diterbitkan resmi oleh <strong>Pesantren IBS Al Hamra</strong></span>
                </div>

                <button
                  onClick={handleShare}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#10B981' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
                  <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '20px' }} />

              {/* Full HTML Content */}
              <div
                className="pengumuman-full-content"
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.8,
                  color: '#334155',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: item.deskripsi || item.preview || '<p>Tidak ada rincian konten.</p>',
                }}
              />
            </div>

            {/* Action Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #F1F5F9',
                background: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => router.push('/kesantrian/pengumuman')}
                style={{
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={15} />
                Kembali ke Daftar
              </button>

              <button
                onClick={handleShare}
                style={{
                  background: 'var(--color-primary, #174D7F)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Share2 size={15} />
                Bagikan
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
