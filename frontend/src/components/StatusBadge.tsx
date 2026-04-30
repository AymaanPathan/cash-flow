interface StatusBadgeProps {
  status: "pending" | "processing" | "completed" | "failed";
}

const config = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    pulse: false,
  },
  processing: {
    label: "Processing",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
    pulse: true,
  },
  completed: {
    label: "Completed",
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.1)",
    border: "rgba(20,184,166,0.2)",
    pulse: false,
  },
  failed: {
    label: "Failed",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.1)",
    border: "rgba(244,63,94,0.2)",
    pulse: false,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color, bg, border, pulse } = config[status] ?? config.pending;

  return (
    <>
      <style>{`
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.5; }
        }
      `}</style>
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
          color,
          background: bg,
          border: `1px solid ${border}`,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            flexShrink: 0,
            animation: pulse ? "badge-pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
        {label}
      </span>
    </>
  );
}
