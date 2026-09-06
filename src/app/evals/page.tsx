import { EvalRunner } from "@/components/EvalRunner";

export default function EvalsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Eval Runner</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Run the extraction eval suite across one or more models and compare results, cost, and
          latency per fixture.
        </p>
      </header>
      <EvalRunner />
    </main>
  );
}
