'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatRupiah, formatDate } from '@/lib/utils';

interface UangSakuSaldo { saldo_uang_saku: number; saldo_dompet_kantin: number; }

export default function UangSakuPage() {
  const router = useRouter();
  const [saldo, setSaldo] = useState<UangSakuSaldo | null>(null);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupNominal, setTopupNominal] = useState('');
  const adminAmount = 2000;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    const overviewUrl = siswaId ? `/odoo/api/v1/dashboard/overview?siswa_id=${siswaId}` : '/odoo/api/v1/dashboard/overview';
    Promise.all([
      fetch(overviewUrl, { credentials: 'include' }).then(r => r.json()),
      siswaId ? fetch(`/odoo/api/v1/siswa/${siswaId}/uang_saku?limit=30`, { credentials: 'include' }).then(r => r.json()) : Promise.resolve({ success: false }),
    ]).then(([ovData, txData]) => {
      if (ovData.success) setSaldo(ovData.data?.overview_keuangan);
      if (txData.success) setTransaksi(txData.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleTopup = async () => {
    const siswaId = getActiveSiswaId();
    if (!siswaId || !topupNominal || Number(topupNominal) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/odoo/api/v1/uang-saku/topup', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: { siswa_id: siswaId, nominal: Number(topupNominal) } }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/keuangan/tagihan/sukses?' + new URLSearchParams({ va: data.data.nomor_va, kode_bayar: data.data.kode_bayar, total: String(data.data.total_bayar), admin: String(data.data.biaya_admin), expired: data.data.batas_waktu }).toString());
      } else {
        alert(data.error || 'Gagal membuat kode top up.');
      }
    } catch { alert('Terjadi kesalahan koneksi.'); }
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
            Saldo uang saku akan dipindahkan ke dompet kantin setelah disetujui pengurus pesantren.
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
                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>{tx.jns_transaksi || tx.keterangan || 'Transaksi'}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>{formatDate(tx.tgl_transaksi)}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: isIn ? 'var(--color-accent)' : 'var(--color-danger)' }} className="rupiah">
                {isIn ? '+' : '-'}{formatRupiah(isIn ? tx.amount_in : tx.amount_out)}
              </span>
            </div>
          );
        })}
      </main>

      {showTopup && (
        <div onClick={() => setShowTopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ width: '36px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Top Up Uang Saku</h3>
            <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Nominal Top Up</label>
            <input type="number" value={topupNominal} onChange={e => setTopupNominal(e.target.value)} placeholder="Masukkan nominal (min. Rp 10.000)" style={{ width: '100%', padding: '13px 14px', border: '1.5px solid var(--color-border)', borderRadius: '12px', fontSize: '16px', outline: 'none', fontFamily: 'Inter, sans-serif', marginBottom: '12px' }} />
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
            <button onClick={handleTopup} disabled={submitting || !topupNominal || Number(topupNominal) < 10000} style={{ width: '100%', padding: '15px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {submitting ? 'Memproses...' : 'Buat Kode Top Up'}
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
