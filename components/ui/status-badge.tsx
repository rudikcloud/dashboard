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

const STATUS_TONES: Record<string, { tone: StatusTone; label?: string }> = {
  pending: { tone: "pending" },
  retrying: { tone: "retrying" },
  sent: { tone: "sent" },
  failed: { tone: "failed" },
  enabled: { tone: "enabled" },
  disabled: { tone: "disabled" },
  healthy: { tone: "healthy" },
  offline: { tone: "offline" },
  degraded: { tone: "retrying", label: "degraded" },
  syncing: { tone: "pending", label: "syncing" },
  requires_auth: { tone: "pending", label: "auth required" },
};

function normalizeStatus(value: string): { tone: StatusTone; label: string } {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const mapped = STATUS_TONES[normalized];

  if (!mapped) {
    return {
      tone: "unknown",
      label: value,
    };
  }

  return {
    tone: mapped.tone,
    label: mapped.label ?? normalized.replace(/_/g, " "),
  };
}

export function StatusBadge({ status }: { status: string }) {
  const { tone, label } = normalizeStatus(status);

  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
