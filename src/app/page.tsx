import { ExtractionForm } from "@/components/ExtractionForm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">JD Structured Extractor</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Paste a job description, pick a model, and get a structured, validated breakdown.
        </p>
      </header>
      <ExtractionForm />
    </main>
  );
}
