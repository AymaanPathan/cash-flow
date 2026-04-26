interface StatusBadgeProps {
  status: "pending" | "processing" | "completed" | "failed";
}

const config = {
  pending: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Processing",
    classes: "bg-blue-100 text-blue-800 border border-blue-200",
    dot: "bg-blue-500 animate-pulse",
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-100 text-red-800 border border-red-200",
    dot: "bg-red-500",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes, dot } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
