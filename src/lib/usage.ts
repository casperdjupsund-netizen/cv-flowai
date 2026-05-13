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

// Free-tason raja: 3 dokumenttia/kk yhteensä (kaikki tyypit yhdessä)
export const FREE_LIMIT_PER_TYPE = 3;
export const FREE_MONTHLY_LIMIT = 3;

export interface UsageState {
  loading: boolean;
  tier: "free" | "pro";
  counts: Record<DocType, number>;
  monthlyTotal: number;
  canCreate: (type: DocType) => boolean;
  refresh: () => Promise<void>;
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
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
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const monthStart = startOfMonthISO();
    const [{ data: profile }, { data: docs }] = await Promise.all([
      supabase.from("profiles").select("subscription_tier").eq("id", user.id).maybeSingle(),
      supabase
        .from("documents")
        .select("type, created_at")
        .eq("profile_id", user.id)
        .gte("created_at", monthStart),
    ]);

    const t = (profile?.subscription_tier as "free" | "pro" | undefined) ?? "free";
    setTier(t);

    const next: Record<DocType, number> = { cv: 0, cover_letter: 0, email: 0 };
    let total = 0;
    for (const d of docs ?? []) {
      if (d.type && d.type in next) {
        next[d.type as DocType] += 1;
        total += 1;
      }
    }
    setCounts(next);
    setMonthlyTotal(total);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const canCreate = useCallback(
    (_type: DocType) => {
      if (tier === "pro") return true;
      return monthlyTotal < FREE_MONTHLY_LIMIT;
    },
    [tier, monthlyTotal],
  );

  return { loading, tier, counts, monthlyTotal, canCreate, refresh };
}
