import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, FileText, Mail, Send, ArrowRight, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateDemoDocument, type DemoResult } from "@/lib/demo-generate.functions";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Kokeile CVFlow’ta — demo ilman rekisteröitymistä" },
      {
        name: "description",
        content:
          "Testaa CVFlow’n tekoälyä esimerkkiprofiililla ja -työilmoituksella. Ei rekisteröitymistä, ei maksua.",
      },
    ],
  }),
});

type DocType = "cv" | "cover_letter" | "email";

const TYPE_META: Record<DocType, { label: string; icon: typeof FileText }> = {
  cv: { label: "CV", icon: FileText },
  cover_letter: { label: "Saatekirje", icon: Mail },
  email: { label: "Sähköposti", icon: Send },
};

const SAMPLE_PROFILE = {
  first_name: "Anna",
  last_name: "Virtanen",
  job_title: "Frontend-kehittäjä",
  email: "anna.virtanen@example.com",
  phone: "+358 40 123 4567",
  location: "Helsinki",
  linkedin: "linkedin.com/in/annavirtanen",
  bio: "Käyttäjäkokemuksesta innostunut frontend-kehittäjä, jolla on 5 vuoden kokemus React-pohjaisista web-sovelluksista. Pidän selkeästä koodista, saavutettavuudesta ja tiimityöstä.",
  skills:
    "React, TypeScript, Next.js, Tailwind CSS, Node.js, PostgreSQL, Figma, saavutettavuus (WCAG), suorituskyvyn optimointi, ketterät menetelmät",
  ai_notes:
    "Korosta käyttäjäkokemusta ja saavutettavuutta. Vältä ylisanoja, käytä konkreettisia esimerkkejä.",
};

const SAMPLE_EXPERIENCE = [
  {
    id: "exp1",
    title: "Senior Frontend Developer",
    company: "Tekno Oy",
    start_date: "2022-03",
    end_date: "nykyhetki",
    description:
      "Vastaan asiakaspuolen verkkosovelluksen kehityksestä (React + TypeScript). Paransin sivun latausaikaa 40 % ja vedin saavutettavuusauditoinnin (WCAG 2.1 AA).",
  },
  {
    id: "exp2",
    title: "Frontend Developer",
    company: "Digitoimisto Liekki",
    start_date: "2020-01",
    end_date: "2022-02",
    description:
      "Toteutin verkkokauppa- ja markkinointisivustoja Next.js:llä. Tein tiivistä yhteistyötä suunnittelijoiden ja taustakehittäjien kanssa.",
  },
  {
    id: "exp3",
    title: "Junior Web Developer",
    company: "StartUp Labs",
    start_date: "2019-05",
    end_date: "2019-12",
    description:
      "Aloittelin React-kehittäjänä startup-tiimissä. Opin ketterän kehityksen ja koodikatselmointien merkityksen.",
  },
];

const SAMPLE_EDUCATION = [
  {
    id: "edu1",
    school: "Aalto-yliopisto",
    degree: "DI",
    major: "Tietotekniikka",
    year: "2019",
  },
  {
    id: "edu2",
    school: "Helsingin yliopisto",
    degree: "Avoin yo",
    major: "Käytettävyys ja UX",
    year: "2021",
  },
];

const SAMPLE_JOB_POSTING = `Etsimme kokenutta Frontend-kehittäjää kasvavaan SaaS-tiimiimme Helsinkiin (hybridi).

Toivomme:
- Vahvaa osaamista Reactista ja TypeScriptistä (3+ vuotta)
- Kokemusta saavutettavuudesta (WCAG)
- Kykyä optimoida suorituskykyä ja Web Vitals -mittareita
- Tiimityötaitoja ja halua mentoroida juniorikehittäjiä

Tarjoamme:
- Modernin tech-stackin (Next.js, Tailwind, Vercel)
- Joustavat työajat ja etätyömahdollisuuden
- Kilpailukykyisen palkan ja optio-ohjelman

Hae 30.6. mennessä!`;

