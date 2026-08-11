'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import CountdownTimer from '@/components/CountdownTimer';
import PanduanPembayaran from '@/components/PanduanPembayaran';
import PanduanBankLainTab from '@/components/PanduanBankLainTab';
import { formatRupiah, formatFullDateTime } from '@/lib/utils';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribePush,
  sendSubscriptionToServer,
  showLocalNotification,
} from '@/lib/push';

function SuksesContent() {
  const params = useSearchParams();
  const va = params.get('va') || '';
  const kodeBayar = params.get('kode_bayar') || '';
  const total = Number(params.get('total') || 0);
  const admin = Number(params.get('admin') || 0);
  const expired = params.get('expired') || '';
  const metode = params.get('metode') || 'bsi';
  const [showDetail, setShowDetail] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const perm = await requestNotificationPermission();
        if (perm !== 'granted') return;

        const reg = await registerServiceWorker();
        if (!reg) return;

        const sub = await subscribePush(reg);
        if (sub) {
          await sendSubscriptionToServer(sub);
        }

        showLocalNotification(
          'Kode Bayar Berhasil Dibuat',
          'Segera selesaikan pembayaran sebelum batas waktu.'
        );
      } catch (e: any) {
        console.error('Push setup error:', e);
      }
    })();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const noRekeningBsi = `9005065${kodeBayar}`;

  return (
    <>
      <style>{`@keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Menunggu Pembayaran" />
      <main style={{ padding: '16px', paddingBottom: '32px' }}>
        {/* Success Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f3659 100%)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '20px',
          color: '#fff',
        }}>
          <div style={{ marginBottom: '8px', animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
            <CheckCircle size={56} color="#16A34A" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', margin: '0 0 4px' }}>
            Kode Bayar Berhasil Dibuat
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Segera lakukan pembayaran sebelum batas waktu.
          </p>
        </div>

        {metode === 'bsi' ? (
          /* ======= TAMPILAN BSI ======= */
          <>
            {/* Detail Pembayaran */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: '20px', padding: '20px',
              border: '2px solid var(--color-primary)', marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(23,77,127,0.12)',
            }}>
              <div style={{
                background: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)',
                  padding: '4px 6px', flexShrink: 0
                }}>
                  <img src="/logos/bsi.svg" alt="BSI" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 2px' }}>Kode Bayar (BSI)</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '1px', margin: 0 }}>
                      {kodeBayar}
                    </p>
                    <button
                      onClick={() => copyToClipboard(kodeBayar, 'bsi-kode')}
                      style={{
                        background: copiedKey === 'bsi-kode' ? '#16A34A' : 'transparent',
                        border: copiedKey === 'bsi-kode' ? 'none' : '1.5px solid var(--color-primary)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        color: copiedKey === 'bsi-kode' ? '#fff' : 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {copiedKey === 'bsi-kode' ? '✓ Tersalin!' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 8px' }}>Sisa Waktu Pembayaran</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {expired ? <CountdownTimer targetDateStr={expired} /> : <p style={{ color: 'var(--color-text-medium)' }}>-</p>}
                </div>
              </div>

              {expired && (
                <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '12px', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  Batas Waktu: {formatFullDateTime(expired)}
                </p>
              )}

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <button
                  onClick={() => setShowDetail(true)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    color: 'var(--color-text-medium)',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  Lihat Detail Transaksi
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Panduan BSI Inline */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: '16px', padding: '20px',
              border: '1px solid var(--color-border)', marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
                Cara Bayar via BSI
              </h4>
              <ol style={{ fontSize: '13px', color: 'var(--color-text-high)', paddingLeft: '20px', lineHeight: 1.7, margin: 0 }}>
                <li>Buka Aplikasi <strong>Byond by BSI</strong>, pilih <strong>Bayar dan Beli</strong>.</li>
                <li>Pilih <strong>Akademik</strong>.</li>
                <li>Masukkan kode <strong>5065</strong> atau <strong>Islamic Boarding School Al Hamra</strong>.</li>
                <li>Masukkan <strong>Kode Bayar</strong> Anda: <strong>{kodeBayar}</strong>.</li>
                <li>Nominal otomatis terisi. Pastikan data benar, masukkan PIN dan selesai.</li>
              </ol>
            </div>
          </>
        ) : (
          /* ======= TAMPILAN SELAIN BSI (NON-BSI REDESIGN) ======= */
          <>
            {/* Warning Banner Top */}
            <div style={{
              background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '12px',
              padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: '13px', color: '#78350F', margin: 0, fontWeight: 700 }}>
                  Pembayaran via Transfer Bank Lain (BCA, Mandiri, BNI, BRI, dll)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', paddingLeft: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}>
                  <img src="/logos/bca.svg" alt="BCA" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}>
                  <img src="/logos/mandiri.svg" alt="Mandiri" style={{ height: '8px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}>
                  <img src="/logos/bni.svg" alt="BNI" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}>
                  <img src="/logos/bri.svg" alt="BRI" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>
            </div>

            {/* HERO ACTION BOX NON-BSI */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', borderRadius: '20px', padding: '20px',
              border: '2px solid #FCD34D', marginBottom: '16px',
              boxShadow: '0 4px 20px rgba(217,119,6,0.15)',
            }}>
              {/* Rekening Tujuan BSI */}
              <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px dashed #FCD34D' }}>
                <p style={{ fontSize: '11px', color: '#92400E', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Nomor Rekening Tujuan (BSI)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#78350F', letterSpacing: '0.5px', margin: 0, wordBreak: 'break-all' }}>
                    {noRekeningBsi}
                  </p>
                  <button
                    onClick={() => copyToClipboard(noRekeningBsi, 'lain-rek')}
                    style={{
                      background: copiedKey === 'lain-rek' ? '#16A34A' : '#D97706',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedKey === 'lain-rek' ? '✓ Tersalin!' : 'Salin Rekening'}
                  </button>
                </div>
              </div>

              {/* Nominal Transfer Pas */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#991B1B', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Nominal Transfer (Harus Sama Persis)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#991B1B', letterSpacing: '0.5px', margin: 0 }} className="rupiah">
                    {formatRupiah(total)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(String(total), 'lain-total')}
                    style={{
                      background: copiedKey === 'lain-total' ? '#16A34A' : '#DC2626',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedKey === 'lain-total' ? '✓ Tersalin!' : 'Salin Nominal'}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#991B1B', margin: '6px 0 0', opacity: 0.9 }}>
                  *Sudah termasuk biaya admin {formatRupiah(admin)}.
                </p>
              </div>

              {/* Countdown + Batas Waktu */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #FCD34D', paddingTop: '14px', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', color: '#92400E', margin: '0 0 8px', fontWeight: 600 }}>Sisa Waktu Pembayaran</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {expired ? <CountdownTimer targetDateStr={expired} /> : <p style={{ color: 'var(--color-text-medium)' }}>-</p>}
                </div>
              </div>
              {expired && (
                <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#78350F', marginBottom: '12px', background: '#FFFBEB', padding: '6px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  Batas Waktu: {formatFullDateTime(expired)}
                </p>
              )}

              {/* Tombol Detail Transaksi */}
              <div style={{ borderTop: '1px dashed #FCD34D', paddingTop: '12px' }}>
                <button onClick={() => setShowDetail(true)} style={{
                  width: '100%', background: '#fff', border: '1.5px solid #FCD34D',
                  borderRadius: '10px', padding: '10px', cursor: 'pointer',
                  color: '#78350F', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  Lihat Detail Transaksi
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
            </div>

            {/* CARD 3 ATURAN EMAS UNTUK BANK LAIN */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--color-border)',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-high)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                3 Aturan Penting Pembayaran Non-BSI
              </h4>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#FEF2F2', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>⚡</span>
                <div style={{ fontSize: '12px', color: '#7F1D1D', lineHeight: 1.4 }}>
                  <strong>1. WAJIB PILIH RTO (Real-Time Online):</strong> Saat transfer di m-Banking, wajib pilih metode <strong>RTO</strong>. <u>JANGAN pilih BI-Fast</u>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#FFFBEB', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🔄</span>
                <div style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.4 }}>
                  <strong>2. HAPUS REKENING FAVORIT TERSIMPAN:</strong> Nama rekening BSI berubah dinamis. <u>Hapus favorit lama di m-Banking</u> dan input sebagai Rekening Baru.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#FEF2F2', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🎯</span>
                <div style={{ fontSize: '12px', color: '#7F1D1D', lineHeight: 1.4 }}>
                  <strong>3. NOMINAL HARUS SAMA PERSIS:</strong> Masukkan nominal transfer persis hingga rupiah terakhir dengan <strong>{formatRupiah(total)}</strong>.
                </div>
              </div>
            </div>

            {/* TAB PANDUAN BANK LAIN INTERAKTIF */}
            <div style={{ marginBottom: '16px' }}>
              <PanduanBankLainTab kodeBayar={kodeBayar} total={total} />
            </div>
          </>
        )}

        {/* Modal Detail Transaksi */}
        {showDetail && (
          <div
            onClick={() => setShowDetail(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)', borderRadius: '20px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{
                padding: '20px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Detail Transaksi</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Nominal Bayar</span>
                  <span style={{ fontWeight: 600 }} className="rupiah">{formatRupiah(total - admin)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Biaya Admin</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-warning)' }} className="rupiah">{formatRupiah(admin)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>Total Transfer</span>
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }} className="rupiah">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <PanduanPembayaran />
        </div>
      </main>
    </div>
    </>
  );
}

export default function SuksesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat...</div>}>
      <SuksesContent />
    </Suspense>
  );
}
