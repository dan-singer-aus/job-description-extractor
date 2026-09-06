import type { EvalReport, ModelReport, FixtureReport } from "../../evals/report";

const formatCost = (usd: number) => `$${usd.toFixed(4)}`;
const formatLatency = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function EvalReportView({ report }: { report: EvalReport }) {
  if (report.models.length === 0) return null;

  // All models run the same fixtures, so use the first model's list as the row spine.
  const fixtureRows = report.models[0].fixtures.map((f) => ({ id: f.id, name: f.name }));

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 dark:border-zinc-700">
              <th className="p-2 text-left font-medium">Fixture</th>
              {report.models.map((model) => (
                <th key={`${model.provider}/${model.model}`} className="p-2 text-left align-top">
                  <ModelHeader model={model} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fixtureRows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="p-2 align-top font-medium text-zinc-700 dark:text-zinc-300">
                  {row.name}
                </td>
                {report.models.map((model) => {
                  const fixture = model.fixtures.find((f) => f.id === row.id);
                  return (
                    <td key={`${model.provider}/${model.model}`} className="p-2 align-top">
                      {fixture ? <FixtureCell fixture={fixture} /> : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FailureDetails report={report} />
    </div>
  );
}

// Shows expected vs actual for every failed check (and errored fixtures), grouped by
// model — so you can read the actual values, e.g. the ungrounded quotes from Quotes Grounded.
function FailureDetails({ report }: { report: EvalReport }) {
  const hasFailures = report.models.some((m) =>
    m.fixtures.some((f) => f.error !== undefined || f.results.some((c) => !c.passed)),
  );
  if (!hasFailures) return null;

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Failure details
      </h3>
      {report.models.map((model) => {
        const failing = model.fixtures.filter(
          (f) => f.error !== undefined || f.results.some((c) => !c.passed),
        );
        if (failing.length === 0) return null;
        return (
          <div key={`${model.provider}/${model.model}`} className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">
              {model.model} <span className="font-normal text-zinc-500">{model.provider}</span>
            </h4>
            {failing.map((fixture) => (
              <div
                key={fixture.id}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="mb-1.5 text-sm font-medium">{fixture.name}</p>
                {fixture.error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{fixture.error}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {fixture.results
                      .filter((c) => !c.passed)
                      .map((check) => (
                        <li key={check.name} className="flex flex-col text-sm">
                          <span className="text-red-600 dark:text-red-400">✗ {check.name}</span>
                          <span className="text-xs text-zinc-500">
                            expected: {formatValue(check.expected)} · actual:{" "}
                            {formatValue(check.actual)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length === 0 ? "(none)" : value.map(String).join(" | ");
  if (typeof value === "string") return value || "(empty)";
  return String(value);
}

function ModelHeader({ model }: { model: ModelReport }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold">{model.model}</span>
      <span className="text-xs font-normal text-zinc-500">{model.provider}</span>
      <span className="mt-1 text-xs font-normal text-zinc-600 dark:text-zinc-400">
        {model.passedChecks}/{model.totalChecks} checks
        {model.erroredFixtures > 0 && (
          <span className="text-red-600 dark:text-red-400"> · {model.erroredFixtures} errored</span>
        )}
      </span>
      <span className="text-xs font-normal text-zinc-500">
        {formatCost(model.totalCost)} · {formatLatency(model.avgLatencyMs)} avg
      </span>
    </div>
  );
}

function FixtureCell({ fixture }: { fixture: FixtureReport }) {
  if (fixture.error) {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
          ERROR
        </span>
        <Meta cost={fixture.cost} latencyMs={fixture.latencyMs} />
      </div>
    );
  }

  const passed = fixture.results.filter((c) => c.passed).length;
  const total = fixture.results.length;
  const failed = fixture.results.filter((c) => !c.passed);
  const allPassed = passed === total;

  return (
    <div className="flex flex-col gap-1">
      <span
        className={
          allPassed
            ? "font-medium text-green-700 dark:text-green-400"
            : "font-medium text-amber-700 dark:text-amber-400"
        }
      >
        {passed}/{total}
      </span>
      {failed.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-red-600 dark:text-red-400">
          {failed.map((check) => (
            <li key={check.name}>✗ {check.name}</li>
          ))}
        </ul>
      )}
      <Meta cost={fixture.cost} latencyMs={fixture.latencyMs} />
    </div>
  );
}

function Meta({ cost, latencyMs }: { cost: number; latencyMs: number }) {
  return (
    <span className="text-xs text-zinc-500">
      {formatCost(cost)} · {formatLatency(latencyMs)}
    </span>
  );
}
