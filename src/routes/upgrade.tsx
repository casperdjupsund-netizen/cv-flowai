import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Päivitä Pro-versioon — CVFlow" }] }),
});

function UpgradePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const features = [
    "Rajaton määrä dokumentteja (CV, saatekirje, sähköposti)",
    "Dokumenttihistoria",
    "Kaikki dokumenttityypit",
    "Kaikki tulevat ominaisuudet",
    "Peruuta milloin tahansa",
  ];

  const priceId = interval === "monthly" ? "pro_monthly" : "pro_yearly";

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin
        </Link>

        {checkoutOpen ? (
          <div className="mt-8">
            <StripeEmbeddedCheckout
              priceId={priceId}
              userId={user.id}
              customerEmail={user.email ?? undefined}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Peruuta
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Pro</span>
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
                Avaa rajaton käyttö
              </h1>
              <p className="mt-3 text-muted-foreground">
                Luo niin monta CV:tä, saatekirjettä ja sähköpostia kuin tarvitset.
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-full border border-border bg-surface p-1">
                <button
                  onClick={() => setInterval("monthly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    interval === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Kuukausi
                </button>
                <button
                  onClick={() => setInterval("yearly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    interval === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Vuosi <span className="ml-1 text-xs opacity-80">−41%</span>
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary/40 bg-surface p-8 shadow-glow">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold">
                  {interval === "monthly" ? "14,99 €" : "99 €"}
                </span>
                <span className="text-muted-foreground">
                  / {interval === "monthly" ? "kk" : "v"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {interval === "yearly"
                  ? "Vastaa noin 8,25 €/kk. Säästä yli 40 % vuositilauksella."
                  : "Rajaton käyttö, peruuta milloin tahansa."}
              </p>

              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button onClick={() => setCheckoutOpen(true)} className="mt-8 w-full" size="lg">
                Päivitä Pro-versioon
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
