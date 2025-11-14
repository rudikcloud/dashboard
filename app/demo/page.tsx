"use client";

import { Gauge, RotateCcw, SlidersHorizontal, TriangleAlert, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { useToast } from "../../components/ui/toast";

type DemoMode = "normal" | "latency" | "error_storm";

type Preset = {
  id: DemoMode;
  label: string;
  description: string;
  impact: string;
  icon: typeof Zap;
  buttonLabel: string;
};

const presets: Preset[] = [
  {
    id: "latency",
    label: "Latency Spike",
    description: "Simulate delayed processing and slower service responses.",
    impact: "Use this to demonstrate degraded UX and deeper traces.",
    icon: Gauge,
    buttonLabel: "Apply Latency",
  },
  {
    id: "error_storm",
    label: "Error Storm",
    description: "Simulate elevated failure rates in asynchronous processing.",
    impact: "Use this to demonstrate retries, failures, and dead-letter behavior.",
    icon: TriangleAlert,
    buttonLabel: "Apply Error Storm",
  },
  {
    id: "normal",
    label: "Recover",
    description: "Return the platform to stable baseline behavior.",
    impact: "Use this to show recovery and normalization after injected failures.",
    icon: RotateCcw,
    buttonLabel: "Recover",
  },
];

function modeText(mode: DemoMode): string {
  if (mode === "latency") return "latency active";
  if (mode === "error_storm") return "error storm active";
  return "normal operation";
}

function statusForMode(mode: DemoMode): string {
  if (mode === "error_storm") return "failed";
  if (mode === "latency") return "retrying";
  return "healthy";
}

export default function DemoPage() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<DemoMode>("normal");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const applyPreset = (preset: Preset) => {
    if (preset.id === "normal") {
      setPendingPreset(preset);
      return;
    }

    setMode(preset.id);
    const now = new Date().toLocaleString();
    setLastUpdatedAt(now);
    setHistory((previous) => [`${now} • ${preset.label}`, ...previous.slice(0, 7)]);

    showToast({
      title: `${preset.label} activated`,
      description: "Adjust infra worker/env settings to run full backend injection.",
      variant: "info",
    });
  };

  const applyRecovery = () => {
    setMode("normal");
    setPendingPreset(null);
    const now = new Date().toLocaleString();
    setLastUpdatedAt(now);
    setHistory((previous) => [`${now} • Recover`, ...previous.slice(0, 7)]);
    showToast({ title: "Recovery applied", description: "Demo controls reset to baseline." });
  };

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === mode) ?? presets[2],
    [mode],
  );

  return (
    <main className="page">
      <PageHeader
        eyebrow="Reliability"
        icon={<SlidersHorizontal size={18} aria-hidden />}
        title="Demo Controls"
        description="Coordinate reliability demos with preset state controls and clear operational feedback."
        meta={
          <>
            <StatusBadge status={statusForMode(mode)} />
            <span className="pill">{modeText(mode)}</span>
          </>
        }
      />

      <GlowPanel className="glow-panel-card">
        <section className="card demo-current-state">
          <div>
            <h3>Current Demo State</h3>
            <p className="muted">
              Active preset: <strong>{activePreset.label}</strong>
            </p>
            <p>{lastUpdatedAt ? `Last updated: ${lastUpdatedAt}` : "No preset applied yet."}</p>
          </div>
          <div className="demo-current-state__badge-wrap">
            <StatusBadge status={statusForMode(mode)} />
            <p className="muted">{modeText(mode)}</p>
          </div>
        </section>
      </GlowPanel>

      <section className="control-grid">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = mode === preset.id;

          return (
            <GlowPanel key={preset.id} className="glow-panel-card">
              <article className={`card control-card${isActive ? " is-active" : ""}`}>
                <div className="control-card__head">
                  <div className="control-card__icon">
                    <Icon size={18} aria-hidden />
                  </div>
                  <h3>{preset.label}</h3>
                </div>
                <p>{preset.description}</p>
                <p className="muted">{preset.impact}</p>
                <div className="actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => applyPreset(preset)}
                    aria-label={`Apply ${preset.label} preset`}
                  >
                    {preset.buttonLabel}
                  </button>
                </div>
              </article>
            </GlowPanel>
          );
        })}
      </section>

      <GlowPanel className="glow-panel-card">
        <section className="card demo-state-grid">
          <article>
            <h3>Runbook Notes</h3>
            <p>
              Combine this panel with infrastructure env toggles to demonstrate retries,
              failures, recovery, and observability behavior.
            </p>
          </article>

          <article>
            <h3>Recent Preset Changes</h3>
            {history.length === 0 ? (
              <p>No actions yet.</p>
            ) : (
              <ul className="history-list">
                {history.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </GlowPanel>

      <ConfirmDialog
        open={Boolean(pendingPreset)}
        title="Apply recovery preset?"
        description="This resets the panel to baseline mode for post-failure demos."
        confirmText="Apply Recovery"
        onCancel={() => setPendingPreset(null)}
        onConfirm={applyRecovery}
      />
    </main>
  );
}