function DemoPage() {
  const [activeType, setActiveType] = useState<DocType>("cv");
  const [jobPosting, setJobPosting] = useState(SAMPLE_JOB_POSTING);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const generateFn = useServerFn(generateDemoDocument);

  const handleGenerate = async () => {
    if (jobPosting.trim().length < 10) {
      toast.error("Liitä työpaikkailmoituksen teksti.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateFn({
        data: {
          type: activeType,
          job_posting: jobPosting.trim(),
          profile: SAMPLE_PROFILE,
          experience: SAMPLE_EXPERIENCE,
          education: SAMPLE_EDUCATION,
        },
      });
      setResult(res);
      if (!res.ok) toast.error(res.error);
      else toast.success("Demo valmis!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generointi epäonnistui";
      toast.error(msg);
      setResult({ ok: false, error: msg });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Demo
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Kokeile CVFlow’ta heti
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Käytämme valmista esimerkkiprofiilia ja työilmoitusta. Vaihda tekstit halutessasi
            ja näe, miten tekoäly räätälöi dokumentin sekunneissa — ilman rekisteröitymistä.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Vasen: input */}
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-semibold">1. Esimerkkiprofiili</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Valmis esimerkki: Anna Virtanen, frontend-kehittäjä.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Nimi" value={`${SAMPLE_PROFILE.first_name} ${SAMPLE_PROFILE.last_name}`} />
                <Row label="Ammatti" value={SAMPLE_PROFILE.job_title!} />
                <Row label="Sijainti" value={SAMPLE_PROFILE.location!} />
                <details className="group rounded-lg border border-border/60 bg-background/40 p-3">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Näytä koko profiili
                  </summary>
                  <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Esittely:</strong> {SAMPLE_PROFILE.bio}</p>
                    <p><strong className="text-foreground">Taidot:</strong> {SAMPLE_PROFILE.skills}</p>
                    <div>
                      <strong className="text-foreground">Työkokemus:</strong>
                      <ul className="mt-1 space-y-1">
                        {SAMPLE_EXPERIENCE.map((e) => (
                          <li key={e.id}>
                            • {e.title} @ {e.company} ({e.start_date} – {e.end_date})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-foreground">Koulutus:</strong>
                      <ul className="mt-1 space-y-1">
                        {SAMPLE_EDUCATION.map((e) => (
                          <li key={e.id}>
                            • {e.degree} {e.major}, {e.school} ({e.year})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-semibold">2. Työpaikkailmoitus</h2>
              <p className="mt-1 text-sm text-muted-foreground">Muokkaa vapaasti tai kokeile omalla.</p>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setJobPosting(SAMPLE_JOB_POSTING)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Palauta esimerkki
                </button>
              </div>
              <Textarea
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                rows={10}
                className="mt-2"
                disabled={generating}
              />
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-semibold">3. Valitse dokumentti</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(Object.keys(TYPE_META) as DocType[]).map((t) => {
                  const meta = TYPE_META[t];
                  const Icon = meta.icon;
                  const active = activeType === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveType(t)}
                      disabled={generating}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="mt-5 w-full" size="lg">
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generoidaan…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Luo {TYPE_META[activeType].label.toLowerCase()} tekoälyllä</>
                )}
              </Button>
            </div>
          </section>

          {/* Oikea: tulos */}
          <section>
            <div className="sticky top-24 rounded-xl border border-border bg-surface p-6 min-h-[400px]">
              <h2 className="font-display text-lg font-semibold">Tulos</h2>
              {!result && !generating && (
                <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="h-10 w-10 text-primary/40" />
                  <p className="mt-4 text-sm">
                    Klikkaa “Luo tekoälyllä” — tulos ilmestyy tähän muutamassa sekunnissa.
                  </p>
                </div>
              )}
              {generating && (
                <div className="mt-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Tekoäly räätälöi sisältöä työilmoituksen mukaan…
                  </p>
                </div>
              )}
              {result && !result.ok && (
                <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  {result.error}
                </p>
              )}
              {result && result.ok && <ResultView result={result} />}

              {result && result.ok && (
                <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-semibold">Pidätkö tuloksesta?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rekisteröidy ilmaiseksi ja luo dokumentteja omalla profiilillasi —
                    voit myös ladata ne PDF:nä.
                  </p>
                  <Link
                    to="/signup"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Luo ilmainen tili <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ResultView({ result }: { result: Extract<DemoResult, { ok: true }> }) {
  if (result.type === "cv") {
    return (
      <div className="mt-4 space-y-5">
        {result.content.sections.map((s, i) => (
          <div key={i}>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {s.heading}
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    );
  }
  if (result.type === "cover_letter") {
    return (
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
        {result.content.body}
      </p>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aihe</p>
        <p className="mt-1 text-sm font-semibold">{result.content.subject}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Viesti</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{result.content.body}</p>
      </div>
    </div>
  );
}
