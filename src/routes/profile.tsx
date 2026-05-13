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
import { Check, Loader2, ArrowLeft, Plus, Trash2, Briefcase, GraduationCap } from "lucide-react";

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
  ai_notes: string;
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
  ai_notes: "",
};

type ExperienceRow = {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
};

type EducationRow = {
  id: string;
  school: string;
  degree: string;
  major: string;
  year: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  // Load profile + experience + education
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: profile, error }, { data: exps }, { data: edus }] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name,last_name,job_title,email,phone,location,linkedin,bio,skills,ai_notes")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("experience")
          .select("id,title,company,start_date,end_date,description")
          .eq("profile_id", user.id)
          .order("order_index", { ascending: true }),
        supabase
          .from("education")
          .select("id,school,degree,major,year")
          .eq("profile_id", user.id)
          .order("order_index", { ascending: true }),
      ]);
      if (cancelled) return;
      if (error) {
        toast.error("Profiilin lataus epäonnistui");
      } else if (profile) {
        setForm({
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          job_title: profile.job_title ?? "",
          email: profile.email ?? user.email ?? "",
          phone: profile.phone ?? "",
          location: profile.location ?? "",
          linkedin: profile.linkedin ?? "",
          bio: profile.bio ?? "",
          skills: profile.skills ?? "",
        });
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
      setExperience(
        (exps ?? []).map((e) => ({
          id: e.id,
          title: e.title ?? "",
          company: e.company ?? "",
          start_date: e.start_date ?? "",
          end_date: e.end_date ?? "",
          description: e.description ?? "",
        })),
      );
      setEducation(
        (edus ?? []).map((e) => ({
          id: e.id,
          school: e.school ?? "",
          degree: e.degree ?? "",
          major: e.major ?? "",
          year: e.year ?? "",
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveProfile = useCallback(
    async (data: ProfileForm) => {
      if (!user) return;
      setStatus("saving");
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, ...data, updated_at: new Date().toISOString() },
          { onConflict: "id" },
        );
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
      timerRef.current = setTimeout(() => saveProfile(next), 1200);
      return next;
    });
  };

  // ----- Experience -----
  const addExperience = async () => {
    if (!user) return;
    const order_index = experience.length;
    const { data, error } = await supabase
      .from("experience")
      .insert({ profile_id: user.id, order_index })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Lisäys epäonnistui");
      return;
    }
    setExperience((prev) => [
      ...prev,
      { id: data.id, title: "", company: "", start_date: "", end_date: "", description: "" },
    ]);
  };

  const updateExperience = (id: string, patch: Partial<ExperienceRow>) => {
    setExperience((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const { error } = await supabase.from("experience").update(patch).eq("id", id);
      if (error) {
        setStatus("error");
        toast.error("Tallennus epäonnistui");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      }
    }, 800);
  };

  const removeExperience = async (id: string) => {
    const { error } = await supabase.from("experience").delete().eq("id", id);
    if (error) {
      toast.error("Poisto epäonnistui");
      return;
    }
    setExperience((prev) => prev.filter((e) => e.id !== id));
  };

  // ----- Education -----
  const addEducation = async () => {
    if (!user) return;
    const order_index = education.length;
    const { data, error } = await supabase
      .from("education")
      .insert({ profile_id: user.id, order_index })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Lisäys epäonnistui");
      return;
    }
    setEducation((prev) => [
      ...prev,
      { id: data.id, school: "", degree: "", major: "", year: "" },
    ]);
  };

  const updateEducation = (id: string, patch: Partial<EducationRow>) => {
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const { error } = await supabase.from("education").update(patch).eq("id", id);
      if (error) {
        setStatus("error");
        toast.error("Tallennus epäonnistui");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      }
    }, 800);
  };

  const removeEducation = async (id: string) => {
    const { error } = await supabase.from("education").delete().eq("id", id);
    if (error) {
      toast.error("Poisto epäonnistui");
      return;
    }
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  const handleManualSave = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await saveProfile(form);
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

        {/* Perustiedot */}
        <div className="mt-8 space-y-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Perustiedot</h2>
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
        </div>

        {/* Työkokemus */}
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Briefcase className="h-4 w-4 text-primary" /> Työkokemus
            </h2>
            <Button variant="outline" size="sm" onClick={addExperience}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Lisää
            </Button>
          </div>
          {experience.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ei vielä lisättyä työkokemusta.</p>
          ) : (
            experience.map((e) => (
              <div key={e.id} className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <Field label="Tehtävä" value={e.title} onChange={(v) => updateExperience(e.id, { title: v })} />
                    <Field label="Yritys" value={e.company} onChange={(v) => updateExperience(e.id, { company: v })} />
                  </div>
                  <button
                    onClick={() => removeExperience(e.id)}
                    className="mt-7 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Poista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Alkoi" value={e.start_date} onChange={(v) => updateExperience(e.id, { start_date: v })} placeholder="2022" />
                  <Field label="Päättyi" value={e.end_date} onChange={(v) => updateExperience(e.id, { end_date: v })} placeholder="Nykyinen" />
                </div>
                <TextField
                  label="Kuvaus"
                  value={e.description}
                  onChange={(v) => updateExperience(e.id, { description: v })}
                  placeholder="Tehtävät ja saavutukset"
                  rows={3}
                />
              </div>
            ))
          )}
        </div>

        {/* Koulutus */}
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <GraduationCap className="h-4 w-4 text-primary" /> Koulutus
            </h2>
            <Button variant="outline" size="sm" onClick={addEducation}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Lisää
            </Button>
          </div>
          {education.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ei vielä lisättyä koulutusta.</p>
          ) : (
            education.map((e) => (
              <div key={e.id} className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <Field label="Oppilaitos" value={e.school} onChange={(v) => updateEducation(e.id, { school: v })} />
                    <Field label="Tutkinto" value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v })} />
                  </div>
                  <button
                    onClick={() => removeEducation(e.id)}
                    className="mt-7 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Poista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Pääaine" value={e.major} onChange={(v) => updateEducation(e.id, { major: v })} placeholder="esim. Tietotekniikka" />
                  <Field label="Vuosi" value={e.year} onChange={(v) => updateEducation(e.id, { year: v })} placeholder="2024" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Taidot */}
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Taidot</h2>
          <TextField
            label="Listaa taitosi pilkulla erotettuna"
            value={form.skills}
            onChange={(v) => update("skills", v)}
            placeholder="React, TypeScript, Tiimityö, Asiakaspalvelu..."
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
