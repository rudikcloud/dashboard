"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createFlag,
  listFlags,
  type FeatureFlag,
  updateFlag,
} from "../../lib/flags-client";

const ENVIRONMENT = "dev";

type FlagDraft = {
  description: string;
  enabled: boolean;
  rolloutPercent: string;
  allowlistText: string;
};

function toAllowlist(allowlistText: string): string[] {
  return allowlistText
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export default function FlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [drafts, setDrafts] = useState<Record<string, FlagDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);
  const [newRolloutPercent, setNewRolloutPercent] = useState("0");
  const [newAllowlistText, setNewAllowlistText] = useState("");

  const loadFlags = useCallback(async () => {
    try {
      const result = await listFlags(ENVIRONMENT);
      setFlags(result);

      setDrafts((previous) => {
        const nextDrafts: Record<string, FlagDraft> = { ...previous };
        for (const flag of result) {
          const id = `${flag.environment}:${flag.key}`;
          if (!nextDrafts[id]) {
            nextDrafts[id] = {
              description: flag.description,
              enabled: flag.enabled,
              rolloutPercent: String(flag.rollout_percent),
              allowlistText: flag.allowlist.join(", "),
            };
          }
        }
        for (const id of Object.keys(nextDrafts)) {
          if (!result.some((flag) => `${flag.environment}:${flag.key}` === id)) {
            delete nextDrafts[id];
          }
        }
        return nextDrafts;
      });

      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load flags";
      setError(message);
      setFlags([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleCreateFlag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedKey = newKey.trim();
    const rollout = Number(newRolloutPercent);
    if (!normalizedKey) {
      setError("Flag key is required.");
      return;
    }
    if (Number.isNaN(rollout) || rollout < 0 || rollout > 100) {
      setError("Rollout percent must be between 0 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      await createFlag({
        key: normalizedKey,
        description: newDescription.trim(),
        environment: ENVIRONMENT,
        enabled: newEnabled,
        rollout_percent: rollout,
        allowlist: toAllowlist(newAllowlistText),
      });
      setNewKey("");
      setNewDescription("");
      setNewEnabled(false);
      setNewRolloutPercent("0");
      setNewAllowlistText("");
      await loadFlags();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to create flag";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraft = (id: string, update: Partial<FlagDraft>) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...update,
      },
    }));
  };

  const handleSaveFlag = async (flag: FeatureFlag) => {
    const id = `${flag.environment}:${flag.key}`;
    const draft = drafts[id];
    if (!draft) {
      return;
    }

    const rollout = Number(draft.rolloutPercent);
    if (Number.isNaN(rollout) || rollout < 0 || rollout > 100) {
      setError("Rollout percent must be between 0 and 100.");
      return;
    }

    setSavingKey(id);
    try {
      await updateFlag(
        flag.key,
        {
          description: draft.description.trim(),
          enabled: draft.enabled,
          rollout_percent: rollout,
          allowlist: toAllowlist(draft.allowlistText),
        },
        flag.environment,
      );
      await loadFlags();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to save flag";
      setError(message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <main className="page">
      <h1>Feature Flags</h1>

      <section className="card">
        <h2>Create Flag</h2>
        <form className="form" onSubmit={handleCreateFlag}>
          <label className="field">
            <span>Key</span>
            <input
              type="text"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Description</span>
            <input
              type="text"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Rollout Percent (0-100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={newRolloutPercent}
              onChange={(event) => setNewRolloutPercent(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Allowlist (comma-separated ids/emails, optional)</span>
            <input
              type="text"
              value={newAllowlistText}
              onChange={(event) => setNewAllowlistText(event.target.value)}
            />
          </label>

          <label className="field">
            <span>
              <input
                type="checkbox"
                checked={newEnabled}
                onChange={(event) => setNewEnabled(event.target.checked)}
              />{" "}
              Enabled
            </span>
          </label>

          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Creating..." : "Create flag"}
          </button>
        </form>
      </section>

      {loading ? <p>Loading flags...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error ? (
        <section className="card">
          <h2>Flags ({ENVIRONMENT})</h2>
          {flags.length === 0 ? <p>No flags yet.</p> : null}

          {flags.map((flag) => {
            const id = `${flag.environment}:${flag.key}`;
            const draft = drafts[id];
            if (!draft) {
              return null;
            }

            return (
              <div className="card" key={id}>
                <p>
                  <strong>{flag.key}</strong>
                </p>

                <label className="field">
                  <span>Description</span>
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(event) =>
                      updateDraft(id, { description: event.target.value })
                    }
                  />
                </label>

                <label className="field">
                  <span>Rollout Percent (0-100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.rolloutPercent}
                    onChange={(event) =>
                      updateDraft(id, { rolloutPercent: event.target.value })
                    }
                  />
                </label>

                <label className="field">
                  <span>Allowlist (comma-separated, optional)</span>
                  <input
                    type="text"
                    value={draft.allowlistText}
                    onChange={(event) =>
                      updateDraft(id, { allowlistText: event.target.value })
                    }
                  />
                </label>

                <label className="field">
                  <span>
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(event) =>
                        updateDraft(id, { enabled: event.target.checked })
                      }
                    />{" "}
                    Enabled
                  </span>
                </label>

                <button
                  type="button"
                  className="button"
                  onClick={() => handleSaveFlag(flag)}
                  disabled={savingKey === id}
                >
                  {savingKey === id ? "Saving..." : "Save changes"}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      <p>
        <Link href="/orders">Go to Orders</Link>
      </p>
      <p>
        <Link href="/audit">View Audit Logs</Link>
      </p>
      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
