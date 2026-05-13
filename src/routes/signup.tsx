import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Rekisteröidy — CVFlow" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tili luotu! Tarkista sähköpostisi vahvistusta varten.");
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Luo tili" subtitle="Aloita ilmainen kokeilu — ei luottokorttia.">
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Sähköposti" type="email" value={email} onChange={setEmail} autoComplete="email" required />
      <Field label="Salasana" type="password" value={password} onChange={setPassword} autoComplete="new-password" required minLength={6} />
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:shadow-glow disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Rekisteröidy
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Onko sinulla jo tili?{" "}
      <Link to="/login" className="text-primary hover:underline">Kirjaudu sisään</Link>
    </p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background grain-bg">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold">CVFlow</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Etusivulle
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, type, value, onChange, ...rest
}: { label: string; type: string; value: string; onChange: (v: string) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-input px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...rest}
      />
    </label>
  );
}
