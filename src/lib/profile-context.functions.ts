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
  } | null;
  experience: ExperienceItem[];
  education: EducationItem[];
}

/**
 * Lataa käyttäjän koko profiilikontekstin (perustiedot + työkokemus + koulutus)
 * yhdellä kutsulla. Käytetään AI-generoinnissa, jotta CV/saatekirje/sähköposti
 * saavat aina ajantasaisen ja täydellisen pohjan.
 */
export const getProfileContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileContext> => {
    const { supabase, userId } = context;

    const [
      { data: profile },
      { data: experience },
      { data: education },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name,last_name,job_title,email,phone,location,linkedin,bio,skills")
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
    ]);

    return {
      profile: profile ?? null,
      experience: (experience ?? []) as ExperienceItem[],
      education: (education ?? []) as EducationItem[],
    };
  });

/**
 * Muotoile profiilikonteksti yhdeksi tekstipromptiksi AI-generointia varten.
 * Tätä voi syöttää sellaisenaan järjestelmäviestiin tai käyttäjäkontekstiin.
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

  return lines.join("\n").trim() || "(Profiilissa ei ole tietoja)";
}
