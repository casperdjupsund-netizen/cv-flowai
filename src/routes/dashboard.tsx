import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { FileText, Mail, Send, UserSquare2, ArrowRight, Lock, Sparkles, Download, Eye, Loader2 } from "lucide-react";
import { useDocumentUsage, DOC_TYPE_LABELS, FREE_LIMIT_PER_TYPE, type DocType } from "@/lib/usage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadDocumentPdf, type DocumentRecord } from "@/lib/pdf";
import { generateDocument } from "@/lib/generate-document.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Hallintapaneeli — CVFlow" }] }),
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const usage = useDocumentUsage();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

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
  }, [user, usage.counts]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleCreate = (type: DocType) => {
    if (!usage.canCreate(type)) {
      toast.error(`Olet käyttänyt ilmaisen ${DOC_TYPE_LABELS[type].toLowerCase()}-versiosi`);
      navigate({ to: "/upgrade" });
      return;
    }
    // Create-flow tulossa
    toast.info("Dokumenttien luonti tulossa pian");
  };

  const isPro = usage.tier === "pro";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-xl border border-border bg-surface p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tervetuloa,</p>
              <h1 className="mt-1 font-display text-3xl font-bold">{user.email}</h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider">
                {isPro ? "Pro" : "Ilmainen kokeilu"}
              </span>
            </div>
          </div>
          {!isPro && (
            <p className="mt-4 text-sm text-muted-foreground">
              Ilmaisella kokeilulla voit luoda yhden version jokaisesta dokumenttityypistä.
              Sen jälkeen siirry Pro-versioon (12,99 € / kk) jatkaaksesi.
            </p>
          )}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Profiili</h2>
          <Link to="/profile" className="mt-4 block">
            <div className="rounded-xl border border-border bg-surface p-6 transition hover:border-primary/50">
              <UserSquare2 className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Profiilini</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Täytä henkilötiedot, työkokemus ja koulutus.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Luo dokumentti</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <DocCard
              icon={FileText}
              type="cv"
              count={usage.counts.cv}
              isPro={isPro}
              onCreate={handleCreate}
            />
            <DocCard
              icon={Mail}
              type="cover_letter"
              count={usage.counts.cover_letter}
              isPro={isPro}
              onCreate={handleCreate}
            />
            <DocCard
              icon={Send}
              type="email"
              count={usage.counts.email}
              isPro={isPro}
              onCreate={handleCreate}
            />
          </div>

          {!isPro && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Tarvitsetko enemmän? Pro antaa rajattoman käytön.
              </span>
              <Link
                to="/upgrade"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                Katso Pro <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold">Dokumenttini</h2>
          {docsLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-xl border border-border bg-surface" />
          ) : docs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-6 text-sm text-muted-foreground">
              Ei vielä luotuja dokumentteja. Aloita yltä valitsemalla dokumenttityyppi.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {docs.map((d) => {
                const label = DOC_TYPE_LABELS[d.type as DocType] ?? d.type;
                return (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        Luotu {new Date(d.created_at).toLocaleDateString("fi-FI")}
                      </p>
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
          )}
        </div>
      </main>
    </div>
  );
}

function DocCard({
  icon: Icon,
  type,
  count,
  isPro,
  onCreate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type: DocType;
  count: number;
  isPro: boolean;
  onCreate: (t: DocType) => void;
}) {
  const used = !isPro && count >= FREE_LIMIT_PER_TYPE;
  return (
    <button
      onClick={() => onCreate(type)}
      className="group text-left rounded-xl border border-border bg-surface p-6 transition hover:border-primary/50 disabled:opacity-100"
    >
      <div className="flex items-start justify-between">
        <Icon className="h-6 w-6 text-primary" />
        {used && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" /> Käytetty
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{DOC_TYPE_LABELS[type]}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isPro
          ? `${count} luotu — rajaton käyttö`
          : `${count} / ${FREE_LIMIT_PER_TYPE} käytetty`}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {used ? "Päivitä Pro" : "Luo uusi"} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
