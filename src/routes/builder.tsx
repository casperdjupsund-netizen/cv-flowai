import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";

export const Route = createFileRoute("/builder")({
  component: CvBuilderPage,
  head: () => ({ meta: [{ title: "CV Builder — CVFlow" }] }),
});

// ── Types ──────────────────────────────────────────────────────
type Step = "profile" | "docpicker" | "jobscreen" | "generating" | "editor";
type DocType = "cv" | "cover" | "email";
type Layout = "classic" | "sidebar";

interface ExpItem { id: string; title: string; company: string; start: string; end: string; desc: string }
interface EduItem { id: string; degree: string; school: string; year: string; major: string }

interface Profile {
  firstName: string; lastName: string; jobTitle: string;
  email: string; phone: string; location: string; linkedin: string; bio: string;
  experience: ExpItem[]; education: EduItem[]; skills: string;
}

interface CvData {
  type: string;
  summary?: string;
  experience?: Array<{ title: string; company: string; period: string; description: string }>;
  education?: Array<{ degree: string; school: string; year: string }>;
  skills?: string[];
  extraSection?: { title: string; content: string };
  subject?: string; body?: string; opening?: string; closing?: string; signature?: string;
}

interface Sections {
  summary: boolean; experience: boolean; education: boolean;
  skills: boolean; extra: boolean;
  custom: Array<{ id: string; label: string; content: string; visible: boolean }>;
}

const emptyProfile = (): Profile => ({
  firstName: "", lastName: "", jobTitle: "", email: "",
  phone: "", location: "", linkedin: "", bio: "",
  experience: [], education: [], skills: "",
});

const initSections = (): Sections => ({
  summary: true, experience: true, education: true, skills: true, extra: true, custom: [],
});

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Styles injected for CV paper ───────────────────────────────
const CV_CSS = `
.cv3-paper { width:100%; min-height:297mm; background:white; font-size:13px; font-family:'DM Sans',sans-serif; color:#222; }
.cv3-hdr { padding:34px 42px 26px; border-bottom:3px solid #111; }
.cv3-hdr-photo { display:flex; gap:22px; align-items:flex-start; }
.cv3-photo { width:82px; height:82px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid #111; }
.cv3-name { font-size:28px; font-weight:800; letter-spacing:-1px; line-height:1.1; color:#111; }
.cv3-role { font-size:13px; color:#666; margin-top:4px; }
.cv3-contacts { display:flex; gap:14px; margin-top:8px; flex-wrap:wrap; }
.cv3-ci { font-size:11px; color:#888; }
.cv3-body { padding:26px 42px; display:flex; flex-direction:column; gap:20px; }
.cv3-sec-lbl { font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:11px; }
.cv3-txt { font-size:12px; line-height:1.7; color:#444; }
.cv3-entry { margin-bottom:10px; }
.cv3-eh { display:flex; justify-content:space-between; align-items:baseline; }
.cv3-et { font-size:13px; font-weight:600; color:#111; }
.cv3-ed { font-size:10px; color:#bbb; }
.cv3-ec { font-size:11px; color:#777; margin-top:1px; }
.cv3-edesc { font-size:11px; color:#555; line-height:1.6; margin-top:4px; }
.cv3-tags { display:flex; flex-wrap:wrap; gap:5px; }
.cv3-tag { font-size:10px; padding:3px 9px; border-radius:3px; background:#f2f2f2; color:#555; }
.cv3-paper.ly-sidebar { display:grid; grid-template-columns:190px 1fr; }
.cv3-scol { padding:28px 16px; color:white; }
.cv3-scol .cv3-name { color:white; font-size:20px; }
.cv3-scol .cv3-role { color:rgba(255,255,255,.6); font-size:11px; }
.cv3-sphoto { width:64px; height:64px; border-radius:50%; object-fit:cover; display:block; margin:0 auto 12px; border:2px solid rgba(255,255,255,.3); }
.cv3-scol-lbl { font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,.4); border-bottom:1px solid rgba(255,255,255,.12); padding-bottom:4px; margin:14px 0 7px; }
.cv3-sskill { font-size:11px; color:rgba(255,255,255,.75); padding:2px 0; }
.cv3-mcol { padding:28px 24px; }
[contenteditable] { outline:none; cursor:text; border-radius:2px; transition:background .12s; }
[contenteditable]:hover { background:rgba(200,241,53,.08) !important; }
[contenteditable]:focus { background:rgba(200,241,53,.15) !important; }
`;

// ── Tokens ─────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0a", surface: "#111", surface2: "#171717", surface3: "#1e1e1e",
  border: "#242424", accent: "#c8f135", text: "#f0f0f0",
  muted: "#4a4a4a", dim: "#777",
};

const S = {
  syne: { fontFamily: "'Syne',sans-serif" } as React.CSSProperties,
  dm: { fontFamily: "'DM Sans',sans-serif" } as React.CSSProperties,
};

// ── Reusable primitives ────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: ".8px", textTransform: "uppercase" }}>
      {children}
    </label>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label>{label}</Label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6,
          color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14,
          padding: "11px 14px", outline: "none",
        }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px rgba(200,241,53,.06)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label>{label}</Label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6,
          color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14,
          padding: "11px 14px", outline: "none", resize: "vertical",
        }}
        onFocus={e => { e.target.style.borderColor = C.accent; }}
        onBlur={e => { e.target.style.borderColor = C.border; }}
      />
    </div>
  );
}

