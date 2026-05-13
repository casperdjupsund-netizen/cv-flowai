ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_notes text;

COMMENT ON COLUMN public.profiles.ai_notes IS 'Käyttäjän vapaat muistiinpanot AI:lle: tyyli, painotukset, asiat joita välttää.';