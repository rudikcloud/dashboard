"use client";

import { AlertTriangle, Flag, Gauge, ShieldAlert, Sparkles, UserCircle2 } from "lucide-react";
import { FormEvent, type ReactNode, useMemo, useState } from "react";

import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../components/ui/states";
import { useToast } from "../../components/ui/toast";
import {
  analyzeIncident,
  type IncidentAnalyzePayload,
  type IncidentAnalyzeResponse,
} from "../../lib/incident-client";

type Preset = {
  key: string;
  label: string;
  description: string;
  payload: IncidentAnalyzePayload;
};

type FieldConfig = {
  key: keyof IncidentAnalyzePayload;
  label: string;
  step?: string;
  min?: number;
  max?: number;
};

const DEFAULT_PAYLOAD: IncidentAnalyzePayload = {
  top_k: 3,
  latency_mean_ms: 280,
  latency_p95_ms: 620,
  error_rate: 0.04,
  request_count: 40,
  orders_create_mean_ms: 210,
  orders_create_p95_ms: 420,
  orders_create_error_rate: 0.02,
  orders_create_count: 20,
  flags_eval_mean_ms: 240,
  flags_eval_p95_ms: 510,
  flags_eval_error_rate: 0.03,
  flags_eval_count: 12,
  auth_me_mean_ms: 120,
  auth_me_p95_ms: 250,
  auth_me_error_rate: 0.01,
  auth_me_count: 8,
};

const PRESETS: Preset[] = [
  {
    key: "latency-spike",
    label: "Latency Spike",
    description: "High p95 latency with low error rate across requests.",
    payload: {
      ...DEFAULT_PAYLOAD,
      latency_mean_ms: 540,
      latency_p95_ms: 1460,
      error_rate: 0.06,
      orders_create_p95_ms: 1900,
    },
  },
  {
    key: "error-storm",
    label: "Error Storm",
    description: "Broad elevated error rate indicating unstable dependencies.",
    payload: {
      ...DEFAULT_PAYLOAD,
      latency_mean_ms: 440,
      latency_p95_ms: 920,
      error_rate: 0.48,
      orders_create_error_rate: 0.22,
      flags_eval_error_rate: 0.56,
      auth_me_error_rate: 0.35,
    },
  },
  {
    key: "worker-retry",
    label: "Worker Retry / DLQ",
    description: "Order path appears healthy, but background processing degrades.",
    payload: {
      ...DEFAULT_PAYLOAD,
      latency_mean_ms: 330,
      latency_p95_ms: 860,
      error_rate: 0.18,
      orders_create_error_rate: 0.04,
      flags_eval_error_rate: 0.02,
      auth_me_error_rate: 0.01,
      orders_create_p95_ms: 740,
    },
  },
  {
    key: "flags-failure",
    label: "Flags Failure",
    description: "Flag evaluation path drives errors and p95 spikes.",
    payload: {
      ...DEFAULT_PAYLOAD,
      latency_mean_ms: 510,
      latency_p95_ms: 1290,
      error_rate: 0.34,
      flags_eval_mean_ms: 730,
      flags_eval_p95_ms: 1600,
      flags_eval_error_rate: 0.78,
    },
  },
  {
    key: "auth-failure",
    label: "Auth Failure",
    description: "Identity path fails while other endpoints remain mostly stable.",
    payload: {
      ...DEFAULT_PAYLOAD,
      latency_mean_ms: 350,
      latency_p95_ms: 810,
      error_rate: 0.31,
      auth_me_mean_ms: 620,
      auth_me_p95_ms: 1380,
      auth_me_error_rate: 0.88,
    },
  },
];

const GLOBAL_FIELDS: FieldConfig[] = [
  { key: "top_k", label: "Top K", min: 1, max: 6, step: "1" },
  { key: "latency_mean_ms", label: "Latency Mean (ms)", min: 0, step: "1" },
  { key: "latency_p95_ms", label: "Latency P95 (ms)", min: 0, step: "1" },
  { key: "error_rate", label: "Error Rate", min: 0, max: 1, step: "0.01" },
  { key: "request_count", label: "Request Count", min: 0, step: "1" },
];

const ORDERS_FIELDS: FieldConfig[] = [
  { key: "orders_create_mean_ms", label: "Orders Mean (ms)", min: 0, step: "1" },
  { key: "orders_create_p95_ms", label: "Orders P95 (ms)", min: 0, step: "1" },
  { key: "orders_create_error_rate", label: "Orders Error Rate", min: 0, max: 1, step: "0.01" },
  { key: "orders_create_count", label: "Orders Count", min: 0, step: "1" },
];

