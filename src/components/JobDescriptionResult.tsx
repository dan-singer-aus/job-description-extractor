import type { JobDescription } from "@/validators/jobDescriptionSchema";

type Skill = JobDescription["requiredSkills"][number];
type RedFlag = JobDescription["redFlags"][number];

const SENIORITY_TONE: Record<JobDescription["seniority"]["level"], Tone> = {
  junior: "blue",
  mid: "blue",
  senior: "violet",
  lead: "violet",
  unclear: "zinc",
};

export function JobDescriptionResult({ job }: { job: JobDescription }) {
  return (
    <article className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex flex-col gap-3 border-b border-zinc-100 pb-5 dark:border-zinc-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {job.roleType.map(titleCase).join(" / ")} ·{" "}
            <span className="text-zinc-600 dark:text-zinc-400">{job.companyName}</span>
          </h2>
          {job.recruiter && <Badge tone="amber">via recruiter</Badge>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={SENIORITY_TONE[job.seniority.level]}>{job.seniority.level}</Badge>
          <Badge tone="zinc">{job.workArrangement}</Badge>
          <Badge tone="zinc">{job.workType}</Badge>
          {job.location && <Badge tone="zinc">{job.location}</Badge>}
          {job.salary && <Badge tone="green">{job.salary}</Badge>}
        </div>

        {job.companyDescription && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {job.companyDescription}
          </p>
        )}
      </header>

      <Section title="Seniority">
        <p className="text-sm">
          <span className="font-medium">{job.seniority.level}</span> · {job.seniority.confidence}{" "}
          confidence
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {job.seniority.reasoning}
        </p>
      </Section>

      <Section title="Domain">
        <p className="text-sm">{job.domain}</p>
      </Section>

      {job.requiredSkills.length > 0 && (
        <Section title="Required skills">
          <SkillChips skills={job.requiredSkills} />
        </Section>
      )}

      {job.niceToHaveSkills.length > 0 && (
        <Section title="Nice to have">
          <SkillChips skills={job.niceToHaveSkills} />
        </Section>
      )}

      {job.keyResponsibilities.length > 0 && (
        <Section title="Key responsibilities">
          <BulletList items={job.keyResponsibilities} />
        </Section>
      )}

      {job.qualifications.length > 0 && (
        <Section title="Qualifications">
          <ul className="flex flex-col gap-1.5 text-sm">
            {job.qualifications.map((q, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span>{q.options.map(titleCase).join(" or ")}</span>
                <Badge tone="zinc">{q.requirementLevel}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {job.eligibility.length > 0 && (
        <Section title="Eligibility">
          <BulletList items={job.eligibility} />
        </Section>
      )}

      {job.traits.length > 0 && (
        <Section title="Traits">
          <div className="flex flex-wrap gap-2">
            {job.traits.map((t, i) => (
              <Chip key={i}>{t}</Chip>
            ))}
          </div>
        </Section>
      )}

      {job.redFlags.length > 0 && (
        <Section title={`Red flags (${job.redFlags.length})`}>
          <div className="flex flex-col gap-3">
            {job.redFlags.map((flag, i) => (
              <RedFlagCard key={i} flag={flag} />
            ))}
          </div>
        </Section>
      )}

      {job.contactPerson && (
        <Section title="Contact">
          <p className="text-sm">{job.contactPerson}</p>
        </Section>
      )}
    </article>
  );
}

function SkillChips({ skills }: { skills: Skill[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <Chip key={i} tone={skill.category === "hard" ? "blue" : "zinc"}>
          {skill.options.join(" / ")}
          {skill.minYears !== null && (
            <span className="text-zinc-500"> · {skill.minYears}+ yrs</span>
          )}
        </Chip>
      ))}
    </div>
  );
}

function RedFlagCard({ flag }: { flag: RedFlag }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        ⚠ {titleCase(flag.category.replaceAll("_", " "))}
      </p>
      <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">{flag.explanation}</p>
      {flag.quote && (
        <p className="mt-1 border-l-2 border-amber-300 pl-2 text-sm italic text-amber-900/70 dark:text-amber-200/70">
          “{flag.quote}”
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-4 flex list-disc flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

type Tone = "zinc" | "blue" | "violet" | "amber" | "green";

const TONE_CLASSES: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function Chip({ children, tone = "zinc" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
