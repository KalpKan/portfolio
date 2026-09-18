import Board from "@/components/Board";
import { loadProjects } from "@/lib/projects";

const REPO_URL = "https://github.com/KalpKan/portfolio";

export default function Home() {
  const projects = loadProjects();
  const printed = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-[72rem] flex-1 px-4 pb-16 pt-10 md:px-8 md:pt-16">
      <header className="border-b border-rule pb-8 md:pb-10">
        <h1 className="display text-[2.75rem] leading-[0.95] md:text-[4.5rem]">
          Kalp Kansara
        </h1>
        <p className="mt-4 max-w-[34ch] text-[1.125rem] leading-snug text-ink md:text-[1.375rem]">
          Projects I&rsquo;ve built &mdash; click any card.
        </p>
        <p className="mt-2 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-2">
          Western University. Working toward physician-scientist work in
          neurotech; this sheet is every project that has actually shipped, plus
          the hardware and iOS work that can only be shown.
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 tabular">
          Channel map · sheet printed {printed} · regenerated from projects.json
        </p>
      </header>

      <div className="pt-8 md:pt-10">
        <Board projects={projects} />
      </div>

      <footer className="mt-16 border-t border-rule pt-6 text-[12px] leading-relaxed text-ink-3 md:mt-20">
        <div className="flex flex-col gap-1 md:flex-row md:justify-between">
          <p>
            Kalp Kansara &middot; one JSON entry per project, no CMS.
          </p>
          <p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink hover:underline"
            >
              source on GitHub
            </a>
            <span aria-hidden> &middot; </span>
            <a href="/api/health" className="hover:text-ink hover:underline">
              /api/health
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
