import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/usage";
import { documentToSections, downloadDocumentPdf, type DocumentRecord } from "@/lib/pdf";

export const Route = createFileRoute("/documents/$id")({
  component: DocumentPage,
  head: () => ({ meta: [{ title: "Dokumentti — CVFlow" }] }),
});

function DocumentPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id, type, created_at, job_posting, content")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Dokumentin lataus epäonnistui");
        setLoading(false);
        return;
      }
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setDoc(data as DocumentRecord);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Dokumenttia ei löytynyt</h1>
          <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Palaa hallintapaneeliin
          </Link>
        </main>
      </div>
    );
  }

  const typeLabel = DOC_TYPE_LABELS[doc.type as DocType] ?? doc.type;
  const sections = documentToSections(doc);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">{typeLabel}</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{typeLabel}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Luotu {new Date(doc.created_at).toLocaleDateString("fi-FI")}
            </p>
          </div>
          <Button onClick={() => downloadDocumentPdf(doc)} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Lataa PDF
          </Button>
        </div>

        {doc.job_posting && (
          <div className="mt-8 rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Työpaikkailmoitus
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {doc.job_posting}
            </p>
          </div>
        )}

        <article className="mt-8 rounded-xl border border-border bg-surface p-8 shadow-sm">
          {sections.map((s, i) => (
            <section key={i} className={i > 0 ? "mt-6" : ""}>
              {s.heading && (
                <h2 className="font-display text-lg font-semibold">{s.heading}</h2>
              )}
              <div
                className={`whitespace-pre-wrap text-[15px] leading-relaxed text-foreground ${
                  s.heading ? "mt-2" : ""
                }`}
              >
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
