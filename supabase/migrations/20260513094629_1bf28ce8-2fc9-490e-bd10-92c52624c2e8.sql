ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro'));

CREATE INDEX IF NOT EXISTS idx_documents_profile_type ON public.documents(profile_id, type);