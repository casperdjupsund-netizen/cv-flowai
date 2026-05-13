import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, X, ArrowRight, FileText, Mail, Send } from "lucide-react";
import { useGenerationTracker, type GenJob } from "@/lib/generation-tracker";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/usage";
import { useEffect, useState } from "react";

const TYPE_ICONS: Record<DocType, React.ComponentType<{ className?: string }>> = {
  cv: FileText,
  cover_letter: Mail,
  email: Send,
};

function elapsed(startedAt: number) {
  const s = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function PendingGenerations() {
  const { jobs, dismiss } = useGenerationTracker();
  // Tick once per second so elapsed time updates while running.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!jobs.some((j) => j.status === "running")) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [jobs]);

  if (jobs.length === 0) return null;

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <PendingRow key={job.id} job={job} onDismiss={() => dismiss(job.id)} />
      ))}
    </ul>
  );
}

function PendingRow({ job, onDismiss }: { job: GenJob; onDismiss: () => void }) {
  const Icon = TYPE_ICONS[job.type] ?? FileText;
  const label = DOC_TYPE_LABELS[job.type];

  const stateMeta = (() => {
    if (job.status === "running") {
      return {
        ringClass: "border-primary/40 bg-primary/5",
        badge: (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> Generoidaan
          </span>
        ),
        meta: `${elapsed(job.startedAt)} kulunut`,
      };
    }
    if (job.status === "done") {
      return {
        ringClass: "border-emerald-500/40 bg-emerald-500/5",
        badge: (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Valmis
          </span>
        ),
        meta:
          job.finishedAt && job.startedAt
            ? `Valmistui ${Math.max(1, Math.round((job.finishedAt - job.startedAt) / 1000))}s:ssa`
            : null,
      };
    }
    return {
      ringClass: "border-destructive/40 bg-destructive/5",
      badge: (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
          <AlertCircle className="h-3 w-3" /> Virhe
        </span>
      ),
      meta: job.error,
    };
  })();

  return (
    <li className={`relative flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 ${stateMeta.ringClass}`}>
      {job.status === "running" && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl bg-primary/15">
          <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="rounded-lg bg-background p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold">{label}</p>
            {stateMeta.badge}
          </div>
          {stateMeta.meta && (
            <p className="mt-1 text-xs text-muted-foreground">{stateMeta.meta}</p>
          )}
          {job.jobPosting && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/70">
              {job.jobPosting.slice(0, 120)}
              {job.jobPosting.length > 120 ? "…" : ""}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {job.status === "done" && job.documentId && (
          <Link
            to="/documents/$id"
            params={{ id: job.documentId }}
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Avaa preview <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {job.status !== "running" && (
          <button
            onClick={onDismiss}
            aria-label="Sulje"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}
