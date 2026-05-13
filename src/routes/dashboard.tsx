import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import React from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { FileText, Mail, Send, UserSquare2, ArrowRight, Lock, Download, Eye, Loader2 } from "lucide-react";
import { useDocumentUsage, DOC_TYPE_LABELS, FREE_MONTHLY_LIMIT, type DocType } from "@/lib/usage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadDocumentPdf, type DocumentRecord } from "@/lib/pdf";
import { createDocumentManually } from "@/lib/create-document-manual.functions";
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

  const [creating, setCreating] = useState<DocType | null>(null);
  const createFn = useServerFn(createDocumentManually);

  const handleCreate = async (type: DocType) => {
    if (!usage.canCreate(type)) {
      toast.error("Kuukausiraja täynnä. Päivitä Pro-tiliin.");
      navigate({ to: "/upgrade" });
      return;
    }
    setCreating(type);
    try {
      const res = await createFn({ data: { type } });
      if (!res.ok) {
        toast.error(res.error);
        if ("upgrade" in res && res.upgrade) navigate({ to: "/upgrade" });
        return;
      }
      await usage.refresh();
      navigate({ to: "/documents/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Luonti epäonnistui");
    } finally {
      setCreating(null);
    }
  };

  const isPro = usage.tier === "pro";

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
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
              Ilmaisella tilillä voit luoda {FREE_MONTHLY_LIMIT} dokumenttia kuukaudessa
              ({usage.monthlyTotal} / {FREE_MONTHLY_LIMIT} käytetty).
              Pro: 14,99 €/kk tai 99 €/v — rajaton käyttö.
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
              monthlyTotal={usage.monthlyTotal}
              creating={creating}
              onCreate={handleCreate}
            />
            <DocCard
              icon={Mail}
              type="cover_letter"
              count={usage.counts.cover_letter}
              isPro={isPro}
              monthlyTotal={usage.monthlyTotal}
              creating={creating}
              onCreate={handleCreate}
            />
            <DocCard
              icon={Send}
              type="email"
              count={usage.counts.email}
              isPro={isPro}
              monthlyTotal={usage.monthlyTotal}
              creating={creating}
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Viimeisimmät dokumentit</h2>
            {docs.length > 0 && (
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Koko historia <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {docsLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-xl border border-border bg-surface" />
          ) : docs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-6 text-sm text-muted-foreground">
              Ei vielä luotuja dokumentteja. Aloita yltä valitsemalla dokumenttityyppi.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {docs.slice(0, 5).map((d) => {
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
  monthlyTotal,
  creating,
  onCreate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type: DocType;
  count: number;
  isPro: boolean;
  monthlyTotal: number;
  creating: DocType | null;
  onCreate: (t: DocType) => void;
}) {
  const used = !isPro && monthlyTotal >= FREE_MONTHLY_LIMIT;
  const isCreating = creating === type;
  return (
    <button
      onClick={() => onCreate(type)}
      disabled={isCreating || (creating !== null)}
      className="group text-left rounded-xl border border-border bg-surface p-6 transition hover:border-primary/50 disabled:opacity-60"
    >
      <div className="flex items-start justify-between">
        <Icon className="h-6 w-6 text-primary" />
        {used && !isCreating && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" /> Kuukausiraja täynnä
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{DOC_TYPE_LABELS[type]}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isPro ? `${count} luotu — rajaton käyttö` : `${count} luotu tässä kuussa`}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {isCreating ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Luodaan...</>
        ) : used ? (
          <>Päivitä Pro <ArrowRight className="h-3.5 w-3.5" /></>
        ) : (
          <>Luo uusi <ArrowRight className="h-3.5 w-3.5" /></>
        )}
      </span>
    </button>
  );
}
