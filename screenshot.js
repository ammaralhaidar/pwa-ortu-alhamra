const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ==========================================
// KONFIGURASI SCRIPT SCREENSHOT
// ==========================================
const BASE_URL = 'http://localhost:3000'; // Ganti jika port Anda berbeda
const USERNAME = 'efendisudarmono2610@gmail.com'; // Ganti dengan nomor HP/Username yang valid
const PASSWORD = '1'; // Ganti dengan password yang valid
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Daftar rute (URL path) yang ingin di-screenshot
const routesToCapture = [
  { name: '01_Login', path: '/login' },
  { name: '02_Dashboard_Beranda', path: '/' },
  { name: '03_Keuangan_Menu', path: '/keuangan' },
  { name: '04_Keuangan_Tagihan', path: '/keuangan/tagihan' },
  { name: '05_Keuangan_Menunggu_Pembayaran', path: '/keuangan/menunggu-pembayaran' },
  { name: '06_Keuangan_Uang_Saku', path: '/keuangan/uang-saku' },
  { name: '07_Kesantrian_Menu', path: '/kesantrian' },
  { name: '08_Kesantrian_Tahfidz', path: '/kesantrian/tahfidz' },
  { name: '09_Kesantrian_Pelanggaran', path: '/kesantrian/pelanggaran' },
  { name: '10_Kesantrian_Kesehatan', path: '/kesantrian/kesehatan' },
  { name: '11_Profil', path: '/profil' },
];

// Buat direktori output jika belum ada
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Memulai proses otomatisasi screenshot...');
  
  // Buka browser
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: null // Biarkan emulate yang mengatur
  });
  
  const page = await browser.newPage();
  
  // Emulate layar iPhone 13 Pro Max untuk tampilan mobile yang bagus
  const iPhone = puppeteer.KnownDevices['iPhone 13 Pro Max'];
  await page.emulate(iPhone);

  try {
    // 1. Ambil screenshot halaman Login terlebih dahulu
    console.log(`📸 Mengambil screenshot: Login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_Login.png'), fullPage: true });

    // 2. Lakukan proses Login
    console.log(`🔑 Melakukan login otomatis dengan kredensial: ${USERNAME} / *****...`);
    await page.type('input[type="email"]', USERNAME);
    await page.type('input[type="password"]', PASSWORD);
    
    // Klik tombol submit (asumsi form login standar PWA)
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    console.log('✅ Login berhasil!');

    // 3. Looping ke seluruh rute selain login
    for (const route of routesToCapture.filter(r => r.name !== '01_Login')) {
      console.log(`📸 Menavigasi ke: ${route.name} (${route.path})...`);
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
      
      // Tunggu sebentar tambahan untuk animasi loading data PWA jika ada
      await new Promise(r => setTimeout(r, 2000));
      
      const fileName = `${route.name}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: true });
      console.log(`   Berhasil menyimpan: ${fileName}`);
    }

    console.log('🎉 Selesai! Semua screenshot berhasil disimpan di folder:', OUTPUT_DIR);

  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  } finally {
    await browser.close();
  }
}

run();
