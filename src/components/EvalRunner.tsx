"use client";

import { useState } from "react";
import { PROVIDER_CATALOG } from "@/lib/providers/providerCatalog";
import type { ProviderName } from "@/lib/providers/providerCatalog";
import type { EvalReport } from "../../evals/report";
import { EvalReportView } from "./EvalReportView";

type Selection = { provider: ProviderName; model: string; key: string };

const SELECTIONS: Selection[] = Object.entries(PROVIDER_CATALOG).flatMap(([provider, models]) =>
  Object.keys(models).map((model) => ({
    provider: provider as ProviderName,
    model,
    key: `${provider}/${model}`,
  })),
);

type Status = "idle" | "loading" | "error" | "success";

export function EvalRunner() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvalReport | null>(null);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function run() {
    const models = SELECTIONS.filter((s) => selected.has(s.key)).map((s) => ({
      provider: s.provider,
      model: s.model,
    }));
    setStatus("loading");
    setError(null);
    setReport(null);
    try {
      const response = await fetch("/api/evals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models }),
      });
      if (!response.ok) {
        setError(await response.text());
        setStatus("error");
        return;
      }
      setReport((await response.json()) as EvalReport);
      setStatus("success");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";
  const canRun = selected.size > 0 && !isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Models</p>
        <div className="flex flex-wrap gap-2">
          {SELECTIONS.map((s) => {
            const checked = selected.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  checked
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {s.model}
                <span className={checked ? "ml-1 opacity-70" : "ml-1 text-zinc-400"}>
                  {s.provider}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={!canRun}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isLoading ? "Running…" : "Run evals"}
        </button>
        <span className="text-xs text-zinc-500">
          {selected.size} model{selected.size === 1 ? "" : "s"} selected · each runs the full suite
          (billed)
        </span>
      </div>

      {status === "error" && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {status === "success" && report && <EvalReportView report={report} />}
    </div>
  );
}
