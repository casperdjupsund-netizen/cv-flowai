import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import {
  formatProfileContextAsPrompt,
  loadProfileContext,
} from "@/lib/profile-context.functions";

const DocTypeSchema = z.enum(["cv", "cover_letter", "email"]);

const InputSchema = z.object({
  type: DocTypeSchema,
  job_posting: z.string().min(1).max(8000),
});

const FREE_LIMIT_PER_TYPE = 1;

const SYSTEM_PROMPTS: Record<z.infer<typeof DocTypeSchema>, string> = {
  cv: `Olet ammattitaitoinen suomalainen rekrytointiasiantuntija ja CV-kirjoittaja.
Luo selkeä, ytimekäs ja työpaikkailmoitukseen räätälöity CV käyttäjän profiilin perusteella.
Käytä luonnollista suomen kieltä. Älä keksi tietoja, joita profiilissa ei ole.
Korosta niitä taitoja ja kokemuksia, jotka vastaavat työpaikkailmoitusta.`,
  cover_letter: `Olet ammattitaitoinen suomalainen rekrytointiasiantuntija ja saatekirjeiden kirjoittaja.
Luo henkilökohtainen, ammatillinen ja työpaikkailmoitukseen räätälöity saatekirje käyttäjän profiilin perusteella.
Käytä luonnollista suomen kieltä. Pidä pituus 250–400 sanassa. Älä keksi tietoja, joita profiilissa ei ole.`,
  email: `Olet ammattitaitoinen suomalainen rekrytointiasiantuntija.
Luo lyhyt ja kohtelias rekrytointisähköposti, jossa hakija esittäytyy ja ilmaisee kiinnostuksensa avoimesta paikasta.
Käytä luonnollista suomen kieltä. Pidä pituus tiiviinä (150–250 sanaa).`,
};

const OutputSchemas = {
  cv: z.object({
    sections: z
      .array(
        z.object({
          heading: z.string().min(1),
          body: z.string().min(1),
        }),
      )
      .min(3),
  }),
  cover_letter: z.object({
    body: z.string().min(50),
  }),
  email: z.object({
    subject: z.string().min(3),
    body: z.string().min(30),
  }),
} as const;

export const generateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI-palvelu ei ole käytössä." };
    }

    // 1. Tarkista käyttöraja (free tier: 1 / tyyppi)
    const [{ data: profileTier }, { count }] = await Promise.all([
      supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId)
        .eq("type", data.type),
    ]);

    const tier = (profileTier?.subscription_tier as "free" | "pro") ?? "free";
    if (tier === "free" && (count ?? 0) >= FREE_LIMIT_PER_TYPE) {
      return {
        ok: false as const,
        error: "Olet käyttänyt ilmaisen versiosi tästä dokumenttityypistä.",
        upgrade: true,
      };
    }

    // 2. Hae profiilikonteksti samalla logiikalla kuin getProfileContext
    const ctx = await loadProfileContext(supabase, userId);

    if (!ctx.profile?.first_name && !ctx.profile?.last_name) {
      return {
        ok: false as const,
        error: "Täytä ensin profiilisi perustiedot.",
      };
    }

    const profilePrompt = formatProfileContextAsPrompt(ctx);

    // 3. Generoi
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: OutputSchemas[data.type] as never }),
        system: SYSTEM_PROMPTS[data.type],
        prompt: `KÄYTTÄJÄN PROFIILI:\n${profilePrompt}\n\nTYÖPAIKKAILMOITUS:\n${data.job_posting}\n\nLuo dokumentti, joka käyttää profiilin tietoja ja kohdistuu työpaikkailmoituksen vaatimuksiin.`,
      });

      // 4. Tallenna documents-tauluun
      const { data: inserted, error: insertError } = await supabase
        .from("documents")
        .insert({
          profile_id: userId,
          type: data.type,
          content: JSON.parse(JSON.stringify(output)),
          job_posting: data.job_posting,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return { ok: false as const, error: "Tallennus epäonnistui." };
      }

      return { ok: true as const, id: inserted.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tuntematon virhe";
      // AI Gateway -virheet
      if (message.includes("429")) {
        return { ok: false as const, error: "AI on ruuhkautunut. Yritä hetken päästä uudelleen." };
      }
      if (message.includes("402")) {
        return { ok: false as const, error: "AI-krediitit lopussa. Lisää krediittejä työtilaan." };
      }
      console.error("generateDocument error:", err);
      return { ok: false as const, error: "Generointi epäonnistui: " + message };
    }
  });
