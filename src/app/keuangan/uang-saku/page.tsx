'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatRupiah, formatDate, formatNumberWithSeparator } from '@/lib/utils';

interface UangSakuSaldo { saldo_uang_saku: number; saldo_dompet_kantin: number; }

export default function UangSakuPage() {
  const router = useRouter();
  const [saldo, setSaldo] = useState<UangSakuSaldo | null>(null);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupNominal, setTopupNominal] = useState('');
  const [topupNominalInput, setTopupNominalInput] = useState('');
  const adminAmount = 2000;
  const [submitting, setSubmitting] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<'preview' | 'metode'>('preview');
  const [paymentMethod, setPaymentMethod] = useState<'bsi' | 'lainnya' | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchData(1);
  }, []);

  const fetchData = (pageNum: number) => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const overviewUrl = `/odoo/api/v1/dashboard/overview?siswa_id=${siswaId}`;
    
    const promises: Promise<any>[] = [
      fetch(`/odoo/api/v1/siswa/${siswaId}/uang_saku?limit=15&page=${pageNum}`, { credentials: 'include' }).then(r => r.json())
    ];
    
    if (pageNum === 1) {
      promises.push(fetch(overviewUrl, { credentials: 'include' }).then(r => r.json()));
    }

    Promise.all(promises)
      .then((results) => {
        const txData = results[0];
        if (txData.success) {
          setTransaksi(prev => pageNum === 1 ? txData.data : [...prev, ...txData.data]);
          if (txData.pagination) setHasMore(pageNum < txData.pagination.total_pages);
          else setHasMore(false);
        }
        
        if (pageNum === 1 && results[1]) {
          const ovData = results[1];
          if (ovData.success) setSaldo(ovData.data?.overview_keuangan);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const handleTopup = async () => {
    const siswaId = getActiveSiswaId();
    if (!siswaId || !topupNominal || Number(topupNominal) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/odoo/api/v1/uang-saku/topup', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: { siswa_id: siswaId, nominal: Number(topupNominal), metode: paymentMethod === 'lainnya' ? 'lain' : 'bsi' } }),
      });
      if (res.status === 401) {
        alert('Sesi login Anda telah berakhir. Silakan login kembali.');
        router.push('/login');
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        alert('Sesi login Anda telah berakhir. Silakan login kembali.');
        router.push('/login');
        return;
      }
      if (data.success) {
        router.push('/keuangan/tagihan/sukses?' + new URLSearchParams({ va: data.data.nomor_va, kode_bayar: data.data.kode_bayar, total: String(data.data.total_bayar), admin: String(data.data.biaya_admin), expired: data.data.batas_waktu, metode: paymentMethod || 'bsi' }).toString());
      } else {
        alert(data.error || 'Gagal membuat kode top up.');
      }
    } catch { alert('Terjadi kesalahan koneksi. Silakan periksa jaringan internet Anda.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Uang Saku" />
      <main className="main-content" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #007028 100%)', borderRadius: '16px', padding: '16px', color: '#fff' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: '0 0 4px' }}>Saldo Uang Saku</p>
            <p style={{ fontSize: '20px', fontWeight: 800, margin: 0 }} className="rupiah">{loading ? '...' : formatRupiah(saldo?.saldo_uang_saku || 0)}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f3659 100%)', borderRadius: '16px', padding: '16px', color: '#fff' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: '0 0 4px' }}>Dompet Kantin</p>
            <p style={{ fontSize: '20px', fontWeight: 800, margin: 0 }} className="rupiah">{loading ? '...' : formatRupiah(saldo?.saldo_dompet_kantin || 0)}</p>
          </div>
        </div>

        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#166534', margin: '0 0 10px' }}>
            Saldo uang saku akan dipindahkan ke saldo dompet oleh masing-masing musyrif.
          </p>
          <button onClick={() => setShowTopup(true)} style={{ width: '100%', padding: '12px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            + Top Up Saldo
          </button>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Riwayat Transaksi</h3>
        {loading ? <p style={{ textAlign: 'center', color: 'var(--color-text-medium)' }}>Memuat...</p> : transaksi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>Belum ada riwayat transaksi.</div>
        ) : transaksi.map((tx, i) => {
          const isIn = tx.amount_in > 0;
          return (
            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '14px', padding: '14px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1px' }}>{tx.jns_transaksi || 'Transaksi'}</p>
                {tx.keterangan && tx.keterangan !== tx.jns_transaksi && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '0 0 1px' }}>{tx.keterangan}</p>
                )}
                <p style={{ fontSize: '11px', color: 'var(--color-text-low)', margin: 0 }}>{formatDate(tx.tgl_transaksi)}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: isIn ? 'var(--color-accent)' : 'var(--color-danger)' }} className="rupiah">
                {isIn ? '+' : '-'}{formatRupiah(isIn ? tx.amount_in : tx.amount_out)}
              </span>
            </div>
          );
        })}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchData(next);
              }}
              disabled={loadingMore}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.7 : 1
              }}
            >
              {loadingMore ? 'Memuat...' : 'Tampilkan Lebih Banyak'}
            </button>
          </div>
        )}
      </main>

      {showTopup && (
        <div onClick={() => { setShowTopup(false); setTopupNominal(''); setTopupNominalInput(''); setCheckoutStep('preview'); setPaymentMethod(null); setConfirmChecked(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 20px' }} />
            
            {checkoutStep === 'preview' ? (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Top Up Uang Saku</h3>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Nominal Top Up</label>
                <input type="text" inputMode="numeric" value={topupNominalInput} onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setTopupNominalInput(digits ? formatNumberWithSeparator(digits) : '');
                  setTopupNominal(digits);
                }} placeholder="Masukkan nominal (min. Rp 10.000)" style={{ width: '100%', padding: '13px 14px', border: '1.5px solid var(--color-border)', borderRadius: '12px', fontSize: '16px', outline: 'none', fontFamily: 'Inter, sans-serif', marginBottom: '12px' }} />
                {topupNominal && Number(topupNominal) > 0 && (
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-medium)' }}>Nominal</span>
                      <span style={{ fontWeight: 600 }} className="rupiah">{formatRupiah(Number(topupNominal))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-medium)' }}>Biaya Admin</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-warning)' }} className="rupiah">+ {formatRupiah(adminAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 700 }}>Total Transfer</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '16px' }} className="rupiah">{formatRupiah(Number(topupNominal) + adminAmount)}</span>
                    </div>
                  </div>
                )}
                <button onClick={() => setCheckoutStep('metode')} disabled={!topupNominal || Number(topupNominal) < 10000} style={{ width: '100%', padding: '15px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: (!topupNominal || Number(topupNominal) < 10000) ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!topupNominal || Number(topupNominal) < 10000) ? 0.6 : 1 }}>
                  Pilih Metode Pembayaran
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <button onClick={() => { setCheckoutStep('preview'); setPaymentMethod(null); setConfirmChecked(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-medium)', display: 'flex', alignItems: 'center', padding: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Pilih Metode Pembayaran</h3>
                </div>

                <button onClick={() => { setPaymentMethod('bsi'); setConfirmChecked(false); }} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: paymentMethod === 'bsi' ? '#EFF6FF' : 'var(--color-surface)', border: `2px solid ${paymentMethod === 'bsi' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: paymentMethod === 'bsi' ? '0 2px 12px rgba(23,77,127,0.12)' : '0 1px 4px rgba(0,0,0,0.05)', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '4px 6px', flexShrink: 0 }}>
                      <img src="/logos/bsi.svg" alt="BSI" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-high)', margin: 0 }}>Bank Syariah Indonesia (BSI)</p>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${paymentMethod === 'bsi' ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {paymentMethod === 'bsi' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '92px' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--color-text-medium)', lineHeight: 1.6 }}>
                      <li>Bayar via menu <strong>Akademik</strong> di Byond BSI</li>
                      <li>Nominal <strong>otomatis terisi</strong>, tidak perlu ketik manual</li>
                      <li>Tanpa biaya transfer tambahan</li>
                    </ul>
                    <span style={{ display: 'inline-block', marginTop: '10px', background: '#F0FDF4', color: '#16A34A', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>✓ DIREKOMENDASIKAN</span>
                  </div>
                </button>

                <button onClick={() => { setPaymentMethod('lainnya'); setConfirmChecked(false); }} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: paymentMethod === 'lainnya' ? '#FFFBEB' : 'var(--color-surface)', border: `2px solid ${paymentMethod === 'lainnya' ? '#D97706' : 'var(--color-border)'}`, borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: paymentMethod === 'lainnya' ? '0 2px 12px rgba(217,119,6,0.12)' : '0 1px 4px rgba(0,0,0,0.05)', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '4px 6px', flexShrink: 0, color: 'var(--color-text-medium)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-high)', margin: 0 }}>Bank Lain (Selain BSI)</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '2px 0 0' }}>BCA, Mandiri, BNI, BRI, dan lainnya</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}><img src="/logos/bca.svg" alt="BCA" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} /></div>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}><img src="/logos/mandiri.svg" alt="Mandiri" style={{ height: '8px', width: 'auto', objectFit: 'contain' }} /></div>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}><img src="/logos/bni.svg" alt="BNI" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} /></div>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', height: '20px' }}><img src="/logos/bri.svg" alt="BRI" style={{ height: '10px', width: 'auto', objectFit: 'contain' }} /></div>
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${paymentMethod === 'lainnya' ? '#D97706' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {paymentMethod === 'lainnya' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D97706' }} />}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '92px' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--color-text-medium)', lineHeight: 1.6 }}>
                      <li>Transfer Antar Bank ke rekening BSI</li>
                      <li>Nominal <strong>harus diisi manual</strong></li>
                      <li>Ada biaya transfer antar bank dari bank Anda</li>
                    </ul>
                  </div>
                </button>

                {paymentMethod === 'lainnya' && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--color-danger)', fontSize: '14px', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Perhatian Penting Transfer Bank Lain
                    </h4>
                    <ul style={{ fontSize: '12px', color: '#991B1B', lineHeight: 1.6, margin: '0 0 12px', paddingLeft: '18px' }}>
                      <li style={{ marginBottom: '4px' }}><strong>1. Wajib Layanan Real-Time Online (RTO):</strong> Gunakan RTO di m-Banking. <u>JANGAN gunakan BI-Fast</u>.</li>
                      <li style={{ marginBottom: '4px' }}><strong>2. Hapus Rekening Favorit Lama:</strong> Karena nama rekening BSI selalu berubah dinamis, <u>hapus nomor rekening lama dari daftar favorit m-Banking Anda</u>, lalu input ulang sebagai Rekening Baru.</li>
                      <li><strong>3. Nominal Tepat:</strong> Transfer harus sama persis hingga digit terakhir.</li>
                    </ul>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #FECACA', marginBottom: '12px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>Total yang harus ditransfer</p>
                      <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }} className="rupiah">{formatRupiah(Number(topupNominal) + adminAmount)}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '4px 0 0' }}>Sudah termasuk biaya admin Rp 2.000</p>
                    </div>
                    <button onClick={() => setConfirmChecked(!confirmChecked)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', border: `2px solid ${confirmChecked ? 'var(--color-primary)' : 'var(--color-border)'}`, background: confirmChecked ? 'var(--color-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {confirmChecked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>Saya mengerti 3 aturan di atas dan akan mentransfer via <strong>RTO</strong> dengan nominal <strong>sama persis</strong>.</span>
                    </button>
                  </div>
                )}

                {paymentMethod && (
                  <button onClick={handleTopup} disabled={submitting || (paymentMethod === 'lainnya' && !confirmChecked)} style={{ width: '100%', padding: '15px', background: (paymentMethod === 'lainnya' && !confirmChecked) ? '#CBD5E1' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: (paymentMethod === 'lainnya' && !confirmChecked) ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: (paymentMethod === 'lainnya' && !confirmChecked) ? 0.6 : 1 }}>
                    {submitting ? 'Memproses...' : 'Buat Kode Top Up'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,54,89,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Loader2 size={48} color="#fff" strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>Sedang menghubungi BSI...</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Mohon tunggu sebentar</p>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <BottomNav />
    </div>
  );
}
