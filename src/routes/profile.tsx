import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profiili — CVFlow" }] }),
});

type ProfileForm = {
  first_name: string;
  last_name: string;
  job_title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  bio: string;
  skills: string;
};

const EMPTY: ProfileForm = {
  first_name: "",
  last_name: "",
  job_title: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  bio: "",
  skills: "",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name,job_title,email,phone,location,linkedin,bio,skills")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Profiilin lataus epäonnistui");
      } else if (data) {
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          job_title: data.job_title ?? "",
          email: data.email ?? user.email ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          linkedin: data.linkedin ?? "",
          bio: data.bio ?? "",
          skills: data.skills ?? "",
        });
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = useCallback(
    async (data: ProfileForm) => {
      if (!user) return;
      setStatus("saving");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...data, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) {
        setStatus("error");
        toast.error("Tallennus epäonnistui: " + error.message);
      } else {
        dirtyRef.current = false;
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      }
    },
    [user],
  );

  const update = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      dirtyRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(next), 1200);
      return next;
    });
  };

  const handleManualSave = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await save(form);
    if (status !== "error") toast.success("Profiili tallennettu");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Profiili</h1>
            <p className="mt-2 text-muted-foreground">
              Täytä tiedot kerran — tekoäly käyttää näitä CV:n ja saatekirjeen luomiseen.
            </p>
          </div>
          <SaveIndicator status={status} />
        </div>

        <div className="mt-8 space-y-6 rounded-xl border border-border bg-surface p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Etunimi" value={form.first_name} onChange={(v) => update("first_name", v)} />
            <Field label="Sukunimi" value={form.last_name} onChange={(v) => update("last_name", v)} />
          </div>
          <Field label="Ammattinimike" value={form.job_title} onChange={(v) => update("job_title", v)} placeholder="esim. Frontend-kehittäjä" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sähköposti" type="email" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Puhelin" value={form.phone} onChange={(v) => update("phone", v)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sijainti" value={form.location} onChange={(v) => update("location", v)} placeholder="Helsinki" />
            <Field label="LinkedIn" value={form.linkedin} onChange={(v) => update("linkedin", v)} placeholder="linkedin.com/in/..." />
          </div>
          <TextField
            label="Esittely"
            value={form.bio}
            onChange={(v) => update("bio", v)}
            placeholder="Lyhyt kuvaus itsestäsi ja osaamisestasi"
            rows={4}
          />
          <TextField
            label="Taidot"
            value={form.skills}
            onChange={(v) => update("skills", v)}
            placeholder="React, TypeScript, Tiimityö..."
            rows={3}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground">Muutokset tallentuvat automaattisesti</span>
          <Button onClick={handleManualSave} disabled={status === "saving"}>
            {status === "saving" ? "Tallennetaan..." : "Tallenna"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tallennetaan...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-primary">
        <Check className="h-3.5 w-3.5" /> Tallennettu
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-destructive">Virhe tallennuksessa</span>;
  }
  return null;
}
