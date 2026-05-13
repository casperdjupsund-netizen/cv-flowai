import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import {
  formatProfileContextAsPrompt,
  type ProfileContext,
} from "@/lib/profile-context.functions";

const DocTypeSchema = z.enum(["cv", "cover_letter", "email"]);

const DemoProfileSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  job_title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.string().nullable(),
  ai_notes: z.string().nullable(),
});

const DemoExpSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  description: z.string().nullable(),
});

const DemoEduSchema = z.object({
  id: z.string(),
  school: z.string().nullable(),
  degree: z.string().nullable(),
  major: z.string().nullable(),
  year: z.string().nullable(),
});

const InputSchema = z.object({
  type: DocTypeSchema,
  job_posting: z.string().min(10).max(8000),
  profile: DemoProfileSchema,
  experience: z.array(DemoExpSchema).max(10),
  education: z.array(DemoEduSchema).max(10),
});

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
      .array(z.object({ heading: z.string().min(1), body: z.string().min(1) }))
      .min(3),
  }),
  cover_letter: z.object({ body: z.string().min(50) }),
  email: z.object({ subject: z.string().min(3), body: z.string().min(30) }),
} as const;

export type DemoResult =
  | { ok: true; type: "cv"; content: { sections: { heading: string; body: string }[] } }
  | { ok: true; type: "cover_letter"; content: { body: string } }
  | { ok: true; type: "email"; content: { subject: string; body: string } }
  | { ok: false; error: string };

export const generateDemoDocument = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DemoResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "AI-palvelu ei ole käytössä." };
    }

    const ctx: ProfileContext = {
      profile: data.profile,
      experience: data.experience,
      education: data.education,
      priorDocuments: [],
    };

    const profilePrompt = formatProfileContextAsPrompt(ctx);
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.0-flash");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: OutputSchemas[data.type] as never }),
        system: SYSTEM_PROMPTS[data.type],
        prompt: `KÄYTTÄJÄN PROFIILI:\n${profilePrompt}\n\nTYÖPAIKKAILMOITUS:\n${data.job_posting}\n\nLuo dokumentti, joka käyttää profiilin tietoja ja kohdistuu työpaikkailmoituksen vaatimuksiin.`,
      });

      return {
        ok: true,
        type: data.type,
        content: output as never,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tuntematon virhe";
      if (message.includes("429")) {
        return { ok: false, error: "AI on ruuhkautunut. Yritä hetken päästä uudelleen." };
      }
      if (message.includes("402")) {
        return { ok: false, error: "AI-krediitit lopussa." };
      }
      console.error("generateDemoDocument error:", err);
      return { ok: false, error: "Generointi epäonnistui: " + message };
    }
  });
