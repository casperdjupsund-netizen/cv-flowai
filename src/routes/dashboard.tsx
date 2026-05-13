import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { FileText, Mail, Send, UserSquare2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Hallintapaneeli — CVFlow" }] }),
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-xl border border-border bg-surface p-8">
          <p className="text-sm text-muted-foreground">Tervetuloa,</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{user.email}</h1>
          <p className="mt-3 text-muted-foreground">
            Olet kirjautunut sisään. Profiilin täyttö, dokumenttien generointi ja editori
            tulevat seuraavissa päivityksissä.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Tulossa pian</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card icon={UserSquare2} title="Profiili" desc="Täytä henkilötiedot, työkokemus ja koulutus." />
            <Card icon={FileText} title="CV" desc="Generoi räätälöity ansioluettelo." />
            <Card icon={Mail} title="Saatekirje" desc="Henkilökohtainen saatekirje työilmoitukseen." />
            <Card icon={Send} title="Sähköposti" desc="Lyhyt yhteydenotto rekrytoijalle." />
          </div>
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> Etusivulle
        </Link>
      </main>
    </div>
  );
}

function Card({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 opacity-70">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
