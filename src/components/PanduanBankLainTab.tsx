"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface PanduanBankLainTabProps {
  kodeBayar: string;
  total: number;
}

export default function PanduanBankLainTab({
  kodeBayar,
  total,
}: PanduanBankLainTabProps) {
  const [activeBank, setActiveBank] = useState<"bca" | "mandiri" | "bri" | "lain">("bca");

  const noRekening = `9005065${kodeBayar}`;

  const banks = [
    { id: "bca", label: "BCA", logo: "/logos/bca.svg" },
    { id: "mandiri", label: "Mandiri", logo: "/logos/mandiri.svg" },
    { id: "bri", label: "BRI", logo: "/logos/bri.svg" },
    { id: "lain", label: "Bank Lain", logo: null },
  ] as const;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <h4
        style={{
          fontSize: "14px",
          fontWeight: 700,
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-text-high)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D97706"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        Panduan m-Banking Bank Lain
      </h4>

      {/* Top Clarification Banner */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "12px",
          color: "var(--color-primary)",
          fontWeight: 600,
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ fontSize: "14px" }}>💡</span>
        <span>
          Mendukung <strong>SELURUH Bank di Indonesia</strong> (BNI, Bank Jatim, Bank Jateng, BJB, Danamon, Permata, CIMB, dll).
        </span>
      </div>

      {/* Tab Switcher — 4 Equal Grid Columns (Zero Horizontal Scroll) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "4px",
          background: "#F8FAFC",
          padding: "4px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          marginBottom: "16px",
        }}
      >
        {banks.map((b) => {
          const isActive = activeBank === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setActiveBank(b.id as any)}
              style={{
                padding: "8px 4px",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "#fff" : "transparent",
                color: isActive ? "var(--color-text-high)" : "var(--color-text-medium)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "11px",
                cursor: "pointer",
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {b.logo ? (
                <img
                  src={b.logo}
                  alt={b.label}
                  style={{ height: "10px", width: "auto", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontWeight: 700 }}>🌐 Bank Lain</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ fontSize: "13px", color: "var(--color-text-high)", lineHeight: 1.6 }}>
        {activeBank === "bca" && (
          <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>
              Buka aplikasi <strong>BCA Mobile / myBCA</strong>, pilih menu <strong>m-Transfer ➔ Antar Bank</strong>.
            </li>
            <li>
              <strong style={{ color: "#D97706" }}>HAPUS DARI FAVORIT TERLEBIH DAHULU</strong> jika nomor rekening BSI ini pernah Anda simpan sebelumnya.
            </li>
            <li>
              Pilih Bank Tujuan: <strong>BSI / Bank Syariah Indonesia (Kode 451)</strong>.
            </li>
            <li>
              Masukkan No. Rekening Tujuan: <strong>{noRekening}</strong>.
            </li>
            <li>
              <strong style={{ color: "var(--color-danger)" }}>WAJIB PILIH LAYANAN TRANSFER: Real-Time Online (RTO)</strong>. <u>Jangan pilih BI-Fast</u>.
            </li>
            <li>
              Masukkan Nominal Transfer: <strong className="rupiah">{formatRupiah(total)}</strong> (harus sama persis).
            </li>
            <li>Periksa nama penerima, lalu selesaikan transaksi dengan PIN BCA Anda.</li>
          </ol>
        )}

        {activeBank === "mandiri" && (
          <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>
              Buka aplikasi <strong>Livin&apos; by Mandiri</strong>, pilih menu <strong>Transfer ➔ Transfer ke Penerima Baru</strong>.
            </li>
            <li>
              Pilih Bank Tujuan: <strong>Bank Syariah Indonesia (BSI)</strong>.
            </li>
            <li>
              Masukkan Nomor Rekening: <strong>{noRekening}</strong>, lalu tekan Lanjut.
            </li>
            <li>
              <strong style={{ color: "var(--color-danger)" }}>PILIH METODE TRANSFER: Real-Time Online (RTO)</strong>. <u>Jangan pilih BI-Fast</u>.
            </li>
            <li>
              Masukkan Nominal: <strong className="rupiah">{formatRupiah(total)}</strong> — harus pas rupiahnya.
            </li>
            <li>Konfirmasi detail transaksi dan masukkan PIN Livin&apos; Anda.</li>
          </ol>
        )}

        {activeBank === "bri" && (
          <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>
              Buka aplikasi <strong>BRImo</strong>, pilih menu <strong>Transfer ➔ Tambah Penerima Baru</strong>.
            </li>
            <li>
              Pilih Bank Tujuan: <strong>Bank Syariah Indonesia (BSI)</strong>.
            </li>
            <li>
              <strong style={{ color: "#D97706" }}>JANGAN PILIH dari Daftar Favorit Tersimpan</strong> (hapus favorit lama jika ada).
            </li>
            <li>
              Masukkan Nomor Rekening: <strong>{noRekening}</strong>.
            </li>
            <li>
              <strong style={{ color: "var(--color-danger)" }}>PILIH METODE TRANSFER: Real-Time Online / RTO</strong>. <u>Jangan BI-Fast</u>.
            </li>
            <li>
              Isi Nominal Transfer: <strong className="rupiah">{formatRupiah(total)}</strong>.
            </li>
            <li>Konfirmasi dan masukkan PIN BRImo Anda.</li>
          </ol>
        )}

        {activeBank === "lain" && (
          <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>
              Buka aplikasi m-Banking Anda (<i>BNI, Bank Jatim, Bank Jateng, Bank DKI, BJB, Bank Nagari, CIMB Niaga, Danamon, Permata, dll.</i>).
            </li>
            <li>
              Pilih menu <strong>Transfer Antar Bank / Ke Bank Lain</strong>.
            </li>
            <li>
              Pilih Bank Tujuan: <strong>Bank Syariah Indonesia / BSI (Kode 451)</strong>.
            </li>
            <li>
              Masukkan No. Rekening Tujuan: <strong>{noRekening}</strong>. <strong style={{ color: "#D97706" }}>(Hapus dari daftar favorit jika pernah disimpan sebelumnya)</strong>.
            </li>
            <li>
              <strong style={{ color: "var(--color-danger)" }}>WAJIB PILIH METODE TRANSFER: Real-Time Online (RTO)</strong>. <u>Jangan pilih BI-Fast</u> karena Virtual Account BSI tidak mendukung BI-Fast.
            </li>
            <li>
              Masukkan Nominal Transfer: <strong className="rupiah">{formatRupiah(total)}</strong> (harus sama persis).
            </li>
            <li>Periksa nama penerima, lalu selesaikan transaksi dengan PIN m-Banking Anda.</li>
          </ol>
        )}
      </div>
    </div>
  );
}
