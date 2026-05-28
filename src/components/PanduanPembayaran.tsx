"use client";

import { useState } from "react";

export default function PanduanPembayaran() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%",
          padding: "14px",
          background: "#EFF6FF",
          color: "var(--color-primary)",
          border: "1px solid #BFDBFE",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        Lihat Panduan Pembayaran
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "85dvh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Panduan Pembayaran
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-medium)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px", overflowY: "auto" }}>
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <h4
                  style={{
                    color: "var(--color-danger)",
                    fontSize: "14px",
                    fontWeight: 700,
                    margin: "0 0 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⚠️ PERHATIAN PENTING
                </h4>
                <ul
                  style={{
                    color: "#991B1B",
                    fontSize: "13px",
                    margin: 0,
                    paddingLeft: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  <li style={{ marginBottom: "6px" }}>
                    Kode Institusi IBS AL HAMRA adalah: <strong>5065</strong>
                  </li>
                  <li style={{ marginBottom: "6px" }}>
                    <strong>Nominal Transfer Harus Tepat (Sama Persis)</strong>{" "}
                    hingga digit terakhir.
                  </li>
                  <li>
                    Jika bayar dari <strong>Selain Bank BSI</strong>, pastikan
                    mengetik nominal secara manual sesuai tagihan!
                  </li>
                </ul>
              </div>

              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                1. Bank Syariah Indonesia (BSI)
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-medium)",
                  marginBottom: "8px",
                }}
              >
                Format: 5065 + Kode Bayar
              </p>
              <ol
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-high)",
                  paddingLeft: "20px",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                }}
              >
                <li>
                  Buka Aplikasi Byond by BSI, pilih{" "}
                  <strong>Bayar dan Beli</strong>.
                </li>
                <li>
                  Pilih <strong>Akademik</strong>.
                </li>
                <li>
                  Masukkan kode{" "}
                  <strong>5065 atau Islamic Boarding School Al Hamra</strong>.
                </li>
                <li>
                  Masukkan <strong>Kode Bayar</strong> Anda.
                </li>
                <li>Pastikan data benar, masukkan PIN dan selesai.</li>
              </ol>

              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                2. Bank Lain (Mandiri, BCA, BRI, BNI)
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-medium)",
                  marginBottom: "8px",
                }}
              >
                Format: Pilih BSI (451) + 900 + 5065 + Kode Bayar
              </p>
              <ol
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-high)",
                  paddingLeft: "20px",
                  lineHeight: "1.6",
                  marginBottom: "0",
                }}
              >
                <li>Buka M-Banking Anda (Livin, BCA Mobile, BRImo, dll).</li>
                <li>
                  Pilih menu <strong>Transfer Antar Bank</strong>.
                </li>
                <li>
                  Pilih bank tujuan <strong>BSI (Kode 451)</strong>.
                </li>
                <li>
                  Masukkan rekening tujuan: <strong>9005065</strong> diikuti
                  Kode Bayar.
                </li>
                <li>
                  <strong>Masukkan nominal tagihan (HARUS SAMA PERSIS).</strong>
                </li>
                <li>Pastikan data benar, selesaikan transaksi.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
