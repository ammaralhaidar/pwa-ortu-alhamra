'use client';

import { useEffect, useState } from 'react';
import { Sunrise, Sun, Moon, Heart, ShieldCheck, Sparkles, ClipboardCheck, Check, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function MutabaahPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    fetch(`/odoo/api/v1/siswa/${siswaId}/mutabaah?limit=30`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  const getSessionMeta = (sesi: string) => {
    const s = sesi.toLowerCase();
    if (s.includes('pagi')) return { icon: Sunrise, color: '#D97706', bg: '#FFFBEB' };
    if (s.includes('siang')) return { icon: Sun, color: '#3B82F6', bg: '#EFF6FF' };
    if (s.includes('malam')) return { icon: Moon, color: '#7C3AED', bg: '#F5F3FF' };
    return { icon: Sun, color: '#6B7280', bg: '#F3F4F6' };
  };

  const getCategoryIcon = (kategori: string) => {
    const k = kategori.toLowerCase();
    if (k.includes('ibadah')) return { icon: Heart, color: '#DC2626' };
    if (k.includes('kedisiplinan')) return { icon: ShieldCheck, color: '#D97706' };
    if (k.includes('kebersihan')) return { icon: Sparkles, color: '#059669' };
    return { icon: Check, color: '#6B7280' };
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Mutabaah Harian" />
      <main className="main-content" style={{ padding: '16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ marginBottom: '12px', color: '#3B82F6' }}><ClipboardCheck size={48} strokeWidth={1.5} /></div>
            <p style={{ color: 'var(--color-text-medium)' }}>Belum ada data mutabaah.</p>
          </div>
        ) : data.map(item => (
          <div key={item.id} style={{ background: 'var(--color-surface)', borderRadius: '14px', marginBottom: '10px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button onClick={() => toggle(item.id)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{formatDate(item.tanggal)}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(() => { const m = getSessionMeta(item.sesi); const Icon = m.icon; return <Icon size={14} color={m.color} />; })()}
                  {item.sesi} - Skor: {item.total_skor}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2" style={{ transform: expanded.has(item.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
            {expanded.has(item.id) && item.rincian?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px', background: '#F8FAFC' }}>
                {item.rincian.map((act: any, i: number) => {
                  const catMeta = getCategoryIcon(act.kategori);
                  const CatIcon = catMeta.icon;
                  return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${catMeta.color}15`, color: catMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CatIcon size={14} strokeWidth={2} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 1px' }}>{act.aktivitas}</p>
                        <p style={{ fontSize: '10px', color: catMeta.color, margin: 0, fontWeight: 500 }}>{act.kategori}</p>
                      </div>
                    </div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: act.dilakukan ? '#F0FDF4' : '#FEF2F2', color: act.dilakukan ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {act.dilakukan ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
