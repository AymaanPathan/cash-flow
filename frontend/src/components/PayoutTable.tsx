import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPayouts } from "../store/slice/payoutSlice";
import StatusBadge from "./StatusBadge";

export default function PayoutTable() {
  const dispatch = useAppDispatch();
  const { selectedId } = useAppSelector((s) => s.merchants);
  const {
    list: payouts,
    loading,
    lastCreated,
  } = useAppSelector((s) => s.payouts);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(fetchPayouts(selectedId));
  }, [selectedId, lastCreated]);

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

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "20px",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: "44px",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              marginBottom: "8px",
              animation: "pulse 2s infinite",
              animationDelay: `${i * 0.1}s`,
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
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 4h10M2 7h7M2 10h5"
                stroke="#8b5cf6"
                strokeWidth="1.5"
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
            Payout History
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
          {payouts.length} total
        </div>
      </div>

      {payouts.length === 0 ? (
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
            No payouts yet
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Amount", "Status", "Attempts", "Created", "Note"].map(
                  (h) => (
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
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, i) => (
                <tr
                  key={payout.id}
                  style={{
                    borderBottom:
                      i < payouts.length - 1
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
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ₹
                      {Number(payout.amount_inr).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontFamily: "'DM Mono', monospace",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {payout.amount_paise.toLocaleString()} paise
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={payout.status} />
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {payout.attempt_count}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(payout.created_at)}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      maxWidth: "160px",
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
                      {payout.failure_reason ||
                        (payout.status === "completed" ? "Settled" : "—")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
