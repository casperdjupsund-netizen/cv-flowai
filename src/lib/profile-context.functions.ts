import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ExperienceItem {
  id: string;
  title: string | null;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export interface EducationItem {
  id: string;
  school: string | null;
  degree: string | null;
  major: string | null;
  year: string | null;
}

export interface PriorDocument {
  type: string;
  created_at: string;
  job_posting: string | null;
  summary: string;
}

export interface ProfileContext {
  profile: {
    first_name: string | null;
    last_name: string | null;
    job_title: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    bio: string | null;
    skills: string | null;
    ai_notes: string | null;
  } | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  priorDocuments: PriorDocument[];
}

/** Tiivistä jsonb-sisältö lyhyeksi tekstiyhteenvedoksi AI-kontekstia varten. */
function summarizeContent(content: unknown, maxLen = 600): string {
  if (content == null) return "";
  let text: string;
  if (typeof content === "string") {
    text = content;
  } else if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    if (Array.isArray(obj.sections)) {
      text = (obj.sections as Array<Record<string, unknown>>)
        .map((s) => `${s.heading ?? ""}: ${typeof s.body === "string" ? s.body : ""}`)
        .join("\n");
    } else if (typeof obj.body === "string") {
      text = (typeof obj.subject === "string" ? `Aihe: ${obj.subject}\n` : "") + obj.body;
    } else if (typeof obj.text === "string") {
      text = obj.text;
    } else {
      text = JSON.stringify(content);
    }
  } else {
    text = String(content);
  }
  text = text.trim().replace(/\s+/g, " ");
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

/**
 * Lataa käyttäjän koko profiilikontekstin AI-generointia varten:
 * perustiedot, AI-muistiinpanot, työkokemus, koulutus ja viimeisimmät
 * aiemmin luodut dokumentit (per tyyppi), jotta AI pysyy linjassa
 * käyttäjän aiempien valintojen kanssa.
 */
export const getProfileContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileContext> => {
    const { supabase, userId } = context;

    const [
      { data: profile },
      { data: experience },
      { data: education },
      { data: docs },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name,last_name,job_title,email,phone,location,linkedin,bio,skills,ai_notes")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("experience")
        .select("id,title,company,start_date,end_date,description")
        .eq("profile_id", userId)
        .order("order_index", { ascending: true }),
      supabase
        .from("education")
        .select("id,school,degree,major,year")
        .eq("profile_id", userId)
        .order("order_index", { ascending: true }),
      supabase
        .from("documents")
        .select("type,created_at,job_posting,content")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    return {
      profile: profile ?? null,
      experience: (experience ?? []) as ProfileContext["experience"],
      education: (education ?? []) as ProfileContext["education"],
      priorDocuments: (docs ?? []).map((d) => ({
        type: d.type,
        created_at: d.created_at,
        job_posting: d.job_posting,
        summary: summarizeContent(d.content),
      })),
    };
  });

/**
 * Muotoile profiilikonteksti yhdeksi tekstipromptiksi AI-generointia varten.
 */
export function formatProfileContextAsPrompt(ctx: ProfileContext): string {
  const lines: string[] = [];
  const p = ctx.profile;

  if (p) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    lines.push("=== HENKILÖTIEDOT ===");
    if (name) lines.push(`Nimi: ${name}`);
    if (p.job_title) lines.push(`Ammattinimike: ${p.job_title}`);
    if (p.email) lines.push(`Sähköposti: ${p.email}`);
    if (p.phone) lines.push(`Puhelin: ${p.phone}`);
    if (p.location) lines.push(`Sijainti: ${p.location}`);
    if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
    if (p.bio) {
      lines.push("");
      lines.push("=== ESITTELY ===");
      lines.push(p.bio);
    }
  }

  if (ctx.experience.length > 0) {
    lines.push("");
    lines.push("=== TYÖKOKEMUS ===");
    for (const e of ctx.experience) {
      const head = [e.title, e.company].filter(Boolean).join(" — ");
      const range = [e.start_date, e.end_date].filter(Boolean).join(" – ");
      lines.push(`- ${head}${range ? ` (${range})` : ""}`);
      if (e.description) lines.push(`  ${e.description}`);
    }
  }

  if (ctx.education.length > 0) {
    lines.push("");
    lines.push("=== KOULUTUS ===");
    for (const e of ctx.education) {
      const head = [e.degree, e.major].filter(Boolean).join(", ");
      const meta = [e.school, e.year].filter(Boolean).join(" — ");
      lines.push(`- ${head}${head && meta ? " — " : ""}${meta}`);
    }
  }

  if (p?.skills) {
    lines.push("");
    lines.push("=== TAIDOT ===");
    lines.push(p.skills);
  }

  if (p?.ai_notes) {
    lines.push("");
    lines.push("=== KÄYTTÄJÄN OHJEET AI:LLE ===");
    lines.push("Noudata näitä ohjeita aina kun mahdollista:");
    lines.push(p.ai_notes);
  }

  if (ctx.priorDocuments.length > 0) {
    lines.push("");
    lines.push("=== AIEMMIN LUODUT DOKUMENTIT (KÄYTÄ TYYLI- JA SISÄLTÖVIITTEINÄ) ===");
    for (const d of ctx.priorDocuments) {
      const dateStr = new Date(d.created_at).toLocaleDateString("fi-FI");
      lines.push(`- [${d.type}, ${dateStr}] ${d.summary}`);
    }
    lines.push(
      "Pidä sävy ja muoto johdonmukaisena aiempien dokumenttien kanssa, " +
        "mutta vältä toistamasta samoja lauseita sanasta sanaan.",
    );
  }

  return lines.join("\n").trim() || "(Profiilissa ei ole tietoja)";
}
