import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/usage";
import { documentToSections, downloadDocumentPdf, type DocumentRecord } from "@/lib/pdf";

export const Route = createFileRoute("/documents/$id")({
  component: DocumentPage,
  head: () => ({ meta: [{ title: "Dokumentti — CVFlow" }] }),
});

type Section = { heading: string; body: string };

const MAX_HEADING = 120;
const MAX_BODY = 8000;

function contentToSections(doc: DocumentRecord): Section[] {
  return documentToSections(doc).map((s) => ({
    heading: s.heading ?? "",
    body: s.body ?? "",
  }));
}

function sectionsToContent(doc: DocumentRecord, sections: Section[]): unknown {
  if (doc.type === "cv") {
    return {
      sections: sections.map((s) => ({
        heading: s.heading.trim(),
        body: s.body,
      })),
    };
  }
  // cover_letter / email: subject + body
  const subject =
    sections.find((s) => s.heading.trim().toLowerCase() === "aihe")?.body ?? "";
  const body = sections
    .filter((s) => s.heading.trim().toLowerCase() !== "aihe")
    .map((s) => (s.heading.trim() ? `${s.heading.trim()}\n\n${s.body}` : s.body))
    .join("\n\n");
  return subject ? { subject, body } : { body };
}

function DocumentPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

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

  const liveSections = useMemo(
    () => (doc ? contentToSections(doc) : []),
    [doc],
  );

  const startEdit = () => {
    setDraft(liveSections.map((s) => ({ ...s })));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft([]);
  };

  const updateSection = (i: number, patch: Partial<Section>) => {
    setDraft((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    setDraft((prev) => [...prev, { heading: "Uusi osio", body: "" }]);
  };

  const removeSection = (i: number) => {
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    if (!doc) return;
    // Validation
    for (const s of draft) {
      if (s.heading.length > MAX_HEADING) {
        toast.error(`Otsikko on liian pitkä (max ${MAX_HEADING} merkkiä)`);
        return;
      }
      if (s.body.length > MAX_BODY) {
        toast.error(`Osion teksti on liian pitkä (max ${MAX_BODY} merkkiä)`);
        return;
      }
    }
    if (draft.length === 0) {
      toast.error("Dokumentissa pitää olla vähintään yksi osio");
      return;
    }

    setSaving(true);
    const newContent = sectionsToContent(doc, draft);
    const { error } = await supabase
      .from("documents")
      .update({ content: newContent })
      .eq("id", doc.id);
    setSaving(false);
    if (error) {
      toast.error("Tallennus epäonnistui");
      return;
    }
    setDoc({ ...doc, content: newContent });
    setEditing(false);
    toast.success("Muutokset tallennettu");
  };

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
  const sections = editing ? draft : liveSections;

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
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X className="mr-2 h-4 w-4" /> Peruuta
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Tallenna
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Muokkaa
                </Button>
                <Button onClick={() => downloadDocumentPdf(doc)} size="lg">
                  <Download className="mr-2 h-4 w-4" /> Lataa PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {doc.job_posting && !editing && (
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
          {editing ? (
            <div className="space-y-6">
              {sections.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Osio {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(i, -1)}
                        disabled={i === 0}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title="Siirrä ylös"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(i, 1)}
                        disabled={i === sections.length - 1}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title="Siirrä alas"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeSection(i)}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        title="Poista osio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={s.heading}
                    onChange={(e) => updateSection(i, { heading: e.target.value })}
                    placeholder="Otsikko (esim. Työkokemus)"
                    maxLength={MAX_HEADING}
                    className="font-display font-semibold"
                  />
                  <Textarea
                    value={s.body}
                    onChange={(e) => updateSection(i, { body: e.target.value })}
                    placeholder="Osion sisältö..."
                    maxLength={MAX_BODY}
                    rows={Math.min(16, Math.max(4, s.body.split("\n").length + 1))}
                    className="mt-2 font-mono text-[13px] leading-relaxed"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    {s.body.length} / {MAX_BODY}
                  </p>
                </div>
              ))}
              <button
                onClick={addSection}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Lisää osio
              </button>
            </div>
          ) : (
            sections.map((s, i) => (
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
            ))
          )}
        </article>
      </main>
    </div>
  );
}
