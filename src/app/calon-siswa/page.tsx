'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import {
  getUser,
  isCalonOrangtua,
  getCalonSiswaId,
  getActiveCalonSiswaId,
  updateActiveCalonSiswa,
  getCalonSiswaList,
  updateCalonSiswaList,
  CalonSiswaSummary,
} from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  color: 'var(--color-text-high)',
  background: 'var(--color-surface)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-medium)',
  marginBottom: '4px',
  display: 'block',
};

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid var(--color-border)',
};

export default function CalonSiswaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [readOnlyData, setReadOnlyData] = useState<Record<string, string | number>>({});
  const [refPropinsi, setRefPropinsi] = useState<Array<{ id: number; name: string }>>([]);
  const [refKota, setRefKota] = useState<Array<{ id: number; name: string }>>([]);
  const [refKecamatan, setRefKecamatan] = useState<Array<{ id: number; name: string }>>([]);
  
  const [calonList, setCalonList] = useState<CalonSiswaSummary[]>([]);
  const [activeCalonId, setActiveCalonId] = useState<number | null>(getActiveCalonSiswaId());

  const fetchKota = (propId: number | string) => {
    if (!propId) { setRefKota([]); setRefKecamatan([]); return; }
    fetch(`/odoo/api/v1/referensi/kota?propinsi_id=${propId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(d => { if (d.success) setRefKota(d.data); })
      .catch(() => {});
  };

  const fetchKecamatan = (kotaId: number | string) => {
    if (!kotaId) { setRefKecamatan([]); return; }
    fetch(`/odoo/api/v1/referensi/kecamatan?kota_id=${kotaId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(d => { if (d.success) setRefKecamatan(d.data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/odoo/api/v1/referensi/propinsi', { credentials: 'include' })
      .then(res => res.json())
      .then(d => { if (d.success) setRefPropinsi(d.data); })
      .catch(() => {});

    // Fetch list of calon siswa
    fetch('/odoo/api/v1/calon-siswa/list', { credentials: 'include' })
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setCalonList(d.data);
          updateCalonSiswaList(d.data);
          if (!activeCalonId) {
            setActiveCalonId(d.data[0].id);
            updateActiveCalonSiswa(d.data[0].id);
          }
        } else {
          setCalonList(getCalonSiswaList());
        }
      })
      .catch(() => {
        setCalonList(getCalonSiswaList());
      });
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace('/login'); return; }
    if (!isCalonOrangtua()) { router.replace('/'); return; }

    const targetId = activeCalonId || getCalonSiswaId();
    if (!targetId) return;

    setLoading(true);
    fetch(`/odoo/api/v1/calon-siswa/${targetId}/profil`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const d = data.data;
          setReadOnlyData({
            nis: d.nis,
            biaya_name: d.biaya_name,
            tahunajaran_name: d.tahunajaran_name,
            diskon: d.diskon,
            state: d.state,
            email_orangtua: d.email_orangtua,
          });
          setFormData({ ...d });
          if (d.propinsi_id) fetchKota(d.propinsi_id);
          if (d.kota_id) fetchKecamatan(d.kota_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCalonId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePropinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : '';
    setFormData(prev => ({ ...prev, propinsi_id: val, kota_id: '', kecamatan_id: '' }));
    setRefKota([]);
    setRefKecamatan([]);
    if (val) fetchKota(val);
  };

  const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : '';
    setFormData(prev => ({ ...prev, kota_id: val, kecamatan_id: '' }));
    setRefKecamatan([]);
    if (val) fetchKecamatan(val);
  };

  const handleKecamatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : '';
    setFormData(prev => ({ ...prev, kecamatan_id: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');
    try {
      const editableData: Record<string, string | number> = {};
      const editableKeys = [
        'name', 'nisn', 'panggilan', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'gol_darah', 'agama', 'kewarganegaraan', 'nik', 'anak_ke', 'jml_saudara_kandung',
        'bahasa', 'cita_cita', 'rt_rw', 'street', 'street2', 'city', 'zip',
        'propinsi_id', 'kota_id', 'kecamatan_id',
        'asal_sekolah', 'kepsek_sekolah_asal', 'status_sekolah_asal', 'telp_asal_sek',
        'alamat_asal_sek', 'prestasi_sebelum',
        'nama_ayah', 'hp_ayah', 'ayah_tmp_lahir', 'ayah_tgl_lahir', 'ayah_warganegara',
        'ayah_agama', 'ayah_kantor', 'ayah_email', 'ayah_penghasilan',
        'nama_ibu', 'hp_ibu', 'ibu_tmp_lahir', 'ibu_tgl_lahir', 'ibu_warganegara',
        'ibu_agama', 'ibu_kantor', 'ibu_email', 'ibu_penghasilan',
        'wali_nama', 'wali_telp', 'wali_tmp_lahir', 'wali_tgl_lahir',
        'wali_agama', 'wali_hubungan', 'wali_email',
      ];
      for (const key of editableKeys) {
        editableData[key] = formData[key] ?? '';
      }

      const targetId = activeCalonId || getCalonSiswaId();
      if (!targetId) throw new Error('Calon siswa tidak valid');

      const res = await fetch(`/odoo/api/v1/calon-siswa/${targetId}/update`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: editableData }),
      });
      const d = await res.json();
      if (d.success) {
        setSavedMessage('Data berhasil disimpan');
        setTimeout(() => setSavedMessage(''), 3000);
      } else {
        const errMsg = d.error?.message || d.message || (typeof d.error === 'string' ? d.error : 'Unknown error');
        setSavedMessage('Gagal menyimpan: ' + errMsg);
      }
    } catch (e: any) {
      setSavedMessage('Gagal menyimpan: ' + (e?.message || 'Koneksi gagal.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
        <PageHeader title="Data Calon Siswa" />
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Memuat data...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Data Calon Siswa" />
      <main className="main-content" style={{ padding: '16px', paddingBottom: '100px' }}>
        
        {/* Multi-Child Segmented Switcher Tab */}
        {calonList.length > 1 && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '16px',
            padding: '6px',
            marginBottom: '16px',
            display: 'flex',
            gap: '6px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}>
            {calonList.map((c) => {
              const isActive = c.id === activeCalonId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    updateActiveCalonSiswa(c.id);
                    setActiveCalonId(c.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? 'var(--color-primary, #174D7F)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--color-text-medium)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.7 }}>
                    {c.jenjang_display || c.jenjang?.toUpperCase() || 'Pendaftaran'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Informasi Pendaftaran */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Informasi Pendaftaran</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>NIS (Otomatis)</label>
                <input style={{ ...inputStyle, background: '#F1F5F9', color: 'var(--color-text-medium)' }} readOnly value={readOnlyData.nis || '-'} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <input style={{ ...inputStyle, background: '#F1F5F9', color: 'var(--color-text-medium)' }} readOnly value={readOnlyData.state || '-'} />
              </div>
              <div>
                <label style={labelStyle}>Biaya Pendaftaran</label>
                <input style={{ ...inputStyle, background: '#F1F5F9', color: 'var(--color-text-medium)' }} readOnly value={readOnlyData.biaya_name || '-'} />
              </div>
              <div>
                <label style={labelStyle}>Tahun Ajaran</label>
                <input style={{ ...inputStyle, background: '#F1F5F9', color: 'var(--color-text-medium)' }} readOnly value={readOnlyData.tahunajaran_name || '-'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Email Akun Orang Tua</label>
                <input style={{ ...inputStyle, background: '#F1F5F9', color: 'var(--color-text-medium)' }} readOnly value={readOnlyData.email_orangtua || '-'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Diskon</label>
                <input
                  value={readOnlyData.diskon ? formatRupiah(Number(readOnlyData.diskon)) : 'Rp 0'}
                  readOnly
                  style={{ ...inputStyle, background: '#F8FAFC', color: 'var(--color-text-medium)' }}
                />
              </div>
            </div>
          </div>

          {/* Data Diri */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Data Diri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nama Lengkap</label>
                <input name="name" value={formData.name || ''} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Nama Panggilan</label>
                  <input name="panggilan" value={formData.panggilan || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={formData.jenis_kelamin || ''} onChange={handleChange} style={inputStyle} required>
                    <option value="">Pilih</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input name="tempat_lahir" value={formData.tempat_lahir || ''} onChange={handleChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir || ''} onChange={handleChange} style={inputStyle} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>NIK</label>
                  <input name="nik" value={formData.nik || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>NISN</label>
                  <input name="nisn" value={formData.nisn || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Agama</label>
                  <select name="agama" value={formData.agama || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="islam">Islam</option>
                    <option value="kristen">Kristen</option>
                    <option value="katolik">Katolik</option>
                    <option value="hindu">Hindu</option>
                    <option value="buddha">Buddha</option>
                    <option value="konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Kewarganegaraan</label>
                  <select name="kewarganegaraan" value={formData.kewarganegaraan || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="wni">WNI</option>
                    <option value="wna">WNA</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Gol. Darah</label>
                  <select name="gol_darah" value={formData.gol_darah || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Anak Ke-</label>
                  <input type="number" name="anak_ke" value={formData.anak_ke || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Jml Saudara</label>
                  <input type="number" name="jml_saudara_kandung" value={formData.jml_saudara_kandung || ''} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cita-cita</label>
                <input name="cita_cita" value={formData.cita_cita || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bahasa Sehari-hari</label>
                <input
                  name="bahasa"
                  value={formData.bahasa || ''}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Bahasa sehari-hari"
                />
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Alamat Lengkap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Jalan/Dusun</label>
                <input name="street" value={formData.street || ''} onChange={handleChange} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Alamat Baris 2</label>
                <input name="street2" value={formData.street2 || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>RT/RW</label>
                  <input name="rt_rw" value={formData.rt_rw || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kode Pos</label>
                  <input name="zip" value={formData.zip || ''} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Provinsi</label>
                <select
                  name="propinsi_id"
                  value={formData.propinsi_id || ''}
                  onChange={handlePropinsiChange}
                  style={inputStyle}
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {refPropinsi.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Kota/Kabupaten</label>
                <select
                  name="kota_id"
                  value={formData.kota_id || ''}
                  onChange={handleKotaChange}
                  disabled={!formData.propinsi_id}
                  style={{
                    ...inputStyle,
                    background: !formData.propinsi_id ? '#F1F5F9' : '#fff',
                    cursor: !formData.propinsi_id ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">
                    {!formData.propinsi_id ? '-- Pilih Provinsi Terlebih Dahulu --' : '-- Pilih Kota/Kabupaten --'}
                  </option>
                  {refKota.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Kecamatan</label>
                <select
                  name="kecamatan_id"
                  value={formData.kecamatan_id || ''}
                  onChange={handleKecamatanChange}
                  disabled={!formData.kota_id}
                  style={{
                    ...inputStyle,
                    background: !formData.kota_id ? '#F1F5F9' : '#fff',
                    cursor: !formData.kota_id ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">
                    {!formData.kota_id ? '-- Pilih Kota/Kabupaten Terlebih Dahulu --' : '-- Pilih Kecamatan --'}
                  </option>
                  {refKecamatan.map((kc) => (
                    <option key={kc.id} value={kc.id}>
                      {kc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sekolah Asal */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Sekolah Asal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nama Sekolah</label>
                <input name="asal_sekolah" value={formData.asal_sekolah || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Kepala Sekolah</label>
                <input name="kepsek_sekolah_asal" value={formData.kepsek_sekolah_asal || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Status Sekolah</label>
                  <select name="status_sekolah_asal" value={formData.status_sekolah_asal || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="negeri">Negeri</option>
                    <option value="swasta">Swasta</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Telepon Sekolah</label>
                  <input name="telp_asal_sek" value={formData.telp_asal_sek || ''} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Alamat Sekolah</label>
                <input name="alamat_asal_sek" value={formData.alamat_asal_sek || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Prestasi Sebelumnya</label>
                <input name="prestasi_sebelum" value={formData.prestasi_sebelum || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Data Ayah */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Data Ayah</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nama Ayah</label>
                <input name="nama_ayah" value={formData.nama_ayah || ''} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>No. HP/WA</label>
                  <input name="hp_ayah" value={formData.hp_ayah || ''} onChange={handleChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Agama</label>
                  <select name="ayah_agama" value={formData.ayah_agama || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="islam">Islam</option>
                    <option value="kristen">Kristen</option>
                    <option value="katolik">Katolik</option>
                    <option value="hindu">Hindu</option>
                    <option value="buddha">Buddha</option>
                    <option value="konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input name="ayah_tmp_lahir" value={formData.ayah_tmp_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" name="ayah_tgl_lahir" value={formData.ayah_tgl_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Pendidikan (Sistem)</label>
                  <input readOnly value={formData.ayah_pendidikan_name || '-'} style={{ ...inputStyle, background: '#F1F5F9' }} />
                </div>
                <div>
                  <label style={labelStyle}>Pekerjaan (Sistem)</label>
                  <input readOnly value={formData.ayah_pekerjaan_name || '-'} style={{ ...inputStyle, background: '#F1F5F9' }} />
                </div>
                <div>
                  <label style={labelStyle}>Penghasilan</label>
                  <input type="number" name="ayah_penghasilan" value={formData.ayah_penghasilan || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kewarganegaraan</label>
                  <select name="ayah_warganegara" value={formData.ayah_warganegara || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="wni">WNI</option>
                    <option value="wna">WNA</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Ayah</label>
                <input type="email" name="ayah_email" value={formData.ayah_email || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Alamat Kantor</label>
                <input name="ayah_kantor" value={formData.ayah_kantor || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Data Ibu */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Data Ibu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nama Ibu</label>
                <input name="nama_ibu" value={formData.nama_ibu || ''} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>No. HP/WA</label>
                  <input name="hp_ibu" value={formData.hp_ibu || ''} onChange={handleChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Agama</label>
                  <select name="ibu_agama" value={formData.ibu_agama || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="islam">Islam</option>
                    <option value="kristen">Kristen</option>
                    <option value="katolik">Katolik</option>
                    <option value="hindu">Hindu</option>
                    <option value="buddha">Buddha</option>
                    <option value="konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input name="ibu_tmp_lahir" value={formData.ibu_tmp_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" name="ibu_tgl_lahir" value={formData.ibu_tgl_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Pendidikan (Sistem)</label>
                  <input readOnly value={formData.ibu_pendidikan_name || '-'} style={{ ...inputStyle, background: '#F1F5F9' }} />
                </div>
                <div>
                  <label style={labelStyle}>Pekerjaan (Sistem)</label>
                  <input readOnly value={formData.ibu_pekerjaan_name || '-'} style={{ ...inputStyle, background: '#F1F5F9' }} />
                </div>
                <div>
                  <label style={labelStyle}>Penghasilan</label>
                  <input type="number" name="ibu_penghasilan" value={formData.ibu_penghasilan || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kewarganegaraan</label>
                  <select name="ibu_warganegara" value={formData.ibu_warganegara || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="wni">WNI</option>
                    <option value="wna">WNA</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Ibu</label>
                <input type="email" name="ibu_email" value={formData.ibu_email || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Alamat Kantor</label>
                <input name="ibu_kantor" value={formData.ibu_kantor || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Data Wali */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>Data Wali (Opsional)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nama Wali</label>
                <input name="wali_nama" value={formData.wali_nama || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>No. HP/WA</label>
                  <input name="wali_telp" value={formData.wali_telp || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hubungan</label>
                  <input name="wali_hubungan" value={formData.wali_hubungan || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Agama</label>
                  <select name="wali_agama" value={formData.wali_agama || ''} onChange={handleChange} style={inputStyle}>
                    <option value="">Pilih</option>
                    <option value="islam">Islam</option>
                    <option value="kristen">Kristen</option>
                    <option value="katolik">Katolik</option>
                    <option value="hindu">Hindu</option>
                    <option value="buddha">Buddha</option>
                    <option value="konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input name="wali_tmp_lahir" value={formData.wali_tmp_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input type="date" name="wali_tgl_lahir" value={formData.wali_tgl_lahir || ''} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Wali</label>
                <input type="email" name="wali_email" value={formData.wali_email || ''} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {savedMessage && (
            <div style={{ padding: '10px', marginBottom: '12px', borderRadius: '8px', background: savedMessage.includes('Gagal') ? '#FEE2E2' : '#DCFCE7', color: savedMessage.includes('Gagal') ? 'var(--color-danger)' : 'var(--color-accent)', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}>
              {savedMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
