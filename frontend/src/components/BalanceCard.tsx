import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchBalance } from "../store/slice/merchantSlice";

export default function BalanceCard() {
  const dispatch = useAppDispatch();
  const { selectedId, balance, balanceLoading } = useAppSelector(
    (s) => s.merchants,
  );

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchBalance(selectedId));
      const interval = setInterval(
        () => dispatch(fetchBalance(selectedId)),
        5000,
      );
      return () => clearInterval(interval);
    }
  }, [selectedId, dispatch]);

  if (balanceLoading && !balance) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              animation: "pulse 2s infinite",
            }}
          >
            <div
              style={{
                height: "10px",
                background: "var(--bg-hover)",
                borderRadius: "4px",
                width: "80px",
                marginBottom: "16px",
              }}
            />
            <div
              style={{
                height: "28px",
                background: "var(--bg-hover)",
                borderRadius: "4px",
                width: "120px",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!balance) return null;

  const cards = [
    {
      label: "Available",
      sublabel: "Ready to withdraw",
      value: `₹${Number(balance.available_balance_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.available_balance_paise.toLocaleString()} paise`,
      accentColor: "#14b8a6",
      glowColor: "rgba(20,184,166,0.15)",
      borderColor: "rgba(20,184,166,0.2)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="#14b8a6" strokeWidth="1.5" />
          <path
            d="M8 5v3l2 1.5"
            stroke="#14b8a6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      trend: "+2.4%",
      trendUp: true,
    },
    {
      label: "Held",
      sublabel: "In processing",
      value: `₹${Number(balance.held_balance_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.held_balance_paise.toLocaleString()} paise`,
      accentColor: "#f59e0b",
      glowColor: "rgba(245,158,11,0.12)",
      borderColor: "rgba(245,158,11,0.2)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="3"
            y="2"
            width="10"
            height="12"
            rx="2"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
          <path
            d="M6 6h4M6 9h2"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      trend: null,
      trendUp: null,
    },
    {
      label: "Total Credits",
      sublabel: "All time volume",
      value: `₹${(balance.total_credits_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.total_credits_paise.toLocaleString()} paise`,
      accentColor: "#8b5cf6",
      glowColor: "rgba(139,92,246,0.12)",
      borderColor: "rgba(139,92,246,0.2)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 12L6 7L9 10L14 4"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      trend: "+18.2%",
      trendUp: true,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${card.borderColor}`,
            borderRadius: "12px",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: `0 0 0 0 ${card.glowColor}`,
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              `0 8px 32px ${card.glowColor}`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              `0 0 0 0 ${card.glowColor}`;
          }}
        >
          {/* Glow orb */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: card.glowColor,
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: card.glowColor,
                  border: `1px solid ${card.borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {card.label}
                </div>
              </div>
            </div>
            {card.trend && (
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 500,
                  color: card.trendUp
                    ? "var(--accent-emerald)"
                    : "var(--accent-rose)",
                  background: card.trendUp
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(244,63,94,0.08)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  border: `1px solid ${card.trendUp ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                }}
              >
                {card.trend}
              </div>
            )}
          </div>

          {/* Value */}
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "24px",
              fontWeight: 500,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "6px",
              lineHeight: 1,
            }}
          >
            {card.value}
          </div>

          {/* Sub */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontFamily: "'DM Mono', monospace",
                color: card.accentColor,
                opacity: 0.8,
              }}
            >
              {card.sub}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {card.sublabel}
            </span>
          </div>

          {/* Bottom accent line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, ${card.accentColor}40, ${card.accentColor}, ${card.accentColor}40)`,
              borderRadius: "0 0 12px 12px",
            }}
          />
        </div>
      ))}
    </div>
  );
}
