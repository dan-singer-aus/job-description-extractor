"use client";

import { useState } from "react";
import { PROVIDER_CATALOG } from "@/lib/providers/providerCatalog";
import type { ProviderName } from "@/lib/providers/providerCatalog";
import type { JobDescription } from "@/validators/jobDescriptionSchema";
import { JobDescriptionResult } from "./JobDescriptionResult";

const PROVIDERS = Object.keys(PROVIDER_CATALOG) as ProviderName[];
const modelsFor = (provider: ProviderName) => Object.keys(PROVIDER_CATALOG[provider]);

type Status = "idle" | "loading" | "error" | "success";

export function ExtractionForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [provider, setProvider] = useState<ProviderName>(PROVIDERS[0]);
  const [model, setModel] = useState(modelsFor(PROVIDERS[0])[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobDescription | null>(null);

  function handleProviderChange(next: ProviderName) {
    setProvider(next);
    setModel(modelsFor(next)[0]); // reset to a model that belongs to the new provider
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, provider, model }),
      });

      if (!response.ok) {
        setError(await response.text());
        setStatus("error");
        return;
      }

      setResult((await response.json()) as JobDescription);
      setStatus("success");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";
  const canSubmit = jobDescription.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste a job description…"
          rows={12}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-relaxed shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-800"
        />

        <div className="flex flex-wrap items-end gap-4">
          <Field label="Provider">
            <Select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Model">
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              {modelsFor(provider).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <button
            type="submit"
            disabled={!canSubmit}
            className="ml-auto rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isLoading ? "Extracting…" : "Extract"}
          </button>
        </div>
      </form>

      {status === "error" && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {status === "success" && result && <JobDescriptionResult job={result} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      {children}
    </label>
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {children}
    </select>
  );
}