const FLAGS_FIELDS: FieldConfig[] = [
  { key: "flags_eval_mean_ms", label: "Flags Mean (ms)", min: 0, step: "1" },
  { key: "flags_eval_p95_ms", label: "Flags P95 (ms)", min: 0, step: "1" },
  { key: "flags_eval_error_rate", label: "Flags Error Rate", min: 0, max: 1, step: "0.01" },
  { key: "flags_eval_count", label: "Flags Count", min: 0, step: "1" },
];

const AUTH_FIELDS: FieldConfig[] = [
  { key: "auth_me_mean_ms", label: "Auth Mean (ms)", min: 0, step: "1" },
  { key: "auth_me_p95_ms", label: "Auth P95 (ms)", min: 0, step: "1" },
  { key: "auth_me_error_rate", label: "Auth Error Rate", min: 0, max: 1, step: "0.01" },
  { key: "auth_me_count", label: "Auth Count", min: 0, step: "1" },
];

export default function IncidentsPage() {
  const { showToast } = useToast();

  const [payload, setPayload] = useState<IncidentAnalyzePayload>({ ...DEFAULT_PAYLOAD });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetCount = useMemo(() => PRESETS.length, []);

  const handleFieldChange = (key: keyof IncidentAnalyzePayload, nextValue: string) => {
    const parsed = Number(nextValue);
    setPayload((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const runAnalysis = async (nextPayload: IncidentAnalyzePayload) => {
    setLoading(true);
    try {
      const analysis = await analyzeIncident(nextPayload);
      setResult(analysis);
      setError(null);
      showToast({
        title: "Analysis complete",
        description: `Predicted incident type: ${analysis.incident_type.label}`,
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Incident analysis failed";
      setError(message);
      setResult(null);
      showToast({
        variant: "error",
        title: "Analysis failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActivePreset(null);
    void runAnalysis(payload);
  };

  const handlePresetClick = (preset: Preset) => {
    setActivePreset(preset.key);
    setPayload({ ...preset.payload });
    void runAnalysis(preset.payload);
  };

  const renderFieldGroup = (title: string, icon: ReactNode, fields: FieldConfig[]) => (
    <section className="incidents-form__section" aria-label={title}>
      <div className="incidents-form__section-title">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="incidents-form__grid">
        {fields.map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input
              type="number"
              value={payload[field.key]}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
              min={field.min}
              max={field.max}
              step={field.step ?? "1"}
            />
          </label>
        ))}
      </div>
    </section>
  );

  return (
    <main className="page">
      <PageHeader
        eyebrow="Operations"
        icon={<AlertTriangle size={18} aria-hidden />}
        title="Incident Intelligence"
        description="Analyze latency/error telemetry and rank likely root causes with confidence."
      />

      <GlowPanel className="glow-panel-card">
        <section className="card incidents-presets">
          <div className="incidents-presets__header">
            <h3>Analyze via Presets</h3>
            <p>{presetCount} scenarios tuned for platform failure demonstrations.</p>
          </div>
          <div className="incidents-presets__actions">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`button button-secondary${activePreset === preset.key ? " is-active" : ""}`}
                onClick={() => handlePresetClick(preset)}
                aria-pressed={activePreset === preset.key}
              >
                <Sparkles size={14} aria-hidden />
                {preset.label}
              </button>
            ))}
          </div>
          <p className="muted">
            Selecting a preset auto-fills metrics and runs analysis immediately.
          </p>
        </section>
      </GlowPanel>

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <h3>Manual Incident Payload</h3>
          <p className="muted">
            Enter incident metrics from client probes or synthetic test runs, then analyze.
          </p>

          <form className="form incidents-form" onSubmit={handleSubmit}>
            {renderFieldGroup(
              "Global Metrics",
              <Gauge size={16} aria-hidden />,
              GLOBAL_FIELDS,
            )}
            {renderFieldGroup(
              "Orders Endpoint",
              <ShieldAlert size={16} aria-hidden />,
              ORDERS_FIELDS,
            )}
            {renderFieldGroup(
              "Flags Endpoint",
              <Flag size={16} aria-hidden />,
              FLAGS_FIELDS,
            )}
            {renderFieldGroup(
              "Auth Endpoint",
              <UserCircle2 size={16} aria-hidden />,
              AUTH_FIELDS,
            )}

            <div className="actions incidents-form__actions">
              <button type="submit" className="button" disabled={loading}>
                {loading ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>
          </form>
        </section>
      </GlowPanel>

      {loading ? <LoadingSkeleton title="Analyzing incident sample" lines={5} /> : null}

      {error ? (
        <ErrorState
          title="Incident analysis failed"
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void runAnalysis(payload)}
            >
              Retry
            </button>
          }
        />
      ) : null}

      {!loading && !error && !result ? (
        <GlowPanel className="glow-panel-card">
          <section className="card">
            <EmptyState
              title="No analysis run yet"
              description="Use a preset or submit the manual payload to generate incident predictions."
            />
          </section>
        </GlowPanel>
      ) : null}
    </main>
  );
}
