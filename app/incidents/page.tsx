import { AlertTriangle } from "lucide-react";

import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState } from "../../components/ui/states";

export default function IncidentsPage() {
  return (
    <main className="page">
      <PageHeader
        eyebrow="Operations"
        icon={<AlertTriangle size={18} aria-hidden />}
        title="Incident Intelligence"
        description="Analyze incident telemetry and rank likely root causes using the ML inference service."
      />

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <h3>Inputs</h3>
          <p className="muted">
            Incident analysis payload controls and scenario presets are available in this
            workflow.
          </p>
        </section>
      </GlowPanel>

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <EmptyState
            title="No analysis run yet"
            description="Run an incident analysis to see predicted incident type, ranked root causes, and evidence."
          />
        </section>
      </GlowPanel>
    </main>
  );
}