function BtnPrimary({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: C.accent, color: "#0a0a0a", border: "none",
      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
      padding: "11px 22px", borderRadius: 4, cursor: "pointer",
      transition: "all .2s", ...style,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 18px rgba(200,241,53,.22)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: `1px solid ${C.border}`, color: C.dim,
      fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13,
      padding: "10px 20px", borderRadius: 4, cursor: "pointer",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.dim; (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.dim; }}
    >
      {children}
    </button>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "88px 24px 60px",
    }}>
      {children}
    </div>
  );
}

function FormWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ width: "100%", maxWidth: 700 }}>{children}</div>;
}

function PageLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.accent, marginBottom: 10 }}>{children}</div>;
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 style={{ ...S.syne, fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 8 }}>{children}</h1>;
}

function PageSub({ children }: { children: React.ReactNode }) {
  return <p style={{ color: C.dim, fontSize: 14, marginBottom: 36 }}>{children}</p>;
}

function FormNav({ onBack, onNext, nextLabel = "Seuraava →", backLabel = "← Takaisin" }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; backLabel?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
      <BtnOutline onClick={onBack}>{backLabel}</BtnOutline>
      <BtnPrimary onClick={onNext}>{nextLabel}</BtnPrimary>
    </div>
  );
}

// ── Step 1: Profile ────────────────────────────────────────────
function ProfileStep({ profile, onChange, onNext }: {
  profile: Profile;
  onChange: (p: Profile) => void;
  onNext: () => void;
}) {
  const set = (k: keyof Profile) => (v: string) => onChange({ ...profile, [k]: v });

  const addExp = () => onChange({
    ...profile,
    experience: [...profile.experience, { id: uid(), title: "", company: "", start: "", end: "", desc: "" }],
  });
  const rmExp = (id: string) => onChange({ ...profile, experience: profile.experience.filter(e => e.id !== id) });
  const setExp = (id: string, k: keyof ExpItem, v: string) => onChange({
    ...profile,
    experience: profile.experience.map(e => e.id === id ? { ...e, [k]: v } : e),
  });

  const addEdu = () => onChange({
    ...profile,
    education: [...profile.education, { id: uid(), degree: "", school: "", year: "", major: "" }],
  });
  const rmEdu = (id: string) => onChange({ ...profile, education: profile.education.filter(e => e.id !== id) });
  const setEdu = (id: string, k: keyof EduItem, v: string) => onChange({
    ...profile,
    education: profile.education.map(e => e.id === id ? { ...e, [k]: v } : e),
  });

  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 };
  const grid1: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 };
  const block: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 10 };

  return (
    <PageWrap>
      <FormWrap>
        <PageLabel>Vaihe 1 / 4 — Profiili</PageLabel>
        <PageTitle>Perustiedot</PageTitle>
        <PageSub>Täytä kerran — käytetään CV:n ja hakemusten luomiseen.</PageSub>

        <div style={grid2}>
          <Field label="Etunimi" value={profile.firstName} onChange={set("firstName")} placeholder="Mikael" />
          <Field label="Sukunimi" value={profile.lastName} onChange={set("lastName")} placeholder="Korhonen" />
        </div>
        <div style={grid2}>
          <Field label="Ammattinimike" value={profile.jobTitle} onChange={set("jobTitle")} placeholder="Frontend-kehittäjä" />
          <Field label="Sähköposti" value={profile.email} onChange={set("email")} placeholder="mikael@email.fi" type="email" />
        </div>
        <div style={grid2}>
          <Field label="Puhelin" value={profile.phone} onChange={set("phone")} placeholder="+358 40 123 4567" />
          <Field label="Paikkakunta" value={profile.location} onChange={set("location")} placeholder="Helsinki, Suomi" />
        </div>
        <div style={{ ...grid1 }}>
          <Field label="LinkedIn / Portfolio" value={profile.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/mikael" />
        </div>
        <div style={{ ...grid1 }}>
          <TextArea label="Lyhyt esittely" value={profile.bio} onChange={set("bio")} placeholder="Osaava ja motivoitunut..." rows={3} />
        </div>

        {/* Experience */}
        <div style={{ marginTop: 24 }}>
          <PageLabel>Työkokemus</PageLabel>
          {profile.experience.map(e => (
            <div key={e.id} style={block}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ ...S.syne, fontWeight: 700, fontSize: 13 }}>Työpaikka</span>
                <button onClick={() => rmExp(e.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
              <div style={grid2}>
                <Field label="Nimike" value={e.title} onChange={v => setExp(e.id, "title", v)} placeholder="Frontend Developer" />
                <Field label="Yritys" value={e.company} onChange={v => setExp(e.id, "company", v)} placeholder="Yritys Oy" />
              </div>
              <div style={grid2}>
                <Field label="Alkoi" value={e.start} onChange={v => setExp(e.id, "start", v)} placeholder="01/2022" />
                <Field label="Päättyi" value={e.end} onChange={v => setExp(e.id, "end", v)} placeholder="Nykyinen" />
              </div>
              <TextArea label="Kuvaus" value={e.desc} onChange={v => setExp(e.id, "desc", v)} placeholder="Mitä teit, mitä saavutit..." rows={3} />
            </div>
          ))}
          <button onClick={addExp} style={{
            width: "100%", background: "none", border: `1px dashed ${C.border}`,
            borderRadius: 7, color: C.dim, fontFamily: "'DM Sans',sans-serif",
            fontSize: 13, padding: 11, cursor: "pointer", marginTop: 2,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent; (e.currentTarget as HTMLButtonElement).style.color = C.accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.dim; }}
          >+ Lisää työkokemus</button>
        </div>

        {/* Education */}
        <div style={{ marginTop: 24 }}>
          <PageLabel>Koulutus</PageLabel>
          {profile.education.map(e => (
            <div key={e.id} style={block}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ ...S.syne, fontWeight: 700, fontSize: 13 }}>Koulutus</span>
                <button onClick={() => rmEdu(e.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
              <div style={grid2}>
                <Field label="Tutkinto" value={e.degree} onChange={v => setEdu(e.id, "degree", v)} placeholder="Tradenomi" />
                <Field label="Koulu" value={e.school} onChange={v => setEdu(e.id, "school", v)} placeholder="CENTRIA AMK" />
              </div>
              <div style={grid2}>
                <Field label="Vuosi" value={e.year} onChange={v => setEdu(e.id, "year", v)} placeholder="2020–2024" />
                <Field label="Pääaine" value={e.major} onChange={v => setEdu(e.id, "major", v)} placeholder="Tietotekniikka" />
              </div>
            </div>
          ))}
          <button onClick={addEdu} style={{
            width: "100%", background: "none", border: `1px dashed ${C.border}`,
            borderRadius: 7, color: C.dim, fontFamily: "'DM Sans',sans-serif",
            fontSize: 13, padding: 11, cursor: "pointer", marginTop: 2,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent; (e.currentTarget as HTMLButtonElement).style.color = C.accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.dim; }}
          >+ Lisää koulutus</button>
        </div>

        {/* Skills */}
        <div style={{ marginTop: 24, marginBottom: 0 }}>
          <Field label="Taidot (pilkulla erotettu)" value={profile.skills} onChange={set("skills")} placeholder="JavaScript, React, Figma, Suomi, Englanti..." />
        </div>

        <FormNav onBack={() => window.history.back()} onNext={onNext} backLabel="← Etusivu" nextLabel="Valitse dokumentti →" />
      </FormWrap>
    </PageWrap>
  );
}

