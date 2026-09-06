# Structured Extraction

Turns a free-text job ad into validated, strongly-typed JSON — seniority, role type, required vs. nice-to-have skills, work arrangement, qualifications, and a set of grounded "red flags" — across multiple LLM providers, with an eval harness to measure whether it actually works.

Built as a hands-on exercise in **prompt engineering** and **structured outputs**: getting a model to return data that conforms to a schema every time, and then proving it with evals rather than vibes.

## What's interesting here

Most of the work isn't the API call — it's everything around it:

- **One Zod schema is the single source of truth.** It types the application, and it's converted at runtime into a provider-safe strict JSON Schema (`toStrictJsonSchema`) for the vendors' structured-output modes. No second, hand-maintained copy of the shape.
- **Providers sit behind one interface.** OpenAI and Anthropic both implement `LLMProvider` and return a neutral `{ usage, outcome }` envelope, where `outcome` is a discriminated union of `content` / `refusal` / `incomplete`. Vendor quirks (Anthropic's top-level `system`, required `max_tokens`, differing `stop_reason` values, JSON Schema keywords each vendor rejects) are absorbed in the adapter, so nothing above it knows which vendor ran.
- **The prompt is a versioned artifact, not a string literal.** It lives in `prompts/*.yaml`, is schema-validated on load, and its `version` is stamped into every telemetry record — so a result can always be traced back to the prompt that produced it.
- **Failure modes are modelled explicitly.** Refusal, truncation, and malformed JSON are distinct branches with their own error types, retried once, and mapped to HTTP status codes at the edge.
- **Every call is measured.** Tokens, cost (from a per-model pricing catalog), latency, and outcome are emitted per attempt through an injected sink — the console in the web app, an array in the eval runner.

## Evals

The extractor is graded by a fixture suite in `evals/`, which is the real point of the project: a prompt change is only an improvement if you can show it.

- `fixtures.ts` — job ads paired with expected values, asserting **only on axes that are actually stable**. Where models legitimately disagree (job5's seniority, job3's `vague_scope`), the axis is deliberately left unasserted rather than encoding a coin-flip as ground truth.
- Fixtures cover distinct failure shapes on purpose: an over-firing guard (a clean ad with mildly punchy wording that must *not* raise flags), a vague multi-track grad program (where "exposure to AWS/GraphQL/React" must not be fabricated into *required* skills), a high-seniority anchor, and one deliberately red-flag-loaded ad.
- `graders.ts` — each check is one small unit returning a `CheckResult` (name, passed, expected, actual); `gradeFixture` is a pure dispatcher with no I/O.
- `runner.ts` — runs the suite against one provider/model and returns a `ModelReport` with per-fixture cost and latency.
- `POST /api/evals` runs the matrix across several models at once; the `/evals` page compares them on pass rate, cost, and latency, with a drill-down into individual failures.

```bash
npm run eval                              # single model, prints the full report
npm run eval -- anthropic claude-haiku-4-5
```

> The sample ads in `sources/` are **synthetic**. Company names, brands, and identifying details are invented.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zod 4 · Vitest · OpenAI + Anthropic SDKs

## Getting started

```bash
cp .env.example .env.local   # then fill in the keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to paste in a job ad, or `/evals` to run the suite.

**API keys.** The web app constructs both providers at startup, so `npm run dev` needs `OPENAI_API_KEY` *and* `ANTHROPIC_API_KEY`. The CLI scripts import only the provider you ask for, so they need just that one vendor's key.

**Installs are pinned.** `.npmrc` sets `ignore-scripts=true` and a registry date cutoff as supply-chain hygiene. This means `npm install` resolves versions as of that date, not the latest — see the comments in that file.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm test` | Vitest — unit tests, no network |
| `npm run runner` | One extraction against a sample ad. **Real, billed API call.** |
| `npm run eval` | Full fixture suite against one model. **Real, billed API calls.** |
| `npm run lint` | ESLint |

Both `runner` and `eval` take an optional provider and model: `npm run runner -- anthropic claude-haiku-4-5`.

## How a request flows

```
POST /api/extraction
  → validate body (Zod; provider/model pair checked against the catalog)
  → extractStructuredData
      → build request from the loaded prompt + strict JSON Schema
      → provider.generate  ──► OpenAI | Anthropic
      → branch on outcome: content | refusal | incomplete
      → parse + validate against JobDescriptionSchema
      → retry once on a malformed response
      → emit telemetry (tokens, cost, latency, outcome, prompt version)
  → map extraction errors to status codes
```

The route is the composition root: it builds the providers, loads the prompt, and injects both into the handler. `extract` itself takes its dependencies as parameters and touches no globals, which is what makes the fake-provider tests possible — every error branch is exercised without a network call.

## Layout

```
prompts/     versioned prompt YAML (validated on load)
sources/     synthetic sample job ads
src/
  validators/  Zod schemas — the extraction schema + request validation
  lib/
    providers/ LLMProvider interface, OpenAI + Anthropic adapters, model catalog
    telemetry.ts, promptLoader.ts, toStrictJsonSchema.ts
  services/extraction/  the pipeline, its error types, and the route handler
  app/         API routes + UI
evals/       fixtures, graders, runner, report
tests/       Vitest suites (fake provider — no network)
```

## Known rough edges

- Model IDs and their per-token prices are hardcoded in `providerCatalog.ts`; prices drift and aren't checked against the vendors.
- Telemetry goes to the console. There's no persistence, so eval history isn't stored or trended over time.
- Failures aren't logged with their `cause` chain at the point they're mapped, so a production trace would be thinner than it should be.

## License

MIT — see [LICENSE](LICENSE).
