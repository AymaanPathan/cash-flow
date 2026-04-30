import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchLedger } from "../store/slice/merchantSlice";

export default function LedgerTable() {
  const dispatch = useAppDispatch();
  const { selectedId, ledger, ledgerLoading } = useAppSelector(
    (s) => s.merchants,
  );

  useEffect(() => {
    if (selectedId) dispatch(fetchLedger(selectedId));
  }, [selectedId]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (ledgerLoading && ledger.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "20px",
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              height: "44px",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              marginBottom: "8px",
              animation: "pulse 2s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="2"
                y="2"
                width="10"
                height="10"
                rx="2"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <path
                d="M5 5h4M5 7h4M5 9h2"
                stroke="#f59e0b"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Ledger
          </span>
        </div>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'DM Mono', monospace",
            color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            padding: "3px 10px",
            borderRadius: "100px",
          }}
        >
          {ledger.length} entries
        </div>
      </div>

      {ledger.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.3 }}>
            ◻
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            No ledger entries yet
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Type", "Amount", "Description", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry, i) => {
                const isCredit = entry.entry_type === "credit";
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom:
                        i < ledger.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "3px 10px",
                          borderRadius: "100px",
                          fontSize: "10px",
                          fontFamily: "'DM Mono', monospace",
                          fontWeight: 500,
                          background: isCredit
                            ? "rgba(20,184,166,0.1)"
                            : "rgba(244,63,94,0.1)",
                          border: `1px solid ${isCredit ? "rgba(20,184,166,0.2)" : "rgba(244,63,94,0.2)"}`,
                          color: isCredit
                            ? "var(--accent-cyan)"
                            : "var(--accent-rose)",
                        }}
                      >
                        <span style={{ fontSize: "12px", lineHeight: 1 }}>
                          {isCredit ? "↑" : "↓"}
                        </span>
                        {isCredit ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: isCredit
                            ? "var(--accent-cyan)"
                            : "var(--accent-rose)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {isCredit ? "+" : "−"}₹
                        {Number(entry.amount_inr).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        maxWidth: "240px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.description || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(entry.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
