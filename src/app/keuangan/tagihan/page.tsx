"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ReceiptText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getActiveSiswaId } from "@/lib/auth";
import { formatRupiah, formatDate, formatNumberWithSeparator } from "@/lib/utils";

interface InvoiceLine {
  id: number;
  name: string;
  product_name?: string;
  quantity: number;
  price_unit: number;
  discount?: number;
  price_subtotal: number;
}

interface Invoice {
  id: number;
  name: string;
  nama_tagihan?: string;
  komponen_id?: [number, string] | false;
  invoice_date: string;
  invoice_date_due?: string | null;
  amount_total_signed: number;
  amount_residual_signed: number;
  payment_state: string;
  write_date?: string;
  paid_on?: string | null;
  lines?: InvoiceLine[];
}

interface AllocationPreview {
  tagihan: string;
  nominal_tagihan: number;
  alokasi: number;
  sisa: number;
  status: "lunas" | "sebagian" | "belum";
}

export default function TagihanPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCicilan, setIsCicilan] = useState(false);
  const [nominal, setNominal] = useState(0);
  const [nominalInput, setNominalInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<AllocationPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activePaymentAlert, setActivePaymentAlert] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"belum_lunas" | "lunas">(
    "belum_lunas",
  );
  const [checkoutStep, setCheckoutStep] = useState<'preview' | 'metode'>('preview');
  const [paymentMethod, setPaymentMethod] = useState<'bsi' | 'lainnya' | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setPage(1);
    fetchData(1, activeTab);
  }, [activeTab]);

  const fetchData = (pageNum: number, tabName: string) => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) {
      setLoading(false);
      return;
    }
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    fetch(`/odoo/api/v1/siswa/${siswaId}/tagihan?status=${tabName}&limit=15&page=${pageNum}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setInvoices(prev => pageNum === 1 ? d.data : [...prev, ...d.data]);
          if (d.pagination) setHasMore(pageNum < d.pagination.total_pages);
          else setHasMore(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const selectedInvoices = invoices.filter((inv) => selected.has(inv.id));
  const totalSelected = selectedInvoices.reduce(
    (s, inv) => s + inv.amount_residual_signed,
    0,
  );
  const minNominal =
    selectedInvoices.length > 1
      ? Math.min(...selectedInvoices.map((inv) => inv.amount_residual_signed))
      : selectedInvoices.length === 1
        ? Math.min(10000, selectedInvoices[0].amount_residual_signed)
        : 0;

  const handleToggle = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setIsCicilan(false);
  };

  const calculatePreview = (nom: number): AllocationPreview[] => {
    const sorted = [...selectedInvoices].sort(
      (a, b) => a.amount_residual_signed - b.amount_residual_signed,
    );
    let sisa = nom;
    return sorted.map((inv) => {
      const residual = inv.amount_residual_signed;
      const tagihanName = inv.nama_tagihan || inv.name;
      if (sisa <= 0)
        return {
          tagihan: tagihanName,
          nominal_tagihan: residual,
          alokasi: 0,
          sisa: residual,
          status: "belum",
        };
      if (sisa >= residual) {
        sisa -= residual;
        return {
          tagihan: tagihanName,
          nominal_tagihan: residual,
          alokasi: residual,
          sisa: 0,
          status: "lunas",
        };
      }
      const allocated = sisa;
      sisa = 0;
      return {
        tagihan: tagihanName,
        nominal_tagihan: residual,
        alokasi: allocated,
        sisa: residual - allocated,
        status: "sebagian",
      };
    });
  };

  const displayNominal = isCicilan ? nominal : totalSelected;

  const handleBuatKodeBayar = async () => {
    if (selected.size === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/odoo/api/v1/pembayaran/aktif", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const aktifTagihan = data.data.find((p: any) => p.jenis === "tagihan");
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
    setCheckoutStep('preview');
    setPaymentMethod(null);
    setConfirmChecked(false);
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/odoo/api/v1/tagihan/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params: { move_ids: Array.from(selected), nominal: displayNominal, metode: paymentMethod === 'lainnya' ? 'lain' : 'bsi' },
        }),
      });
      if (res.status === 401) {
        alert("Sesi login Anda telah berakhir. Silakan login kembali.");
        router.push("/login");
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        alert("Sesi login Anda telah berakhir. Silakan login kembali.");
        router.push("/login");
        return;
      }
      if (data.success) {
        router.push(
          "/keuangan/tagihan/sukses?" +
            new URLSearchParams({
              va: data.data.nomor_va,
              kode_bayar: data.data.kode_bayar,
              total: String(data.data.total_bayar),
              admin: String(data.data.biaya_admin),
              expired: data.data.batas_waktu,
              metode: paymentMethod || 'bsi',
            }).toString(),
        );
      } else {
        alert(data.error || "Gagal membuat kode bayar.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi. Silakan periksa jaringan internet Anda.");
    } finally {
      setSubmitting(false);
      setShowPreview(false);
    }
  };

  const statusColor = {
    lunas: "var(--color-accent)",
    sebagian: "var(--color-warning)",
    belum: "var(--color-danger)",
  };
  const statusLabel = {
    lunas: "Lunas",
    sebagian: "Terbayar Sebagian",
    belum: "Belum Terbayar",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>
      <PageHeader title="Tagihan" />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          padding: "0 16px",
          marginTop: "16px",
          gap: "8px",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("belum_lunas");
            setSelected(new Set());
          }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            background:
              activeTab === "belum_lunas" ? "var(--color-primary)" : "#E2E8F0",
            color:
              activeTab === "belum_lunas" ? "#fff" : "var(--color-text-medium)",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Belum Lunas
        </button>
        <button
          onClick={() => {
            setActiveTab("lunas");
            setSelected(new Set());
          }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            background:
              activeTab === "lunas" ? "var(--color-primary)" : "#E2E8F0",
            color: activeTab === "lunas" ? "#fff" : "var(--color-text-medium)",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Riwayat Lunas
        </button>
      </div>

      <main
        style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "16px",
          paddingBottom:
            selected.size > 0 && activeTab === "belum_lunas"
              ? isCicilan
                ? "calc(var(--bottom-nav-height, 65px) + 240px)"
                : "calc(var(--bottom-nav-height, 65px) + 160px)"
              : "calc(var(--bottom-nav-height, 65px) + 24px)",
        }}
      >
        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-medium)",
              marginTop: "40px",
            }}
          >
            Memuat tagihan...
          </p>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>
              {activeTab === "belum_lunas" ? "🎉" : "📄"}
            </div>
            <h3 style={{ fontWeight: 700 }}>
              {activeTab === "belum_lunas"
                ? "Semua tagihan lunas!"
                : "Belum ada riwayat lunas"}
            </h3>
            <p style={{ color: "var(--color-text-medium)", fontSize: "14px" }}>
              {activeTab === "belum_lunas"
                ? "Tidak ada tagihan yang perlu dibayar."
                : "Belum ada tagihan yang berhasil dilunasi."}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {invoices.map((inv) => {
              const isChecked = selected.has(inv.id);
              const isLunas = activeTab === "lunas";
              return (
                <button
                  key={inv.id}
                  onClick={() => {
                    if (!isLunas) handleToggle(inv.id);
                  }}
                  style={{
                    background: isChecked ? "#EFF6FF" : "var(--color-surface)",
                    border: `2px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    cursor: isLunas ? "default" : "pointer",
                    textAlign: "left",
                    width: "100%",
                    boxShadow: isChecked
                      ? "0 2px 12px rgba(23,77,127,0.12)"
                      : "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                    {!isLunas && (
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "6px",
                          flexShrink: 0,
                          border: `2px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: isChecked ? "var(--color-primary)" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isChecked && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "var(--color-text-high)",
                          margin: "0 0 2px",
                        }}
                      >
                        {inv.nama_tagihan || inv.name}
                      </p>
                      {inv.komponen_id && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--color-primary)",
                            margin: "0 0 2px",
                            fontWeight: 600,
                          }}
                        >
                          {inv.komponen_id[1]}
                        </p>
                      )}
                      {inv.payment_state === 'paid' && inv.paid_on && (
                        <p style={{ fontSize: '11px', color: 'var(--color-accent)', margin: '4px 0 0', fontWeight: 500 }}>
                          Dibayar pada {formatDate(inv.paid_on)}
                        </p>
                      )}
                      {inv.payment_state === 'partial' && inv.paid_on && (
                        <p style={{ fontSize: '11px', color: 'var(--color-warning)', margin: '4px 0 0', fontWeight: 500 }}>
                          Sebagian dibayar pada {formatDate(inv.paid_on)}
                        </p>
                      )}
                      {inv.payment_state !== 'paid' && (inv.invoice_date_due || inv.invoice_date) && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '4px 0 0' }}>
                          Jatuh tempo: {formatDate(inv.invoice_date_due || inv.invoice_date)}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: "15px",
                          color: isLunas
                            ? "var(--color-accent)"
                            : "var(--color-danger)",
                          margin: 0,
                        }}
                        className="rupiah"
                      >
                        {isLunas
                          ? formatRupiah(inv.amount_total_signed)
                          : formatRupiah(inv.amount_residual_signed)}
                      </p>
                      {!isLunas && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--color-text-low)",
                          }}
                        >
                          dari {formatRupiah(inv.amount_total_signed)}
                        </span>
                      )}
                    </div>
                  </div>

                  {inv.lines && inv.lines.length > 0 && (
                    <div
                      style={{
                        width: "100%",
                        background: isChecked ? "rgba(219, 234, 254, 0.6)" : "#F8FAFC",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        border: "1px dashed var(--color-border)",
                        boxSizing: "border-box",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--color-text-medium)",
                          margin: "0 0 6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ReceiptText size={13} strokeWidth={2.2} style={{ color: isChecked ? "var(--color-primary)" : "var(--color-text-medium)", flexShrink: 0 }} />
                        <span>Rincian Tagihan ({inv.lines.length}):</span>
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {inv.lines.map((line, idx) => (
                          <div
                            key={line.id || idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              fontSize: "12px",
                              color: "var(--color-text-high)",
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ fontWeight: 500, flex: 1, paddingRight: "8px" }}>
                              {line.name}
                              {line.quantity > 1 && (
                                <span style={{ fontSize: "11px", color: "var(--color-text-medium)", fontWeight: 400 }}>
                                  {" "}({line.quantity}x @{formatRupiah(line.price_unit)})
                                </span>
                              )}
                            </span>
                            <span style={{ fontWeight: 600, flexShrink: 0 }} className="rupiah">
                              {formatRupiah(line.price_subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchData(next, activeTab);
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

        {/* Bottom spacer to guarantee clearance above sticky checkout bar */}
        {selected.size > 0 && activeTab === "belum_lunas" && (
          <div style={{ height: isCicilan ? "80px" : "40px" }} />
        )}
      </main>

      {/* Sticky Bottom Checkout */}
      {selected.size > 0 && activeTab === "belum_lunas" && (
        <div
          style={{
            position: "fixed",
            bottom: "var(--bottom-nav-height)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "430px",
            zIndex: 45,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "16px 20px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 500 }}>
              Bayar Sebagian
            </span>
            <button
              onClick={() => {
                setIsCicilan(!isCicilan);
                setNominal(totalSelected);
                setNominalInput(formatNumberWithSeparator(totalSelected));
              }}
              style={{
                width: "48px",
                height: "26px",
                borderRadius: "13px",
                background: isCicilan ? "var(--color-primary)" : "#CBD5E1",
                border: "none",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: isCicilan ? "25px" : "3px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>
          {isCicilan && (
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                inputMode="numeric"
                value={nominalInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setNominalInput(digits ? formatNumberWithSeparator(digits) : "");
                  setNominal(digits ? parseInt(digits, 10) : 0);
                }}
                placeholder={`Min. ${formatRupiah(minNominal)}`}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid var(--color-primary)",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              />
              {nominal > 0 && nominal < minNominal && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-danger)",
                    margin: "4px 0 0",
                  }}
                >
                  Nominal minimal {formatRupiah(minNominal)}
                </p>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-medium)",
                  margin: 0,
                }}
              >
                Total Bayar
              </p>
              <p
                style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}
                className="rupiah"
              >
                {formatRupiah(displayNominal)}
              </p>
            </div>
            <button
              id="btn-buat-kode-bayar"
              onClick={handleBuatKodeBayar}
              disabled={
                selected.size === 0 ||
                (isCicilan && (nominal < minNominal || nominal <= 0)) ||
                submitting
              }
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "Memeriksa..." : "Buat Kode Bayar"}
            </button>
          </div>
        </div>
      )}

      {/* Preview Sheet */}
      {showPreview && (
        <div
          onClick={() => {
            setShowPreview(false);
            setCheckoutStep('preview');
            setPaymentMethod(null);
            setConfirmChecked(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 60,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: "24px 24px 0 0",
              width: "100%",
              padding: "24px",
              paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
              maxHeight: "80dvh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "4px",
                background: "#CBD5E1",
                borderRadius: "2px",
                margin: "0 auto 20px",
              }}
            />
            {checkoutStep === 'preview' ? (
              <>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    marginBottom: "16px",
                  }}
                >
                  Preview Alokasi
                </h3>
                {preview.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      marginBottom: "8px",
                      borderLeft: `4px solid ${statusColor[p.status]}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {p.tagihan}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: `${statusColor[p.status]}20`,
                          color: statusColor[p.status],
                        }}
                      >
                        {statusLabel[p.status]}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-medium)",
                        margin: 0,
                      }}
                    >
                      Dialokasikan: {formatRupiah(p.alokasi)} dari{" "}
                      {formatRupiah(p.nominal_tagihan)}
                    </p>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "12px",
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-medium)",
                      }}
                    >
                      Nominal
                    </span>
                    <span style={{ fontWeight: 600 }} className="rupiah">
                      {formatRupiah(displayNominal)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-medium)",
                      }}
                    >
                      Biaya Admin
                    </span>
                    <span
                      style={{ fontWeight: 600, color: "var(--color-warning)" }}
                      className="rupiah"
                    >
                      + {formatRupiah(2000)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderTop: "1px solid var(--color-border)",
                      marginTop: "4px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "15px" }}>
                      Total Bayar
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "17px",
                        color: "var(--color-primary)",
                      }}
                      className="rupiah"
                    >
                      {formatRupiah(displayNominal + 2000)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutStep('metode')}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "var(--color-primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: "16px",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Pilih Metode Pembayaran
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Header dengan tombol kembali */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
                }}>
                  <button
                    onClick={() => { setCheckoutStep('preview'); setPaymentMethod(null); setConfirmChecked(false); }}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-medium)', display: 'flex', alignItems: 'center', padding: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                    Pilih Metode Pembayaran
                  </h3>
                </div>

                {/* Kartu BSI */}
                <button
                  onClick={() => { setPaymentMethod('bsi'); setConfirmChecked(false); }}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: paymentMethod === 'bsi' ? '#EFF6FF' : 'var(--color-surface)',
                    border: `2px solid ${paymentMethod === 'bsi' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '16px', padding: '16px', marginBottom: '12px',
                    boxShadow: paymentMethod === 'bsi' ? '0 2px 12px rgba(23,77,127,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)',
                      padding: '4px 6px', flexShrink: 0
                    }}>
                      <img src="/logos/bsi.svg" alt="BSI" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-high)', margin: 0 }}>
                        Bank Syariah Indonesia (BSI)
                      </p>
                    </div>
                    {/* Radio indicator */}
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${paymentMethod === 'bsi' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {paymentMethod === 'bsi' && (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '92px' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--color-text-medium)', lineHeight: 1.6 }}>
                      <li>Bayar via menu <strong>Akademik</strong> di Byond BSI</li>
                      <li>Nominal <strong>otomatis terisi</strong>, tidak perlu ketik manual</li>
                      <li>Tanpa biaya transfer tambahan</li>
                    </ul>
                    <span style={{
                      display: 'inline-block', marginTop: '10px',
                      background: '#F0FDF4', color: '#16A34A',
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                    }}>
                      ✓ DIREKOMENDASIKAN
                    </span>
                  </div>
                </button>

                {/* Kartu Bank Lain */}
                <button
                  onClick={() => { setPaymentMethod('lainnya'); setConfirmChecked(false); }}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: paymentMethod === 'lainnya' ? '#FFFBEB' : 'var(--color-surface)',
                    border: `2px solid ${paymentMethod === 'lainnya' ? '#D97706' : 'var(--color-border)'}`,
                    borderRadius: '16px', padding: '16px', marginBottom: '16px',
                    boxShadow: paymentMethod === 'lainnya' ? '0 2px 12px rgba(217,119,6,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)',
                      padding: '4px 6px', flexShrink: 0, color: 'var(--color-text-medium)'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/>
                        <path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-high)', margin: 0 }}>
                        Bank Lain (Selain BSI)
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '2px 0 0' }}>
                        BCA, Mandiri, BNI, BRI, dan lainnya
                      </p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    {/* Radio indicator */}
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${paymentMethod === 'lainnya' ? '#D97706' : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {paymentMethod === 'lainnya' && (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D97706' }} />
                      )}
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

                {/* Warning box khusus Bank Lain */}
                {paymentMethod === 'lainnya' && (
                  <div style={{
                    background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px',
                    padding: '16px', marginBottom: '16px',
                  }}>
                    <h4 style={{
                      color: 'var(--color-danger)', fontSize: '14px', fontWeight: 700,
                      margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Perhatian Penting Transfer Bank Lain
                    </h4>
                    <ul style={{ fontSize: '12px', color: '#991B1B', lineHeight: 1.6, margin: '0 0 12px', paddingLeft: '18px' }}>
                      <li style={{ marginBottom: '4px' }}><strong>1. Wajib Layanan Real-Time Online (RTO):</strong> Gunakan RTO di m-Banking. <u>JANGAN gunakan BI-Fast</u>.</li>
                      <li style={{ marginBottom: '4px' }}><strong>2. Hapus Rekening Favorit Lama:</strong> Karena nama rekening BSI selalu berubah dinamis, <u>hapus nomor rekening lama dari daftar favorit m-Banking Anda</u>, lalu input ulang sebagai Rekening Baru.</li>
                      <li><strong>3. Nominal Tepat:</strong> Transfer harus sama persis hingga digit terakhir.</li>
                    </ul>
                    <div style={{
                      background: '#fff', borderRadius: '10px', padding: '12px', textAlign: 'center',
                      border: '1px solid #FECACA', marginBottom: '12px',
                    }}>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>
                        Total yang harus ditransfer
                      </p>
                      <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }} className="rupiah">
                        {formatRupiah(displayNominal + 2000)}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '4px 0 0' }}>
                        Sudah termasuk biaya admin Rp 2.000
                      </p>
                    </div>
                    {/* Checkbox konfirmasi */}
                    <button
                      onClick={() => setConfirmChecked(!confirmChecked)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%',
                        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                        padding: 0, fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                        border: `2px solid ${confirmChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: confirmChecked ? 'var(--color-primary)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {confirmChecked && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>
                        Saya mengerti 3 aturan di atas dan akan mentransfer via <strong>RTO</strong> dengan nominal <strong>sama persis</strong>.
                      </span>
                    </button>
                  </div>
                )}

                {/* Tombol Konfirmasi */}
                {paymentMethod && (
                  <button
                    onClick={handleConfirm}
                    disabled={submitting || (paymentMethod === 'lainnya' && !confirmChecked)}
                    style={{
                      width: '100%', padding: '15px',
                      background: (paymentMethod === 'lainnya' && !confirmChecked) ? '#CBD5E1' : 'var(--color-primary)',
                      color: '#fff', border: 'none', borderRadius: '14px',
                      fontSize: '16px', fontWeight: 600, cursor: (paymentMethod === 'lainnya' && !confirmChecked) ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      opacity: (paymentMethod === 'lainnya' && !confirmChecked) ? 0.6 : 1,
                    }}
                  >
                    {submitting ? 'Memproses...' : 'Konfirmasi & Buat Kode Bayar'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Alert Kode Bayar Aktif */}
      {activePaymentAlert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "24px",
                background: "#FEF2F2",
                color: "var(--color-danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3
              style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}
            >
              Kode Bayar Tagihan Aktif
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-medium)",
                lineHeight: 1.5,
                marginBottom: "16px",
              }}
            >
              Anda memiliki kode bayar yang masih aktif sebesar{" "}
              <strong
                className="rupiah"
                style={{ color: "var(--color-text-high)" }}
              >
                {formatRupiah(activePaymentAlert.total_bayar)}
              </strong>{" "}
              dengan tenggat waktu pada{" "}
              <strong>{formatDate(activePaymentAlert.tanggal_expired)}</strong>.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-danger)",
                background: "#FEF2F2",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              Membuat kode bayar baru akan <strong>membatalkan otomatis</strong>{" "}
              kode bayar yang lama.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                onClick={() => router.push("/keuangan/menunggu-pembayaran")}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Lihat Tagihan Lama
              </button>
              <button
                onClick={() => {
                  setActivePaymentAlert(null);
                  showPreviewModal();
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#F1F5F9",
                  color: "var(--color-text-high)",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tetap Buat Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(15,54,89,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Loader2
            size={48}
            color="#fff"
            strokeWidth={2.5}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p
            style={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Sedang menghubungi BSI...
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              margin: 0,
            }}
          >
            Mohon tunggu sebentar
          </p>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <BottomNav />
    </div>
  );
}
