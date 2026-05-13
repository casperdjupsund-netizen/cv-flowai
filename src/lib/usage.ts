import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export type DocType = "cv" | "cover_letter" | "email";

export const DOC_TYPES: DocType[] = ["cv", "cover_letter", "email"];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  cv: "CV",
  cover_letter: "Saatekirje",
  email: "Rekrytointisähköposti",
};

export const FREE_LIMIT_PER_TYPE = 1;

export interface UsageState {
  loading: boolean;
  tier: "free" | "pro";
  counts: Record<DocType, number>;
  canCreate: (type: DocType) => boolean;
  refresh: () => Promise<void>;
}

export function useDocumentUsage(): UsageState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [counts, setCounts] = useState<Record<DocType, number>>({
    cv: 0,
    cover_letter: 0,
    email: 0,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: profile }, { data: docs }] = await Promise.all([
      supabase.from("profiles").select("subscription_tier").eq("id", user.id).maybeSingle(),
      supabase.from("documents").select("type").eq("profile_id", user.id),
    ]);

    const t = (profile?.subscription_tier as "free" | "pro" | undefined) ?? "free";
    setTier(t);

    const next: Record<DocType, number> = { cv: 0, cover_letter: 0, email: 0 };
    for (const d of docs ?? []) {
      if (d.type && d.type in next) next[d.type as DocType] += 1;
    }
    setCounts(next);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const canCreate = useCallback(
    (type: DocType) => {
      if (tier === "pro") return true;
      return (counts[type] ?? 0) < FREE_LIMIT_PER_TYPE;
    },
    [tier, counts],
  );

  return { loading, tier, counts, canCreate, refresh };
}
