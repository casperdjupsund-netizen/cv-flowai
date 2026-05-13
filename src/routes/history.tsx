import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { downloadDocumentPdf, type DocumentRecord } from "@/lib/pdf";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/usage";
import { ArrowLeft, Download, Eye, FileText, Mail, Send, Search } from "lucide-react";
import { PendingGenerations } from "@/components/PendingGenerations";
import { useOnGenerationDone } from "@/lib/generation-tracker";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "Historia — CVFlow" }] }),
});

const TYPE_ICONS: Record<DocType, React.ComponentType<{ className?: string }>> = {
  cv: FileText,
  cover_letter: Mail,
  email: Send,
};

type Filter = "all" | DocType;

function HistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setDocsLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id, type, created_at, job_posting, content")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setDocs((data ?? []) as DocumentRecord[]);
        setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Refresh list when a tracked generation finishes (covers cases where the
  // doc was started elsewhere or while user is viewing /history).
  useOnGenerationDone(async (job) => {
    if (job.status !== "done" || !user) return;
    const { data } = await supabase
      .from("documents")
      .select("id, type, created_at, job_posting, content")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as DocumentRecord[]);
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (filter !== "all" && d.type !== filter) return false;
      if (!q) return true;
      return (d.job_posting ?? "").toLowerCase().includes(q);
    });
  }, [docs, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocumentRecord[]>();
    for (const d of filtered) {
      const date = new Date(d.created_at);
      const key = date.toLocaleDateString("fi-FI", { year: "numeric", month: "long" });
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const counts = {
    all: docs.length,
    cv: docs.filter((d) => d.type === "cv").length,
    cover_letter: docs.filter((d) => d.type === "cover_letter").length,
    email: docs.filter((d) => d.type === "email").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Takaisin
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">Dokumenttihistoria</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kaikki aiemmin generoidut dokumenttisi. Esikatsele tai lataa PDF uudelleen.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {(["all", "cv", "cover_letter", "email"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface hover:border-primary/50"
              }`}
            >
              {f === "all" ? "Kaikki" : DOC_TYPE_LABELS[f]} ({counts[f]})
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae ilmoituksesta..."
              className="w-64 rounded-md border border-border bg-surface py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-6">
          <PendingGenerations />
        </div>

        <div className="mt-8 space-y-8">
          {docsLoading ? (
            <div className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
          ) : grouped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted-foreground">
              {docs.length === 0
                ? "Et ole vielä luonut yhtään dokumenttia."
                : "Ei tuloksia tällä suodattimella."}
            </p>
          ) : (
            grouped.map(([month, items]) => (
              <section key={month}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {month}
                </h2>
                <ul className="space-y-3">
                  {items.map((d) => {
                    const type = d.type as DocType;
                    const Icon = TYPE_ICONS[type] ?? FileText;
                    const label = DOC_TYPE_LABELS[type] ?? d.type;
                    const snippet = d.job_posting?.trim().slice(0, 140) ?? "";
                    return (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="rounded-lg bg-background p-2">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-display text-base font-semibold">{label}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(d.created_at).toLocaleString("fi-FI", {
                                  day: "numeric",
                                  month: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {snippet && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {snippet}
                                {(d.job_posting?.length ?? 0) > 140 ? "…" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/documents/$id"
                            params={{ id: d.id }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-elevated"
                          >
                            <Eye className="h-3.5 w-3.5" /> Esikatsele
                          </Link>
                          <button
                            onClick={() => downloadDocumentPdf(d)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
