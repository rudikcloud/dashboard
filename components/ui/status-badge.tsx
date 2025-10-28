type StatusTone = "pending" | "retrying" | "sent" | "failed" | "unknown";

function normalizeStatus(value: string): StatusTone {
  if (value === "pending") return "pending";
  if (value === "retrying") return "retrying";
  if (value === "sent") return "sent";
  if (value === "failed") return "failed";
  return "unknown";
}

export function StatusBadge({ status }: { status: string }) {
  const tone = normalizeStatus(status.toLowerCase());

  return (
    <span className={`status-badge status-${tone}`}>
      {tone === "unknown" ? status : tone}
    </span>
  );
}
