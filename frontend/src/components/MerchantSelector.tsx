import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectMerchant } from "../store/slice/merchantSlice";

export default function MerchantSelector() {
  const dispatch = useAppDispatch();
  const { list, selectedId, loading } = useAppSelector((s) => s.merchants);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              height: "52px",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              animation: "pulse 2s infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {list.map((m) => {
        const isSelected = selectedId === m.id;
        const initials = m.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <button
            key={m.id}
            onClick={() => dispatch(selectMerchant(m.id))}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 10px",
              borderRadius: "8px",
              border: isSelected
                ? "1px solid var(--border-accent)"
                : "1px solid transparent",
              background: isSelected ? "var(--accent-cyan-dim)" : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: isSelected
                  ? "linear-gradient(135deg, var(--accent-cyan), #0891b2)"
                  : "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: isSelected ? "white" : "var(--text-muted)",
                flexShrink: 0,
                boxShadow: isSelected
                  ? "0 0 12px rgba(20,184,166,0.3)"
                  : "none",
                border: isSelected ? "none" : "1px solid var(--border)",
                letterSpacing: "0.05em",
              }}
            >
              {initials}
            </div>

            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  color: isSelected
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.01em",
                }}
              >
                {m.name}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                  color: isSelected
                    ? "var(--accent-cyan)"
                    : "var(--text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "1px",
                }}
              >
                {m.email}
              </div>
            </div>

            {isSelected && (
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent-cyan)",
                  flexShrink: 0,
                  boxShadow: "0 0 8px var(--accent-cyan)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
