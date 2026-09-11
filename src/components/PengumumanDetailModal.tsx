'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, Calendar, Megaphone } from 'lucide-react';
import { PengumumanItem } from '@/lib/pengumuman';
import { formatFullDateTime } from '@/lib/utils';

interface PengumumanDetailModalProps {
  item: PengumumanItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PengumumanDetailModal({
  item,
  isOpen,
  onClose,
}: PengumumanDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

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

  const badge = getKategoriBadge(item.kategori);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#EFF6FF',
                color: 'var(--color-primary, #174D7F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Megaphone size={18} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
              Pengumuman Resmi
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Cover Image Banner if Available */}
          {item.cover_image_url && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#F8FAFC',
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

          {/* Badges & Meta Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            {item.title}
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#475569',
              padding: '6px 12px',
              background: '#F8FAFC',
              borderRadius: '8px',
              width: 'fit-content',
            }}
          >
            <span>Oleh: <strong>Pesantren IBS Al Hamra</strong></span>
          </div>

          {/* Separator */}
          <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

          {/* HTML Description Content */}
          <div
            className="pengumuman-content"
            style={{
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#334155',
            }}
            dangerouslySetInnerHTML={{
              __html: item.deskripsi || item.preview || '<p>Tidak ada rincian konten.</p>',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#FAFAFA',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-primary, #174D7F)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
