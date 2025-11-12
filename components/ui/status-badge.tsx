type StatusTone =
  | "pending"
  | "retrying"
  | "sent"
  | "failed"
  | "enabled"
  | "disabled"
  | "healthy"
  | "offline"
  | "unknown";

const STATUS_TONES: Record<string, StatusTone> = {
  pending: "pending",
  retrying: "retrying",
  sent: "sent",
  failed: "failed",
  enabled: "enabled",
  disabled: "disabled",
  healthy: "healthy",
  offline: "offline",
};

function normalizeStatus(value: string): { tone: StatusTone; label: string } {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const tone = STATUS_TONES[normalized] ?? "unknown";
  if (tone === "unknown") {
    return {
      tone,
      label: value,
    };
  }

  return {
    tone,
    label: normalized.replace(/_/g, " "),
  };
}

export function StatusBadge({ status }: { status: string }) {
  const { tone, label } = normalizeStatus(status);

  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
