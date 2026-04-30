import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMerchants } from "../store/slice/merchantSlice";
import { fetchPayouts } from "../store/slice/payoutSlice";
import MerchantSelector from "../components/MerchantSelector";
import BalanceCard from "../components/BalanceCard";
import PayoutForm from "../components/PayoutForm";
import PayoutTable from "../components/PayoutTable";
import LedgerTable from "../components/LedgerTable";
import { usePayoutStream } from "../hooks/usePayoutStream";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { selectedId, list } = useAppSelector((s) => s.merchants);
  const selectedMerchant = list.find((m) => m.id === selectedId);

  useEffect(() => {
    dispatch(fetchMerchants());
  }, [dispatch]);
  useEffect(() => {
    if (selectedId) dispatch(fetchPayouts(selectedId));
  }, [selectedId, dispatch]);
  usePayoutStream(selectedId);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }

        :root {
          --bg-base: #f2f5fb;
          --bg-surface: #ffffff;
          --bg-subtle: #f7f9fd;
          --bg-hover: #eef2fa;
          --navy: #0c1b35;
          --navy-mid: #1e3a5f;
          --blue: #1a56db;
          --blue-hover: #1447c0;
          --blue-light: #e8f0fe;
          --blue-mid: #2563eb;
          --border: #e2e8f4;
          --border-strong: #c8d3e8;
          --text-primary: #0c1b35;
          --text-secondary: #3d5278;
          --text-muted: #7f8fa8;
          --green: #059669;
          --green-bg: #ecfdf5;
          --green-border: #a7f3d0;
          --amber: #b45309;
          --amber-bg: #fffbeb;
          --amber-border: #fcd34d;
          --red: #dc2626;
          --red-bg: #fef2f2;
          --red-border: #fca5a5;
          --violet: #6d28d9;
          --violet-bg: #f5f3ff;
          --violet-border: #c4b5fd;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }

        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in { animation: fade-in 0.3s ease both; }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Sidebar — navy */}
      <aside
        style={{
          width: "228px",
          flexShrink: 0,
          background: "var(--navy)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 18px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "var(--blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M2.5 10.5L6 6L9 8.5L12.5 3.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12.5" cy="3.5" r="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "white",
                  letterSpacing: "-0.01em",
                }}
              >
                Playto
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Pay Infrastructure
              </div>
            </div>
          </div>
        </div>

        {/* Merchants */}
        <div style={{ padding: "14px 10px", flex: 1 }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              padding: "0 8px",
              marginBottom: "6px",
            }}
          >
            Merchants
          </div>
          <MerchantSelector />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "5px",
            }}
          >
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 5px #34d399",
                animation: "live-pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              All systems normal
            </span>
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.15)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            v2.4.1
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <div
          style={{ maxWidth: "1080px", margin: "0 auto", padding: "36px 40px" }}
        >
          {selectedMerchant ? (
            <div className="animate-in">
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: "28px",
                  paddingBottom: "22px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: "27px",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      marginBottom: "5px",
                    }}
                  >
                    {selectedMerchant.name}
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {selectedMerchant.email}
                  </p>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "100px",
                    background: "var(--green-bg)",
                    border: "1px solid var(--green-border)",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--green)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      animation: "live-pulse 2s infinite",
                    }}
                  />
                  Live
                </div>
              </div>

              {/* Balance */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "10px",
                  }}
                >
                  Overview
                </div>
                <BalanceCard />
              </div>

              {/* Payout form + table */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "300px 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "10px",
                    }}
                  >
                    New Payout
                  </div>
                  <PayoutForm />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "10px",
                    }}
                  >
                    Payout History
                  </div>
                  <PayoutTable />
                </div>
              </div>

              {/* Ledger */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "10px",
                  }}
                >
                  Ledger
                </div>
                <LedgerTable />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: "14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "var(--blue-light)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="16"
                    height="16"
                    rx="4"
                    stroke="var(--blue)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M11 7v8M7 11h8"
                    stroke="var(--blue)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "18px",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                  }}
                >
                  Select a merchant
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Choose from the sidebar to view their dashboard
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
