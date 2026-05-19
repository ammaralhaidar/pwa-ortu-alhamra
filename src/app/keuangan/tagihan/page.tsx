'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatRupiah, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  name: string;
  nama_tagihan?: string;
  komponen_id?: [number, string] | false;
  invoice_date: string;
  amount_total_signed: number;
  amount_residual_signed: number;
  payment_state: string;
  write_date?: string;
}

interface AllocationPreview {
  tagihan: string;
  nominal_tagihan: number;
  alokasi: number;
  sisa: number;
  status: 'lunas' | 'sebagian' | 'belum';
}

export default function TagihanPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCicilan, setIsCicilan] = useState(false);
  const [nominal, setNominal] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<AllocationPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activePaymentAlert, setActivePaymentAlert] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'belum_lunas' | 'lunas'>('belum_lunas');

  useEffect(() => {
    setLoading(true);
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    fetch(`/odoo/api/v1/siswa/${siswaId}/tagihan?status=${activeTab}`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setInvoices(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  const selectedInvoices = invoices.filter(inv => selected.has(inv.id));
  const totalSelected = selectedInvoices.reduce((s, inv) => s + inv.amount_residual_signed, 0);
  const minNominal = selectedInvoices.length > 1
    ? Math.min(...selectedInvoices.map(inv => inv.amount_residual_signed))
    : (selectedInvoices.length === 1 ? Math.min(10000, selectedInvoices[0].amount_residual_signed) : 0);

  const handleToggle = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setIsCicilan(false);
  };

  const calculatePreview = (nom: number): AllocationPreview[] => {
    const sorted = [...selectedInvoices].sort((a, b) => a.amount_residual_signed - b.amount_residual_signed);
    let sisa = nom;
    return sorted.map(inv => {
      const residual = inv.amount_residual_signed;
      const tagihanName = inv.nama_tagihan || inv.name;
      if (sisa <= 0) return { tagihan: tagihanName, nominal_tagihan: residual, alokasi: 0, sisa: residual, status: 'belum' };
      if (sisa >= residual) { sisa -= residual; return { tagihan: tagihanName, nominal_tagihan: residual, alokasi: residual, sisa: 0, status: 'lunas' }; }
      const allocated = sisa; sisa = 0;
      return { tagihan: tagihanName, nominal_tagihan: residual, alokasi: allocated, sisa: residual - allocated, status: 'sebagian' };
    });
  };

  const displayNominal = isCicilan ? nominal : totalSelected;

  const handleBuatKodeBayar = async () => {
    if (selected.size === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/odoo/api/v1/pembayaran/aktif', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const aktifTagihan = data.data.find((p: any) => p.jenis === 'tagihan');
        if (aktifTagihan) {
          setActivePaymentAlert(aktifTagihan);
          setSubmitting(false);
          return;
        }
      }
    } catch {
      // Lanjut jika terjadi error jaringan saat cek
    }
    
    setSubmitting(false);
    showPreviewModal();
  };

  const showPreviewModal = () => {
    setPreview(calculatePreview(displayNominal));
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/odoo/api/v1/tagihan/checkout', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: { move_ids: Array.from(selected), nominal: displayNominal } }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/keuangan/tagihan/sukses?' + new URLSearchParams({
          va: data.data.nomor_va, kode_bayar: data.data.kode_bayar,
          total: String(data.data.total_bayar), admin: String(data.data.biaya_admin),
          expired: data.data.batas_waktu,
        }).toString());
      } else {
        alert(data.error || 'Gagal membuat kode bayar.');
      }
    } catch { alert('Terjadi kesalahan koneksi.'); }
    finally { setSubmitting(false); setShowPreview(false); }
  };

  const statusColor = { lunas: 'var(--color-accent)', sebagian: 'var(--color-warning)', belum: 'var(--color-danger)' };
  const statusLabel = { lunas: 'Lunas', sebagian: 'Terbayar Sebagian', belum: 'Belum Terbayar' };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Tagihan" />
      
      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: '16px', gap: '8px' }}>
        <button 
          onClick={() => { setActiveTab('belum_lunas'); setSelected(new Set()); }}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: activeTab === 'belum_lunas' ? 'var(--color-primary)' : '#E2E8F0', color: activeTab === 'belum_lunas' ? '#fff' : 'var(--color-text-medium)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Belum Lunas
        </button>
        <button 
          onClick={() => { setActiveTab('lunas'); setSelected(new Set()); }}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: activeTab === 'lunas' ? 'var(--color-primary)' : '#E2E8F0', color: activeTab === 'lunas' ? '#fff' : 'var(--color-text-medium)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Riwayat Lunas
        </button>
      </div>

      <main style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: (selected.size > 0 && activeTab === 'belum_lunas') ? '160px' : '80px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat tagihan...</p>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{activeTab === 'belum_lunas' ? '🎉' : '📄'}</div>
            <h3 style={{ fontWeight: 700 }}>{activeTab === 'belum_lunas' ? 'Semua tagihan lunas!' : 'Belum ada riwayat lunas'}</h3>
            <p style={{ color: 'var(--color-text-medium)', fontSize: '14px' }}>
              {activeTab === 'belum_lunas' ? 'Tidak ada tagihan yang perlu dibayar.' : 'Belum ada tagihan yang berhasil dilunasi.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {invoices.map(inv => {
              const isChecked = selected.has(inv.id);
              const isLunas = activeTab === 'lunas';
              return (
                <button key={inv.id} onClick={() => { if(!isLunas) handleToggle(inv.id); }} style={{
                  background: isChecked ? '#EFF6FF' : 'var(--color-surface)',
                  border: `2px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center',
                  gap: '14px', cursor: isLunas ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                  boxShadow: isChecked ? '0 2px 12px rgba(23,77,127,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  {!isLunas && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, border: `2px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`, background: isChecked ? 'var(--color-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isChecked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{inv.nama_tagihan || inv.name}</p>
                    {inv.komponen_id && <p style={{ fontSize: '11px', color: 'var(--color-primary)', margin: '0 0 2px', fontWeight: 600 }}>{inv.komponen_id[1]}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>
                      {isLunas ? `Lunas pada: ${formatDate(inv.write_date || inv.invoice_date)}` : `Jatuh tempo: ${formatDate(inv.invoice_date)}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: isLunas ? 'var(--color-accent)' : 'var(--color-danger)', margin: 0 }} className="rupiah">
                      {isLunas ? formatRupiah(inv.amount_total_signed) : formatRupiah(inv.amount_residual_signed)}
                    </p>
                    {!isLunas && <span style={{ fontSize: '10px', color: 'var(--color-text-low)' }}>dari {formatRupiah(inv.amount_total_signed)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Checkout */}
      {selected.size > 0 && activeTab === 'belum_lunas' && (
        <div style={{ position: 'fixed', bottom: 'var(--bottom-nav-height)', left: 0, right: 0, zIndex: 45, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Bayar Sebagian</span>
            <button onClick={() => { setIsCicilan(!isCicilan); setNominal(totalSelected); }} style={{ width: '48px', height: '26px', borderRadius: '13px', background: isCicilan ? 'var(--color-primary)' : '#CBD5E1', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '3px', left: isCicilan ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {isCicilan && (
            <div style={{ marginBottom: '12px' }}>
              <input type="number" value={nominal || ''} onChange={e => setNominal(Number(e.target.value))} placeholder={`Min. ${formatRupiah(minNominal)}`} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--color-primary)', borderRadius: '10px', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
              {nominal > 0 && nominal < minNominal && <p style={{ fontSize: '12px', color: 'var(--color-danger)', margin: '4px 0 0' }}>Nominal minimal {formatRupiah(minNominal)}</p>}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: 0 }}>Total Bayar</p>
              <p style={{ fontSize: '18px', fontWeight: 700, margin: 0 }} className="rupiah">{formatRupiah(displayNominal)}</p>
            </div>
            <button id="btn-buat-kode-bayar" onClick={handleBuatKodeBayar} disabled={selected.size === 0 || (isCicilan && (nominal < minNominal || nominal <= 0)) || submitting} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              {submitting ? 'Memeriksa...' : 'Buat Kode Bayar'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Sheet */}
      {showPreview && (
        <div onClick={() => setShowPreview(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>Preview Alokasi</h3>
            {preview.map((p, i) => (
              <div key={i} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '8px', borderLeft: `4px solid ${statusColor[p.status]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{p.tagihan}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: `${statusColor[p.status]}20`, color: statusColor[p.status] }}>{statusLabel[p.status]}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>Dialokasikan: {formatRupiah(p.alokasi)} dari {formatRupiah(p.nominal_tagihan)}</p>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Nominal</span>
                <span style={{ fontWeight: 600 }} className="rupiah">{formatRupiah(displayNominal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Biaya Admin</span>
                <span style={{ fontWeight: 600, color: 'var(--color-warning)' }} className="rupiah">+ {formatRupiah(2000)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-border)', marginTop: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Total Bayar</span>
                <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--color-primary)' }} className="rupiah">{formatRupiah(displayNominal + 2000)}</span>
              </div>
            </div>
            <button onClick={handleConfirm} disabled={submitting} style={{ width: '100%', padding: '15px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>
              {submitting ? 'Memproses...' : 'Konfirmasi & Buat Kode Bayar'}
            </button>
          </div>
        </div>
      )}

      {/* Alert Kode Bayar Aktif */}
      {activePaymentAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#FEF2F2', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Kode Bayar Tagihan Aktif</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', lineHeight: 1.5, marginBottom: '16px' }}>
              Anda memiliki kode bayar yang masih aktif sebesar <strong className="rupiah" style={{ color: 'var(--color-text-high)' }}>{formatRupiah(activePaymentAlert.total_bayar)}</strong> dengan tenggat waktu pada <strong>{formatDate(activePaymentAlert.tanggal_expired)}</strong>.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-danger)', background: '#FEF2F2', padding: '10px 12px', borderRadius: '8px', marginBottom: '24px' }}>
              Membuat kode bayar baru akan <strong>membatalkan otomatis</strong> kode bayar yang lama.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/keuangan/menunggu-pembayaran')}
                style={{ width: '100%', padding: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Lihat Tagihan Lama
              </button>
              <button 
                onClick={() => { setActivePaymentAlert(null); showPreviewModal(); }}
                style={{ width: '100%', padding: '14px', background: '#F1F5F9', color: 'var(--color-text-high)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Tetap Buat Baru
              </button>
            </div>
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
