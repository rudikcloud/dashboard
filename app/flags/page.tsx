"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DataTableShell } from "../../components/ui/data-table-shell";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../components/ui/states";
import { useToast } from "../../components/ui/toast";
import {
  createFlag,
  listFlags,
  type FeatureFlag,
  updateFlag,
} from "../../lib/flags-client";

const ENVIRONMENT = "dev";

type FlagDraft = {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  allowlistText: string;
};

function parseAllowlist(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function createDefaultDraft(): FlagDraft {
  return {
    key: "",
    description: "",
    enabled: false,
    rolloutPercent: 0,
    allowlistText: "",
  };
}

function buildEditDraft(flag: FeatureFlag): FlagDraft {
  return {
    key: flag.key,
    description: flag.description,
    enabled: flag.enabled,
    rolloutPercent: flag.rollout_percent,
    allowlistText: flag.allowlist.join("\n"),
  };
}

export default function FlagsPage() {
  const { showToast } = useToast();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeatureFlag | null>(null);
  const [draft, setDraft] = useState<FlagDraft>(createDefaultDraft());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listFlags(ENVIRONMENT);
      setFlags(result);
      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load flags";
      setError(message);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  const filteredFlags = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return flags;
    }

    return flags.filter((flag) => {
      return (
        flag.key.toLowerCase().includes(query) ||
        flag.description.toLowerCase().includes(query)
      );
    });
  }, [flags, search]);

  const openCreateDialog = () => {
    setFormError(null);
    setDraft(createDefaultDraft());
    setCreateOpen(true);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setFormError(null);
    setDraft(buildEditDraft(flag));
    setEditTarget(flag);
  };

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setFormError(null);
    setDraft(createDefaultDraft());
  };

  const validateDraft = (isCreate: boolean): boolean => {
    if (isCreate && !draft.key.trim()) {
      setFormError("Flag key is required.");
      return false;
    }

    if (draft.rolloutPercent < 0 || draft.rolloutPercent > 100) {
      setFormError("Rollout percent must be between 0 and 100.");
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateDraft(true)) {
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await createFlag({
        key: draft.key.trim(),
        description: draft.description.trim(),
        environment: ENVIRONMENT,
        enabled: draft.enabled,
        rollout_percent: draft.rolloutPercent,
        allowlist: parseAllowlist(draft.allowlistText),
      });

      showToast({ title: "Flag created", description: "New feature flag saved." });
      closeDialogs();
      await loadFlags();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to create flag";

      if (message.toLowerCase().includes("already exists")) {
        setFormError(
          "A flag with this key already exists in this environment. Select it from the list and edit it.",
        );
      } else {
        setFormError("Unable to create flag. Please review your input and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) {
      return;
    }

    if (!validateDraft(false)) {
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await updateFlag(
        editTarget.key,
        {
          description: draft.description.trim(),
          enabled: draft.enabled,
          rollout_percent: draft.rolloutPercent,
          allowlist: parseAllowlist(draft.allowlistText),
        },
        editTarget.environment,
      );

      showToast({ title: "Flag updated", description: `${editTarget.key} saved.` });
      closeDialogs();
      await loadFlags();
    } catch {
      setFormError("Unable to save flag changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <PageHeader
        title="Feature Flags"
        description="Manage targeted rollouts using enabled state, allowlists, and percentage-based exposure."
        actions={
          <button type="button" className="button" onClick={openCreateDialog}>
            <Plus size={16} aria-hidden />
            New Flag
          </button>
        }
        meta={<span className="pill">Environment: {ENVIRONMENT}</span>}
      />

      {loading ? <LoadingSkeleton title="Loading feature flags" lines={6} /> : null}

      {error ? (
        <ErrorState
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void loadFlags()}
            >
              Retry
            </button>
          }
        />
      ) : null}

      {!loading && !error ? (
        <DataTableShell
          title="Flags"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search flags"
          pagination={<p>{filteredFlags.length} flags</p>}
        >
          {filteredFlags.length === 0 ? (
            <EmptyState
              title="No feature flags"
              description="Create a flag to start controlling rollouts for new functionality."
              action={
                <button type="button" className="button" onClick={openCreateDialog}>
                  Create Flag
                </button>
              }
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Description</th>
                  <th>Enabled</th>
                  <th>Rollout %</th>
                  <th>Allowlist</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => (
                  <tr key={`${flag.environment}:${flag.key}`}>
                    <td>
                      <strong>{flag.key}</strong>
                      <div className="muted">{flag.environment}</div>
                    </td>
                    <td>{flag.description || "-"}</td>
                    <td>
                      <span
                        className={`health-indicator ${
                          flag.enabled ? "health-healthy" : "health-offline"
                        }`}
                      >
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>{flag.rollout_percent}%</td>
                    <td>{flag.allowlist.length ? flag.allowlist.length : "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        onClick={() => openEditDialog(flag)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataTableShell>
      ) : null}

      {createOpen ? (
        <div className="dialog-overlay" role="presentation">
          <div className="dialog dialog-wide" role="dialog" aria-modal="true">
            <div className="dialog__header">
              <h3>Create Feature Flag</h3>
            </div>

            <div className="form">
              <label className="field">
                <span>Key</span>
                <input
                  type="text"
                  value={draft.key}
                  onChange={(event) => setDraft({ ...draft, key: event.target.value })}
                  placeholder="newCheckout"
                />
              </label>

              <label className="field">
                <span>Description</span>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Describe the rollout purpose"
                />
              </label>

              <label className="field">
                <span>Rollout Percent: {draft.rolloutPercent}%</span>
                <div className="range-row">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draft.rolloutPercent}
                    onChange={(event) =>
                      setDraft({ ...draft, rolloutPercent: Number(event.target.value) })
                    }
                    aria-label="Rollout percent slider"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.rolloutPercent}
                    onChange={(event) =>
                      setDraft({ ...draft, rolloutPercent: Number(event.target.value) })
                    }
                    aria-label="Rollout percent input"
                  />
                </div>
              </label>

              <label className="field checkbox-field">
                <span>Enabled</span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft({ ...draft, enabled: event.target.checked })
                  }
                />
              </label>

              <label className="field">
                <span>Allowlist (comma or newline separated, optional)</span>
                <textarea
                  value={draft.allowlistText}
                  onChange={(event) =>
                    setDraft({ ...draft, allowlistText: event.target.value })
                  }
                  placeholder="user@example.com"
                />
              </label>

              {formError ? <p className="error">{formError}</p> : null}
            </div>

            <div className="dialog__actions">
              <button type="button" className="button button-secondary" onClick={closeDialogs}>
                Cancel
              </button>
              <button type="button" className="button" onClick={() => void handleCreate()}>
                {saving ? "Saving..." : "Create Flag"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="dialog-overlay" role="presentation">
          <div className="dialog dialog-wide" role="dialog" aria-modal="true">
            <div className="dialog__header">
              <h3>Edit {editTarget.key}</h3>
            </div>

            <div className="form">
              <label className="field">
                <span>Description</span>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </label>

              <label className="field">
                <span>Rollout Percent: {draft.rolloutPercent}%</span>
                <div className="range-row">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draft.rolloutPercent}
                    onChange={(event) =>
                      setDraft({ ...draft, rolloutPercent: Number(event.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.rolloutPercent}
                    onChange={(event) =>
                      setDraft({ ...draft, rolloutPercent: Number(event.target.value) })
                    }
                    aria-label="Rollout percent input"
                  />
                </div>
              </label>

              <label className="field checkbox-field">
                <span>Enabled</span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft({ ...draft, enabled: event.target.checked })
                  }
                />
              </label>

              <label className="field">
                <span>Allowlist (comma or newline separated, optional)</span>
                <textarea
                  value={draft.allowlistText}
                  onChange={(event) =>
                    setDraft({ ...draft, allowlistText: event.target.value })
                  }
                />
              </label>

              {formError ? <p className="error">{formError}</p> : null}
            </div>

            <div className="dialog__actions">
              <button type="button" className="button button-secondary" onClick={closeDialogs}>
                Cancel
              </button>
              <button
                type="button"
                className="button"
                onClick={() => void handleEditSave()}
                disabled={saving}
              >
                <Save size={15} aria-hidden />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