// ── Step 2: Doc Picker ─────────────────────────────────────────
function DocPickerStep({ docType, onSelect, onNext, onBack }: {
  docType: DocType; onSelect: (t: DocType) => void; onNext: () => void; onBack: () => void;
}) {
  const docs: Array<{ type: DocType; icon: string; title: string; desc: string }> = [
    { type: "cv", icon: "📄", title: "CV", desc: "Räätälöity ansioluettelo valittuun tehtävään" },
    { type: "cover", icon: "✉️", title: "Saatekirje", desc: "Vakuuttava hakukirje joka täydentää CV:tä" },
    { type: "email", icon: "📧", title: "Sähköposti", desc: "Lyhyt yhteydenotto rekrytoijalle" },
  ];
  return (
    <PageWrap>
      <div style={{ width: "100%", maxWidth: 700 }}>
        <PageLabel>Vaihe 2 / 4</PageLabel>
        <PageTitle>Mitä luodaan?</PageTitle>
        <PageSub>Valitse dokumenttityyppi. Sama profiili, eri asiakirja.</PageSub>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {docs.map(d => (
            <button key={d.type} onClick={() => onSelect(d.type)} style={{
              background: docType === d.type ? "rgba(200,241,53,.04)" : C.surface,
              border: `1px solid ${docType === d.type ? C.accent : C.border}`,
              borderRadius: 10, padding: 24, cursor: "pointer", textAlign: "center",
              color: C.text, transition: "all .2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
              <div style={{ ...S.syne, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{d.title}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.4 }}>{d.desc}</div>
            </button>
          ))}
        </div>
        <FormNav onBack={onBack} onNext={onNext} backLabel="← Muokkaa profiilia" />
      </div>
    </PageWrap>
  );
}

// ── Step 3: Job Posting ────────────────────────────────────────
function JobStep({ jobPosting, onChange, docType, docStyle, onStyleChange, onNext, onBack }: {
  jobPosting: string; onChange: (v: string) => void;
  docType: DocType; docStyle: string; onStyleChange: (s: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const styles = [
    { id: "classic", name: "Klassinen", desc: "Siisti ja ajaton" },
    { id: "sidebar", name: "Sivupalkki", desc: "Moderni rakenne" },
    { id: "minimal", name: "Minimali", desc: "Typografia edellä" },
  ];
  return (
    <PageWrap>
      <FormWrap>
        <PageLabel>Vaihe 3 / 4 — Työilmoitus</PageLabel>
        <PageTitle>Liitä työilmoitus</PageTitle>
        <PageSub>Kopioi koko ilmoitus. Dokumentti räätälöidään sen pohjalta.</PageSub>

        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "11px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, letterSpacing: ".8px", textTransform: "uppercase", fontWeight: 700 }}>
            Työilmoituksen teksti
          </div>
          <textarea
            value={jobPosting} onChange={e => onChange(e.target.value)}
            placeholder="Liitä tähän koko työilmoitus..."
            rows={10}
            style={{
              width: "100%", background: "transparent", border: "none",
              color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              lineHeight: 1.7, padding: 16, outline: "none", resize: "vertical",
            }}
          />
        </div>

        {docType === "cv" && (
          <div style={{ marginTop: 24 }}>
            <PageLabel>CV:n tyyli</PageLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
              {styles.map(s => (
                <button key={s.id} onClick={() => onStyleChange(s.id)} style={{
                  border: `1px solid ${docStyle === s.id ? C.accent : C.border}`,
                  background: docStyle === s.id ? "rgba(200,241,53,.04)" : "none",
                  borderRadius: 8, padding: 12, cursor: "pointer", textAlign: "center", color: C.text,
                }}>
                  <div style={{ height: 40, background: C.surface3, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ ...S.syne, fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <FormNav onBack={onBack} onNext={onNext} backLabel="← Vaihda dokumentti" nextLabel="Luo dokumentti ✦" />
      </FormWrap>
    </PageWrap>
  );
}

// ── Step 4: Generating ─────────────────────────────────────────
function GeneratingScreen({ genStep, docType }: { genStep: number; docType: DocType }) {
  const titles: Record<DocType, string> = {
    cv: "Luodaan CV:täsi...",
    cover: "Kirjoitetaan saatekirjettä...",
    email: "Luodaan sähköpostia...",
  };
  const steps = [
    "Analysoidaan työilmoitusta",
    "Räätälöidään profiilistasi",
    "Kirjoitetaan teksti",
    "Viimeistellään layout",
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
      <div style={{
        width: 68, height: 68,
        border: "2px solid rgba(200,241,53,.2)",
        borderTopColor: C.accent,
        borderRadius: "50%",
        animation: "cv3spin .9s linear infinite",
        marginBottom: 28,
      }} />
      <style>{`@keyframes cv3spin{to{transform:rotate(360deg)}}`}</style>
      <h2 style={{ ...S.syne, fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", marginBottom: 8 }}>{titles[docType]}</h2>
      <p style={{ color: C.dim, fontSize: 13, marginBottom: 32 }}>Tekoäly analysoi ja räätälöi dokumentin</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, width: "100%" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: C.surface,
            border: `1px solid ${genStep === i + 1 ? C.accent : genStep > i + 1 ? "rgba(200,241,53,.2)" : C.border}`,
            borderRadius: 7, padding: "11px 14px", fontSize: 12,
            color: genStep >= i + 1 ? C.text : C.muted,
            transition: "all .3s",
          }}>
            <span style={{ color: genStep > i + 1 ? C.accent : C.muted, width: 16 }}>
              {genStep > i + 1 ? "✓" : "○"}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 5: Editor ─────────────────────────────────────────────
function EditorScreen({ cvData, profile, layout, accent, cvFont, photo, sections, onLayoutChange, onAccentChange, onFontChange, onPhotoChange, onSectionsChange, onDownload, showToast, cvPaperRef }: {
  cvData: CvData; profile: Profile; layout: Layout; accent: string; cvFont: string;
  photo: string | null; sections: Sections;
  onLayoutChange: (l: Layout) => void; onAccentChange: (c: string) => void;
  onFontChange: (f: string) => void; onPhotoChange: (p: string | null) => void;
  onSectionsChange: (s: Sections) => void;
  onDownload: () => void; showToast: (m: string) => void;
  cvPaperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeTab, setActiveTab] = useState<"design" | "ideas" | "sections">("design");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => onPhotoChange(ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const execCmd = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); };

  const colors = ["#111", "#1a4ed8", "#0d7a59", "#7c3aed", "#c2410c", "#9f1239", "#374151", "#064e3b"];
  const fonts = [
    { label: "Syne — Moderni", value: "'Syne',sans-serif" },
    { label: "Georgia — Klassinen", value: "Georgia,serif" },
    { label: "DM Sans — Neutraali", value: "'DM Sans',sans-serif" },
    { label: "Courier — Tekninen", value: "'Courier New',monospace" },
  ];

  const suggestions = [
    { tag: "IT & Tech", text: "Tuloshakuinen kehittäjä, jolla on 5+ vuoden kokemus modernien sovellusten rakentamisesta. Erikoistunut React ja Node.js teknologioihin." },
    { tag: "Myynti", text: "Asiakaslähtöinen myyntiammattilainen jolla on todistettu kokemus B2B-myynnistä ja tavoitteiden ylittämisestä." },
    { tag: "Markkinointi", text: "Luova markkinointiasiantuntija joka yhdistää data-analytiikan ja sisältöstrategian brändin kasvattamiseksi." },
    { tag: "Saavutus", text: "Kasvatin verkkokaupan konversiota 34% uudistamalla tuotesivujen layoutin A/B-testauksen avulla." },
    { tag: "Saavutus", text: "Johdin 6 hengen tiimiä ja toimitin projektin 2 viikkoa etuajassa ja 15% alle budjetin." },
    { tag: "Taito", text: "Vahva analyyttinen ajattelu ja kyky ratkaista monimutkaisia ongelmia systemaattisesti." },
    { tag: "Taito", text: "Erinomainen viestintätaito suomeksi ja englanniksi, sekä kirjallisesti että suullisesti." },
  ];

  const copySuggestion = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast("Kopioitu — liitä CV:hen klikkaamalla kenttää ✦");
  };

  const sidebarW = 260;
  const toolbarH = 44;

  // Build CV HTML
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Etunimi Sukunimi";
  const buildContacts = () =>
    [
      profile.email && `<span class="cv3-ci">✉ ${profile.email}</span>`,
      profile.phone && `<span class="cv3-ci">☏ ${profile.phone}</span>`,
      profile.location && `<span class="cv3-ci">⌖ ${profile.location}</span>`,
      profile.linkedin && `<span class="cv3-ci">⌂ ${profile.linkedin}</span>`,
    ].filter(Boolean).join("");

  const secLbl = (t: string) =>
    `<div class="cv3-sec-lbl" style="border-color:${accent};color:${accent}">${t}</div>`;

  const buildMainSections = (isSidebar = false) => {
    const parts: string[] = [];
    if (sections.summary && cvData.summary && !isSidebar)
      parts.push(`<div class="cv3-sec">${secLbl("Tiivistelmä")}<div class="cv3-txt" contenteditable="true">${cvData.summary}</div></div>`);
    if (sections.experience && cvData.experience?.length)
      parts.push(`<div class="cv3-sec">${secLbl("Työkokemus")}${cvData.experience.map(e => `<div class="cv3-entry"><div class="cv3-eh"><div class="cv3-et" contenteditable="true">${e.title}</div><div class="cv3-ed" contenteditable="true">${e.period}</div></div><div class="cv3-ec" contenteditable="true">${e.company}</div><div class="cv3-edesc" contenteditable="true">${e.description}</div></div>`).join("")}</div>`);
    if (!isSidebar && sections.education && cvData.education?.length)
      parts.push(`<div class="cv3-sec">${secLbl("Koulutus")}${cvData.education.map(e => `<div class="cv3-entry"><div class="cv3-eh"><div class="cv3-et" contenteditable="true">${e.degree}</div><div class="cv3-ed" contenteditable="true">${e.year}</div></div><div class="cv3-ec" contenteditable="true">${e.school}</div></div>`).join("")}</div>`);
    if (!isSidebar && sections.skills && cvData.skills?.length)
      parts.push(`<div class="cv3-sec">${secLbl("Taidot")}<div class="cv3-tags">${cvData.skills.map(s => `<span class="cv3-tag" contenteditable="true">${s}</span>`).join("")}</div></div>`);
    if (sections.extra && cvData.extraSection)
      parts.push(`<div class="cv3-sec">${secLbl(cvData.extraSection.title)}<div class="cv3-txt" contenteditable="true">${cvData.extraSection.content}</div></div>`);
    return parts.join("");
  };

  const buildCvHtml = () => {
    if (cvData.type === "cover" || cvData.type === "email") {
      const n = name;
      if (cvData.type === "cover") {
        return `<div style="padding:48px 52px;font-family:${cvFont}">
          <div style="font-size:22px;font-weight:800;color:${accent};font-family:'Syne',sans-serif;margin-bottom:4px" contenteditable="true">${n}</div>
          <div style="font-size:12px;color:#888;margin-bottom:32px" contenteditable="true">${profile.email} · ${profile.phone}</div>
          <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:20px;font-family:'Syne',sans-serif" contenteditable="true">${cvData.subject || "Hakukirje"}</div>
          <div style="font-size:13px;line-height:1.8;color:#333;margin-bottom:16px" contenteditable="true">${cvData.opening || ""}</div>
          <div style="font-size:13px;line-height:1.8;color:#333;margin-bottom:16px;white-space:pre-line" contenteditable="true">${cvData.body || ""}</div>
          <div style="font-size:13px;line-height:1.8;color:#333;margin-bottom:32px" contenteditable="true">${cvData.closing || ""}</div>
          <div style="font-size:13px;color:#555" contenteditable="true">${cvData.signature || n}</div>
        </div>`;
      } else {
        return `<div style="padding:48px 52px;font-family:${cvFont}">
          <div style="font-size:11px;color:#aaa;margin-bottom:8px">Aihe:</div>
          <div style="font-size:15px;font-weight:700;color:#111;font-family:'Syne',sans-serif;margin-bottom:32px;border-bottom:2px solid ${accent};padding-bottom:14px" contenteditable="true">${cvData.subject || ""}</div>
          <div style="font-size:13px;line-height:1.85;color:#333;white-space:pre-line" contenteditable="true">${cvData.body || ""}</div>
        </div>`;
      }
    }

    if (layout === "sidebar") {
      return `
        <div class="cv3-scol" style="background:${accent}">
          ${photo ? `<img class="cv3-sphoto" src="${photo}" alt="">` : ""}
          <div class="cv3-name" contenteditable="true">${name}</div>
          <div class="cv3-role" contenteditable="true">${profile.jobTitle || ""}</div>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:3px">
            ${profile.email ? `<div style="font-size:10px;color:rgba(255,255,255,.6)" contenteditable="true">✉ ${profile.email}</div>` : ""}
            ${profile.phone ? `<div style="font-size:10px;color:rgba(255,255,255,.6)" contenteditable="true">☏ ${profile.phone}</div>` : ""}
            ${profile.location ? `<div style="font-size:10px;color:rgba(255,255,255,.6)" contenteditable="true">⌖ ${profile.location}</div>` : ""}
          </div>
          ${cvData.skills?.length && sections.skills ? `<div class="cv3-scol-lbl">Taidot</div>${cvData.skills.map(s => `<div class="cv3-sskill" contenteditable="true">${s}</div>`).join("")}` : ""}
          ${cvData.education?.length && sections.education ? `<div class="cv3-scol-lbl">Koulutus</div>${cvData.education.map(e => `<div style="margin-bottom:7px"><div style="font-size:11px;color:white;font-weight:600" contenteditable="true">${e.degree}</div><div style="font-size:10px;color:rgba(255,255,255,.55)" contenteditable="true">${e.school}</div><div style="font-size:9px;color:rgba(255,255,255,.35)" contenteditable="true">${e.year}</div></div>`).join("")}` : ""}
        </div>
        <div class="cv3-mcol" style="font-family:${cvFont}">
          <div class="cv3-name" style="color:${accent}" contenteditable="true">${name}</div>
          <div class="cv3-role" contenteditable="true">${profile.jobTitle || ""}</div>
          <div style="margin-top:16px">${buildMainSections(true)}</div>
        </div>
      `;
    }

    // Classic layout
    const hdr = photo
      ? `<div class="cv3-hdr-photo"><img class="cv3-photo" src="${photo}" style="border-color:${accent}" alt=""><div style="flex:1"><div class="cv3-name" style="color:${accent}" contenteditable="true">${name}</div><div class="cv3-role" contenteditable="true">${profile.jobTitle || ""}</div><div class="cv3-contacts">${buildContacts()}</div></div></div>`
      : `<div class="cv3-name" style="color:${accent}" contenteditable="true">${name}</div><div class="cv3-role" contenteditable="true">${profile.jobTitle || ""}</div><div class="cv3-contacts">${buildContacts()}</div>`;

    return `
      <div class="cv3-hdr" style="border-color:${accent};font-family:${cvFont}">${hdr}</div>
      <div class="cv3-body" style="font-family:${cvFont}">${buildMainSections()}</div>
    `;
  };

  // Update CV paper
  useEffect(() => {
    if (!cvPaperRef.current) return;
    const paper = cvPaperRef.current;
    paper.className = `cv3-paper${layout === "sidebar" ? " ly-sidebar" : ""}`;
    paper.innerHTML = buildCvHtml();
  });

  const secDefs = [
    { id: "summary" as const, label: "Tiivistelmä", icon: "📝" },
    { id: "experience" as const, label: "Työkokemus", icon: "💼" },
    { id: "education" as const, label: "Koulutus", icon: "🎓" },
    { id: "skills" as const, label: "Taidot", icon: "🛠" },
    { id: "extra" as const, label: "Lisätiedot", icon: "ℹ️" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Toolbar */}
      <div style={{
        position: "fixed", top: 56, left: 0, right: 0, zIndex: 200,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        height: toolbarH, display: "flex", alignItems: "stretch",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1, padding: "0 10px", borderRight: `1px solid ${C.border}` }}>
          {[["B", "bold"], ["I", "italic"], ["U", "underline"]].map(([lbl, cmd]) => (
            <button key={cmd} onClick={() => execCmd(cmd)} style={{
              background: "none", border: "none", color: C.dim, cursor: "pointer",
              padding: "5px 8px", borderRadius: 4, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
            }}><b>{lbl}</b></button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 1, padding: "0 10px", borderRight: `1px solid ${C.border}` }}>
          {[["⬛▭▭", "justifyLeft"], ["▭⬛▭", "justifyCenter"], ["▭▭⬛", "justifyRight"]].map(([lbl, cmd]) => (
            <button key={cmd} onClick={() => execCmd(cmd)} style={{
              background: "none", border: "none", color: C.dim, cursor: "pointer",
              padding: "5px 8px", borderRadius: 4, fontSize: 11,
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderRight: `1px solid ${C.border}` }}>
          <button onClick={() => execCmd("insertUnorderedList")} style={{
            background: "none", border: "none", color: C.dim, cursor: "pointer",
            padding: "5px 8px", borderRadius: 4, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
          }}>≡ Lista</button>
        </div>
        <button
          onClick={() => { showToast("Käytä Ctrl+P tai ⌘+P tulostaaksesi PDF-muodossa 🖨"); }}
          style={{
            marginLeft: "auto", background: C.accent, color: "#0a0a0a", border: "none",
            fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12,
            padding: "0 18px", cursor: "pointer",
          }}
        >
          ⬇ Lataa PDF
        </button>
      </div>

      {/* Editor body */}
      <div style={{
        display: "grid", gridTemplateColumns: `${sidebarW}px 1fr`,
        height: `calc(100vh - ${56 + toolbarH}px)`,
        marginTop: 56 + toolbarH,
      }}>
        {/* Sidebar */}
        <div style={{ background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {(["design", "ideas", "sections"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: "11px 6px", textAlign: "center",
                fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase",
                color: activeTab === tab ? C.accent : C.muted,
                borderBottom: `2px solid ${activeTab === tab ? C.accent : "transparent"}`,
                background: "none", border: "none", cursor: "pointer",
                borderBottomStyle: "solid",
              }}>
                {tab === "design" ? "Ulkoasu" : tab === "ideas" ? "Ideat" : "Osiot"}
              </button>
            ))}
          </div>

          <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
            {/* DESIGN TAB */}
            {activeTab === "design" && (
              <div>
                {/* Photo */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Profiilikuva</div>
                <div onClick={() => photoInputRef.current?.click()} style={{
                  border: `2px dashed ${photo ? "rgba(200,241,53,.3)" : C.border}`,
                  borderRadius: 8, padding: 16, textAlign: "center", cursor: "pointer", marginBottom: 8,
                }}>
                  {photo ? <img src={photo} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} /> : (
                    <div>
                      <div style={{ fontSize: 22, color: C.muted, marginBottom: 6 }}>📷</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Lisää kuva</div>
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                {photo && (
                  <button onClick={() => onPhotoChange(null)} style={{
                    width: "100%", background: "none", border: `1px solid ${C.border}`,
                    color: C.muted, fontSize: 11, padding: 6, borderRadius: 5, cursor: "pointer", marginBottom: 12,
                  }}>✕ Poista kuva</button>
                )}

                {/* Colors */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, margin: "16px 0 8px" }}>Korostusväri</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {colors.map(c => (
                    <div key={c} onClick={() => onAccentChange(c)} style={{
                      width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                      border: `2px solid ${accent === c ? "white" : "transparent"}`,
                      transform: accent === c ? "scale(1.2)" : "none", transition: "all .2s",
                    }} />
                  ))}
                </div>

                {/* Font */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, margin: "16px 0 8px" }}>Fontti</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {fonts.map(f => (
                    <button key={f.value} onClick={() => onFontChange(f.value)} style={{
                      padding: "8px 11px", border: `1px solid ${cvFont === f.value ? C.accent : C.border}`,
                      background: cvFont === f.value ? "rgba(200,241,53,.05)" : "none",
                      color: cvFont === f.value ? C.accent : C.text,
                      borderRadius: 5, cursor: "pointer", fontSize: 13, fontFamily: f.value, textAlign: "left",
                    }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Layout */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, margin: "16px 0 8px" }}>Layout</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {(["classic", "sidebar"] as Layout[]).map(l => (
                    <button key={l} onClick={() => onLayoutChange(l)} style={{
                      border: `1px solid ${layout === l ? C.accent : C.border}`,
                      background: layout === l ? "rgba(200,241,53,.05)" : "none",
                      color: layout === l ? C.accent : C.muted,
                      borderRadius: 5, padding: "8px 5px", cursor: "pointer", fontSize: 11,
                    }}>
                      <div style={{ height: 32, marginBottom: 5, display: "flex", gap: 3 }}>
                        {l === "classic" ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                            <div style={{ height: 6, background: C.border, borderRadius: 2 }} />
                            <div style={{ height: 3, width: "55%", background: C.border, borderRadius: 2 }} />
                          </div>
                        ) : (
                          <>
                            <div style={{ width: "35%", background: C.border, borderRadius: 2 }} />
                            <div style={{ flex: 1, background: "#333", borderRadius: 2 }} />
                          </>
                        )}
                      </div>
                      {l === "classic" ? "Klassinen" : "Sivupalkki"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* IDEAS TAB */}
            {activeTab === "ideas" && (
              <div>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Klikkaa kopioidaksesi leikepöydälle.</p>
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => copySuggestion(s.text)} style={{
                    background: C.surface2, border: `1px solid ${C.border}`,
                    borderRadius: 5, padding: "9px 11px", marginBottom: 5,
                    fontSize: 11, lineHeight: 1.5, color: C.dim, cursor: "pointer",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.accent; (e.currentTarget as HTMLDivElement).style.color = C.text; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.color = C.dim; }}
                  >
                    <span style={{ display: "inline-block", background: "rgba(200,241,53,.1)", color: C.accent, fontSize: 8, fontWeight: 700, letterSpacing: .5, padding: "2px 5px", borderRadius: 2, marginBottom: 4, textTransform: "uppercase" }}>
                      {s.tag}
                    </span>
                    <br />
                    {s.text}
                  </div>
                ))}
              </div>
            )}

            {/* SECTIONS TAB */}
            {activeTab === "sections" && (
              <div>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>Näytä tai piilota osioita.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {secDefs.map(d => (
                    <div key={d.id} style={{
                      background: C.surface2, border: `1px solid ${C.border}`,
                      borderRadius: 5, padding: "9px 12px", display: "flex",
                      alignItems: "center", justifyContent: "space-between", fontSize: 12,
                    }}>
                      <span>{d.icon} {d.label}</span>
                      <div
                        onClick={() => onSectionsChange({ ...sections, [d.id]: !sections[d.id] })}
                        style={{
                          width: 26, height: 14, background: sections[d.id] ? C.accent : C.border,
                          borderRadius: 100, position: "relative", cursor: "pointer", transition: "all .2s",
                        }}
                      >
                        <div style={{
                          position: "absolute", width: 10, height: 10, background: "white",
                          borderRadius: "50%", top: 2, transition: "all .2s",
                          left: sections[d.id] ? 14 : 2,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CV Preview */}
        <div style={{ overflowY: "auto", background: "#c8c8c8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24 }}>
          <div ref={cvPaperRef} className="cv3-paper" style={{ width: 794, minHeight: 1123, background: "white", boxShadow: "0 4px 40px rgba(0,0,0,.35)", fontFamily: cvFont }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
function CvBuilderPage() {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [docType, setDocType] = useState<DocType>("cv");
  const [docStyle, setDocStyle] = useState("classic");
  const [jobPosting, setJobPosting] = useState("");
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [layout, setLayout] = useState<Layout>("classic");
  const [accent, setAccent] = useState("#111");
  const [cvFont, setCvFont] = useState("'DM Sans',sans-serif");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sections, setSections] = useState<Sections>(initSections());
  const [toast, setToast] = useState("");
  const [genStep, setGenStep] = useState(0);
  const historyRef = useRef<Step[]>(["profile"]);
  const cvPaperRef = useRef<HTMLDivElement | null>(null);

  // Inject CV paper CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "cv3-global";
    el.textContent = CV_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("cv3-global")?.remove(); };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const goTo = useCallback((s: Step) => {
    if (historyRef.current[historyRef.current.length - 1] !== s) historyRef.current.push(s);
    setStep(s);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      setStep(historyRef.current[historyRef.current.length - 1]);
      window.scrollTo(0, 0);
    }
  }, []);

  const buildCvData = useCallback((p: Profile, type: DocType): CvData => {
    if (type === "cv") {
      return {
        type: "cv",
        summary: p.bio || `Motivoitunut ${p.jobTitle || "ammattilainen"}.`,
        experience: p.experience.map(e => ({
          title: e.title, company: e.company,
          period: [e.start, e.end].filter(Boolean).join("–"),
          description: e.desc,
        })),
        education: p.education.map(e => ({ degree: e.degree, school: e.school, year: e.year })),
        skills: p.skills.split(",").map(s => s.trim()).filter(Boolean),
        extraSection: { title: "Kielitaito", content: "Suomi (äidinkieli), Englanti (erinomainen)" },
      };
    } else if (type === "cover") {
      const n = [p.firstName, p.lastName].filter(Boolean).join(" ");
      return {
        type: "cover", subject: `Hakukirje: ${p.jobTitle || "[Tehtävänimike]"}`,
        opening: "Hyvä rekrytoija,",
        body: `Haen ${p.jobTitle || "avointa tehtävää"} yrityksessänne.\n\n${p.bio || "[Kirjoita saatekirjeesi tähän]"}`,
        closing: "Ystävällisin terveisin,",
        signature: n || "[Nimesi]",
      };
    } else {
      const n = [p.firstName, p.lastName].filter(Boolean).join(" ");
      return {
        type: "email",
        subject: `Hakemus: ${p.jobTitle || "[Tehtävänimike]"}`,
        body: `Hyvä rekrytoija,\n\nHaen avointa tehtävää yrityksessänne.\n\nYstävällisin terveisin,\n${n || "[Nimesi]"}`,
      };
    }
  }, []);

  const startGenerate = useCallback(() => {
    if (!jobPosting.trim()) { showToast("Liitä ensin työilmoitus!"); return; }
    setGenStep(0);
    goTo("generating");
    [0, 900, 1800, 2700].forEach((delay, i) => setTimeout(() => setGenStep(i + 1), delay));
    setTimeout(() => {
      setCvData(buildCvData(profile, docType));
      goTo("editor");
    }, 3800);
  }, [jobPosting, profile, docType, goTo, showToast, buildCvData]);

  const stepLabels: Partial<Record<Step, string>> = {
    docpicker: "Vaihe 2/4", jobscreen: "Vaihe 3/4", generating: "Generoidaan...", editor: "Editori",
  };
  const backLabels: Partial<Record<Step, string>> = {
    docpicker: "Profiili", jobscreen: "Dokumenttityyppi", editor: "Muokkaa ilmoitusta",
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans',sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 56,
        padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`, background: "rgba(10,10,10,.96)", backdropFilter: "blur(16px)",
      }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ ...S.syne, fontWeight: 800, fontSize: 17, letterSpacing: "-.5px", color: C.text }}>
            CV<span style={{ color: C.accent }}>FLOW</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {stepLabels[step] && <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{stepLabels[step]}</span>}
          {step !== "profile" && (
            <button onClick={goBack} style={{
              display: "flex", alignItems: "center", gap: 7, background: "none",
              border: `1px solid ${C.border}`, color: C.dim,
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              padding: "7px 14px", borderRadius: 4, cursor: "pointer",
            }}>
              ← {backLabels[step] || "Takaisin"}
            </button>
          )}
        </div>
      </nav>

      <div style={{ paddingTop: step === "editor" ? 0 : 56 }}>
        {step === "profile" && <ProfileStep profile={profile} onChange={setProfile} onNext={() => goTo("docpicker")} />}
        {step === "docpicker" && <DocPickerStep docType={docType} onSelect={setDocType} onNext={() => goTo("jobscreen")} onBack={() => goTo("profile")} />}
        {step === "jobscreen" && <JobStep jobPosting={jobPosting} onChange={setJobPosting} docType={docType} docStyle={docStyle} onStyleChange={setDocStyle} onNext={startGenerate} onBack={() => goTo("docpicker")} />}
        {step === "generating" && <GeneratingScreen genStep={genStep} docType={docType} />}
        {step === "editor" && cvData && (
          <EditorScreen
            cvData={cvData} profile={profile} layout={layout} accent={accent}
            cvFont={cvFont} photo={photo} sections={sections}
            onLayoutChange={setLayout} onAccentChange={setAccent}
            onFontChange={setCvFont} onPhotoChange={setPhoto}
            onSectionsChange={setSections}
            onDownload={() => showToast("Käytä Ctrl+P tai ⌘+P tulostaaksesi PDF-muodossa 🖨")}
            showToast={showToast}
            cvPaperRef={cvPaperRef}
          />
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
          padding: "10px 16px", borderRadius: 7, fontSize: 12, zIndex: 9999, whiteSpace: "nowrap",
          animation: "cv3fadein .25s ease",
        }}>
          <style>{`@keyframes cv3fadein{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          {toast}
        </div>
      )}
    </div>
  );
}
