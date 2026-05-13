import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Sparkles, FileText, Mail, Send, ArrowRight, Star, Check,
  UserSquare2, ClipboardList, Pencil, HelpCircle,
  Crown, Infinity as InfinityIcon, Zap, Palette, Download, ShieldCheck, X
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "CVFlow — Tee täydellinen CV minuuteissa" },
      { name: "description", content: "Tekoälypohjainen suomalainen työnhaun työkalu. Täytä profiilisi kerran, liitä työilmoitus, lataa räätälöity CV PDF:nä." },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Stats />
      <HowItWorks />
      <DocTypes />
      <SuccessStories />
      <Testimonials />
      <ProPricing />
      <FAQ />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden grain-bg">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Tekoälypohjainen työnhaun työkalu</span>
        </div>
        <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-balance sm:text-7xl">
          Tee täydellinen CV<br />
          <span className="text-primary">minuuteissa</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
          Täytä profiilisi kerran. Liitä työilmoitus. Tekoäly kirjoittaa — sinä viimeistelet ja lataat.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:shadow-glow"
          >
            Aloita ilmaiseksi
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="rounded-sm border border-border bg-surface px-6 py-3 text-sm font-medium hover:bg-surface-elevated"
          >
            Miten toimii?
          </a>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { value: "2 400+", label: "tehtyä dokumenttia" },
    { value: "4.9/5", label: "käyttäjäarvosana" },
    { value: "78 %", label: "sai kutsun haastatteluun" },
    { value: "<2 min", label: "valmis CV" },
  ];
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl font-bold text-primary">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: UserSquare2, iconName: "UserSquare2", title: "1. Täytä profiili kerran", desc: "Henkilötiedot, työkokemus, koulutus ja taidot tallennetaan turvallisesti." },
    { icon: ClipboardList, iconName: "ClipboardList", title: "2. Liitä työilmoitus", desc: "Tekoäly analysoi tehtävän vaatimukset ja räätälöi sisällön." },
    { icon: Pencil, iconName: "Pencil", title: "3. Muokkaa ja lataa", desc: "Hienosäädä visuaalisessa editorissa ja lataa PDF:nä." },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">Näin se toimii</h2>
          <p className="mt-3 text-muted-foreground">Kolme askelta valmiiseen hakemukseen.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="group rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocTypes() {
  const docs = [
    { icon: FileText, title: "CV", desc: "Räätälöity ansioluettelo eri tyyleillä.", badge: "Suosituin" },
    { icon: Mail, title: "Saatekirje", desc: "Henkilökohtainen saatekirje, joka erottuu." },
    { icon: Send, title: "Sähköposti rekrytoijalle", desc: "Lyhyt, ytimekäs yhteydenotto." },
  ];
  return (
    <section className="border-t border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">Kolme dokumenttia, yksi profiili</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {docs.map((d) => (
            <div key={d.title} className="relative rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary/50">
              {d.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {d.badge}
                </span>
              )}
              <d.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-5 font-display text-xl font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuccessStories() {
  const stories = [
    { metric: "11 pv", name: "Mikaela K.", city: "Helsinki", quote: "Sain unelmieni työpaikan 11 päivässä CVFlow:lla." },
    { metric: "3×", name: "Tomas L.", city: "Tampere", quote: "Haastattelukutsujen määrä kolminkertaistui." },
    { metric: "90 s", name: "Anni R.", city: "Oulu", quote: "90 sekuntia työilmoituksesta valmiiseen CV:hen." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-display text-4xl font-bold tracking-tight">Onnistumistarinoita</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-surface p-6">
              <div className="font-display text-4xl font-bold text-primary">{s.metric}</div>
              <p className="mt-4 text-sm text-foreground">"{s.quote}"</p>
              <p className="mt-4 text-xs text-muted-foreground">— {s.name}, {s.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Sanna M.", role: "Markkinointikoordinaattori", quote: "Helpompaa kuin koskaan. CV näyttää ammattimaiselta heti." },
    { name: "Juhani T.", role: "IT-konsultti", quote: "Räätälöinti tehtävän mukaan toimii uskomattoman hyvin." },
    { name: "Laura H.", role: "Sairaanhoitaja", quote: "Sain 3 haastattelua viikossa. Suosittelen lämpimästi." },
  ];
  return (
    <section className="border-t border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-display text-4xl font-bold tracking-tight">Käyttäjien kokemuksia</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm">"{t.quote}"</p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Miten ilmainen kokeilu toimii?",
      a: "Saat tehdä yhden version jokaisesta dokumenttityypistä — yhden CV:n, yhden saatekirjeen ja yhden rekrytointisähköpostin — täysin ilmaiseksi ja ilman luottokorttia.",
    },
    {
      q: "Mitä ilmaiskokeilun jälkeen tapahtuu?",
      a: "Kun olet käyttänyt ilmaiset versiot, sinun täytyy päivittää maksulliseen suunnitelmaan jatkaaksesi uusien dokumenttien luomista.",
    },
    {
      q: "Milloin veloitus alkaa?",
      a: "Veloitus alkaa vasta kun ilmaiskokeilusi on täyttynyt ja päätät vaihtaa maksulliseen versioon. Ennen sitä mitään ei veloiteta.",
    },
    {
      q: "Mitä maksullinen versio sisältää?",
      a: "Maksullinen versio maksaa 14,99 € / kk ja sisältää rajattoman määrän CV:itä, saatekirjeitä ja rekrytointisähköposteja.",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">Usein kysytyt kysymykset</h2>
          <p className="mt-3 text-muted-foreground">Vastauksia yleisimpiin kysymyksiin.</p>
        </div>
        <div className="mt-12 space-y-8">
          {items.map((item) => (
            <div key={item.q} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-display text-lg font-semibold">{item.q}</h3>
                  <p className="mt-2 text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProPricing() {
  const proFeatures = [
    { icon: InfinityIcon, title: "Rajaton määrä dokumentteja", desc: "Hae niin moneen paikkaan kuin haluat — ei kuukausirajaa." },
    { icon: Zap, title: "Parhaat AI-mallit", desc: "Käytössäsi tarkimmat ja luovimmat tekoälymallit räätälöintiin." },
    { icon: Palette, title: "Premium-CV-pohjat", desc: "Pääset käsiksi kaikkiin tyylikkäisiin CV-tyyleihin ja väriteemoihin." },
    { icon: Download, title: "Korkealaatuinen PDF", desc: "Lataa ammattimaiset PDF:t ilman vesileimaa." },
    { icon: ShieldCheck, title: "Prioriteettituki", desc: "Saat vastauksen tukipyyntöihin alle 24 tunnissa." },
    { icon: Sparkles, title: "Uudet ominaisuudet ensin", desc: "Pääset kokeilemaan uusia työkaluja ennen muita." },
  ];
  const compare = [
    { feature: "Ilmaiset kokeilukerrat", free: "1 / dokumenttityyppi", pro: "Rajaton" },
    { feature: "AI-räätälöinti työilmoituksen mukaan", free: true, pro: true },
    { feature: "Premium-CV-pohjat", free: false, pro: true },
    { feature: "PDF ilman vesileimaa", free: false, pro: true },
    { feature: "Prioriteettituki", free: false, pro: true },
  ];
  return (
    <section className="relative overflow-hidden border-t border-border/60 py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Crown className="h-3.5 w-3.5" />
            CVFLOW PRO
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Saa työ, jota oikeasti haluat
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Pro-käyttäjät saavat <span className="font-semibold text-foreground">3× enemmän haastattelukutsuja</span> — koska he voivat räätälöidä jokaisen hakemuksen kohdilleen ilman rajaa.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {proFeatures.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6 transition hover:border-primary/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/50 p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ilmainen</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold">0 €</span>
              <span className="text-sm text-muted-foreground">/ ikuisesti</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Kokeile ilman luottokorttia.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> 1 CV, 1 saatekirje, 1 sähköposti</li>
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> AI-räätälöinti</li>
              <li className="flex gap-2 text-muted-foreground"><X className="h-5 w-5 shrink-0" /> Ei premium-pohjia</li>
              <li className="flex gap-2 text-muted-foreground"><X className="h-5 w-5 shrink-0" /> PDF sisältää vesileiman</li>
            </ul>
          </div>

          <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-surface to-surface p-8 shadow-glow">
            <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Suosituin
            </span>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pro</p>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold">14,99 €</span>
              <span className="text-sm text-muted-foreground">/ kk</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Peruuta milloin tahansa. Vähemmän kuin yksi lounas.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> <span><span className="font-semibold">Rajaton</span> määrä dokumentteja</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> Kaikki premium-CV-pohjat</li>
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> PDF ilman vesileimaa</li>
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> Parhaat AI-mallit</li>
              <li className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> Prioriteettituki &lt;24 h</li>
            </ul>
            <Link
              to="/upgrade"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:shadow-glow"
            >
              Päivitä Pro-versioon
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-surface/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Ominaisuus</th>
                <th className="px-6 py-3 font-semibold">Ilmainen</th>
                <th className="px-6 py-3 font-semibold text-primary">Pro</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row, i) => (
                <tr key={row.feature} className={i % 2 ? "bg-surface/30" : ""}>
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {typeof row.free === "boolean"
                      ? (row.free ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />)
                      : row.free}
                  </td>
                  <td className="px-6 py-4">
                    {typeof row.pro === "boolean"
                      ? (row.pro ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />)
                      : <span className="font-semibold text-foreground">{row.pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          30 päivän rahat takaisin -takuu. Ei sitoutumista.
        </p>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight">Valmiina aloittamaan?</h2>
        <p className="mt-4 text-muted-foreground">Yksi CV, saatekirje ja rekrytointisähköposti veloituksetta. Sen jälkeen 14,99 € / kk rajattomasti.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:shadow-glow"
          >
            Luo ilmainen tili
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-4 w-4 text-primary" />
            Suomenkielinen
            <Check className="h-4 w-4 text-primary" />
            Turvallinen
          </div>
        </div>
      </div>
    </section>
  );
}
