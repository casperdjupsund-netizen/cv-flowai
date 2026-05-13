import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Päivitä Pro-versioon — CVFlow" }] }),
});

function UpgradePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Placeholder until Stripe-integraatio on käytössä — merkitsee käyttäjän testiksi Pro-tasolle.
  const handleUpgrade = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "pro" })
      .eq("id", user.id);
    if (error) {
      toast.error("Päivitys epäonnistui: " + error.message);
    } else {
      toast.success("Pro-versio aktivoitu (testitila)");
      navigate({ to: "/dashboard" });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const features = [
    "Rajaton määrä CV:itä",
    "Rajaton määrä saatekirjeitä",
    "Rajaton määrä rekrytointisähköposteja",
    "Kaikki tulevat ominaisuudet",
    "Peruuta milloin tahansa",
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin
        </Link>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Pro</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
            Ilmaiskokeilu täynnä
          </h1>
          <p className="mt-3 text-muted-foreground">
            Olet käyttänyt ilmaiset versiosi. Päivitä Pro-versioon jatkaaksesi rajatonta käyttöä.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-primary/40 bg-surface p-8 shadow-glow">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold">12,99 €</span>
            <span className="text-muted-foreground">/ kk</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Rajaton käyttö, peruuta milloin tahansa.</p>

          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <Button onClick={handleUpgrade} className="mt-8 w-full" size="lg">
            Päivitä Pro-versioon
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Maksuintegraatio (Stripe) lisätään myöhemmässä vaiheessa.
          </p>
        </div>
      </main>
    </div>
  );
}
