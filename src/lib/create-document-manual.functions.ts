import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadProfileContext } from "@/lib/profile-context.functions";

const DocTypeSchema = z.enum(["cv", "cover_letter", "email"]);

const FREE_MONTHLY_LIMIT = 3;

export const createDocumentManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ type: DocTypeSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Tarkista kuukausiraja
    const monthStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
    ).toISOString();

    const [{ data: profileTier }, { count }] = await Promise.all([
      supabase.from("profiles").select("subscription_tier").eq("id", userId).maybeSingle(),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId)
        .gte("created_at", monthStart),
    ]);

    const tier = (profileTier?.subscription_tier as "free" | "pro") ?? "free";
    if (tier === "free" && (count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return { ok: false as const, error: "Kuukausiraja täynnä. Päivitä Pro-tiliin.", upgrade: true };
    }

    // Lataa profiilitiedot
    const ctx = await loadProfileContext(supabase, userId);
    const p = ctx.profile;

    let content: Record<string, unknown>;

    if (data.type === "cv") {
      const sections: { heading: string; body: string }[] = [];

      // Henkilötiedot
      const contactParts = [
        p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "",
        p?.job_title ?? "",
        p?.email ?? "",
        p?.phone ?? "",
        p?.location ?? "",
        p?.linkedin ?? "",
      ].filter(Boolean);
      sections.push({ heading: "Henkilötiedot", body: contactParts.join("\n") });

      // Esittely
      sections.push({ heading: "Esittely", body: p?.bio ?? "" });

      // Työkokemus
      const expBody =
        ctx.experience.length > 0
          ? ctx.experience
              .map((e) => {
                const title = [e.title, e.company].filter(Boolean).join(" — ");
                const dates = [e.start_date, e.end_date].filter(Boolean).join(" – ");
                return [title + (dates ? ` (${dates})` : ""), e.description]
                  .filter(Boolean)
                  .join("\n");
              })
              .join("\n\n")
          : "";
      sections.push({ heading: "Työkokemus", body: expBody });

      // Koulutus
      const eduBody =
        ctx.education.length > 0
          ? ctx.education
              .map((e) => {
                const degree = [e.degree, e.major].filter(Boolean).join(", ");
                const school = [e.school, e.year].filter(Boolean).join(" — ");
                return [degree, school].filter(Boolean).join("\n");
              })
              .join("\n\n")
          : "";
      sections.push({ heading: "Koulutus", body: eduBody });

      // Taidot
      sections.push({ heading: "Taidot", body: p?.skills ?? "" });

      content = { sections };
    } else if (data.type === "cover_letter") {
      const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "";
      content = {
        body: `Hyvä rekrytoija,\n\n[Kirjoita saatekirjeesi tähän. Kerro miksi olet kiinnostunut tehtävästä ja mitä arvoa tuot yritykselle.]\n\nYstävällisin terveisin,\n${name || "[Nimesi]"}`,
      };
    } else {
      // email
      const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "";
      content = {
        subject: "[Hakemus: Tehtävänimike — Yrityksenne]",
        body: `Hyvä rekrytoija,\n\n[Kirjoita sähköpostiviestisi teksti tähän. Esittele itsesi lyhyesti ja kerro kiinnostuksestasi avointa tehtävää kohtaan.]\n\nYstävällisin terveisin,\n${name || "[Nimesi]"}`,
      };
    }

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({ profile_id: userId, type: data.type, content, job_posting: null })
      .select("id")
      .single();

    if (error || !inserted) {
      return { ok: false as const, error: "Tallennus epäonnistui." };
    }

    return { ok: true as const, id: inserted.id };
  });
