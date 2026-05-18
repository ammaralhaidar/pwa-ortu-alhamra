# 📱 PWA Wali Santri - IBS Al Hamra

![IBS Al Hamra](public/logo-typograpy.png)

Aplikasi **PWA (Progressive Web App)** eksklusif untuk Wali Santri IBS Al Hamra. Aplikasi ini memungkinkan orang tua untuk memantau aktivitas akademik, catatan kedisiplinan, hingga mengelola keuangan santri (Tagihan, Uang Saku, Kantin) secara *real-time* langsung dari layar HP layaknya aplikasi *Native*.

---

## 🏗️ Arsitektur & Teknologi (Tech Stack)

Aplikasi ini dibangun dengan mengedepankan performa tinggi, desain modern (*Clean Surface*), dan instalasi instan (PWA).

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS (`src/app/globals.css`). *TailwindCSS tidak digunakan secara sengaja untuk menjaga kontrol penuh atas estetika "Clean Surface" bergaya iOS/Modern.*
- **Ikonografi**: 100% SVG Vektor (Tidak menggunakan font icon atau emoji untuk menjamin konsistensi render di semua HP).
- **Backend / API**: Odoo 16 (Modul Kustom: `v16_ibs_alhamra/pesantren_base`).
- **Autentikasi**: Odoo Session Based (Sesi dikelola lewat integrasi *Cookie/Proxy* Next.js).

---

## 🌟 Fitur Utama (Core Features)

1. **Smart PWA Installation (Instalasi Tanpa App Store)**
   - Deteksi pintar perangkat: Memunculkan *Native Install Button* untuk Android (Chrome) dan *Instruksi Visual Share* untuk pengguna iOS (Safari).
   - Logika anti-spam: Pop-up instalasi otomatis tersembunyi jika aplikasi sudah terpasang.
2. **Sistem Keuangan Terpadu**
   - **Tagihan**: Cek tagihan aktif, konfirmasi pembayaran, dan riwayat tagihan lunas lengkap dengan tanggal pelunasan.
   - **Uang Saku**: Pantau saldo dompet santri secara langsung.
   - **Kantin**: Cek mutasi dan riwayat jajan santri di kantin.
   - **Menunggu Pembayaran**: Layar pintar untuk mengecek kode *Virtual Account* aktif lengkap dengan *Countdown Timer* yang super presisi (konversi UTC ke zona waktu lokal secara otomatis).
3. **Rekam Jejak Kesantrian**
   - **Tahfidz**: Pantau progres hafalan Qur'an dan setoran terakhir.
   - **Mutabaah**: Laporan aktivitas keseharian ibadah santri.
   - **Kesehatan**: Histori keluhan medis dari UKS pesantren.
   - **Pelanggaran**: Pantau poin dan rekam jejak kedisiplinan.

---

## 📂 Struktur Folder Proyek

Untuk mempermudah AI atau *Developer* masa depan dalam melakukan iterasi kode, berikut adalah panduan anatomi proyek ini:

```text
pwa_ortu_alhamra/
├── next.config.ts        # Konfigurasi Next.js (Sangat vital! Berisi setting PROXY API Odoo)
├── public/               # Aset statis (Logo, File Manifest PWA, Ikon Homescreen)
└── src/
    ├── app/              # Folder App Router (Berisi seluruh rute halaman UI)
    │   ├── globals.css   # Variabel warna tema (--color-primary, --color-surface)
    │   ├── layout.tsx    # Kerangka utama HTML (PWA Install Prompt dipasang di sini)
    │   ├── login/        # Halaman Login
    │   ├── keuangan/     # Semua sub-menu Keuangan (Tagihan, Uang Saku, Kantin)
    │   └── kesantrian/   # Semua sub-menu Kesantrian (Tahfidz, Pelanggaran, dll)
    ├── components/       # Komponen UI Reusable (BottomNav, PageHeader, CountdownTimer, InstallPrompt)
    └── lib/
        ├── auth.ts       # Helper utilitas untuk LocalStorage dan Manajemen Sesi
        └── utils.ts      # Helper canggih (Format Rupiah, Konversi Tanggal UTC -> Lokal)
```

---

## 🛠️ Panduan Konfigurasi API & Proxy (Sangat Penting!)

Salah satu arsitektur terpenting di aplikasi ini adalah cara PWA berkomunikasi dengan Odoo. PWA ini tidak langsung menembak API Odoo dari *Browser* (karena akan memicu masalah CORS dan *Cross-Site Cookies* di HP/Browser modern).

Alih-alih langsung tembak API, PWA ini menggunakan **Next.js Rewrites Proxy** (bisa dilihat di `next.config.ts`).
Artinya: Jika PWA ingin mengambil data tagihan, ia akan memanggil `/odoo/api/v1/tagihan`. Lalu *server* Next.js di belakang layar akan diam-diam meneruskan permintaan tersebut ke server Odoo yang asli.

### Mengubah Server Tujuan (Dev vs Production)
Anda **TIDAK PERLU** merubah kode apapun jika ingin memindahkan server dari lokal ke production. PWA membaca tujuan server melalui *Environment Variables*:

`NEXT_PUBLIC_ODOO_URL`

- **Untuk Local Development**:
  Buat file `.env.local` dan isikan:
  ```env
  NEXT_PUBLIC_ODOO_URL=http://localhost:10016
  ```
- **Untuk Deployment di Vercel**:
  Cukup tambahkan variabel lingkungan di Dashboard Vercel:
  `NEXT_PUBLIC_ODOO_URL = https://sipp.ibsalhamra.sch.id`

---

## 👨‍💻 Panduan Instalasi Lokal untuk Developer

Ikuti langkah berikut untuk menjalankan, menguji, atau memodifikasi PWA di laptop Anda:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Server Target**:
   Buat file `.env.local` di root folder dan arahkan ke Odoo lokal Anda atau server Dev Anda:
   ```env
   NEXT_PUBLIC_ODOO_URL=http://localhost:10016
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di *browser*. 

> **💡 Catatan Debugging Login API Lokal:**
> Jika Anda mencoba *login* dari HP yang menggunakan satu jaringan WiFi (misal mengakses via `http://192.168.1.X:3000`), Safari/Chrome di HP Anda akan memblokir Cookie Odoo karena koneksinya tidak menggunakan HTTPS (SSL). Solusi untuk *testing mobile*: Gunakan *tools* seperti **Ngrok** (`npx ngrok http 3000`) untuk mendapatkan URL *HTTPS dummy* secara sementara.

---

## ⏱️ Catatan Penanganan Zona Waktu (Timezone)

Odoo menyimpan semua format waktu dalam standar **UTC**. Namun, antarmuka aplikasi sering kali memerlukan tampilan dalam zona waktu lokal (WIB/WITA/WIT).
Untuk mencegah *bug* selisih 7 jam pada *Countdown Timer* atau histori transaksi, **SELALU** gunakan fungsi helper `odooToUtc()` atau `formatFullDateTime()` dari `src/lib/utils.ts` sebelum memasukkan nilai dari database ke dalam objek `new Date()` milik JavaScript.

---

*Didokumentasikan secara rapi dan komprehensif pada Mei 2026. Happy Coding!* 🚀
