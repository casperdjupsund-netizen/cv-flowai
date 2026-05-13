import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [proActive, setProActive] = useState(false);

  useEffect(() => {
    const el = document.getElementById("pro");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setProActive(entry.isIntersecting),
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CVFLOW" className="h-9 w-9 invert" />
          <span className="font-display text-lg font-bold tracking-tight">CVFLOW</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            hash="pro"
            data-active={proActive ? "true" : undefined}
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition sm:inline-flex ${
              proActive
                ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                : "text-primary hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition ${
                proActive ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-primary/40"
              }`}
            />
            CVFLOW PRO
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              −45%
            </span>
          </Link>
          <Link
            to="/demo"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            Kokeile demo
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-sm px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                Hallintapaneeli
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-surface-elevated"
              >
                Kirjaudu ulos
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-sm px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                Kirjaudu
              </Link>
              <Link
                to="/signup"
                className="rounded-sm bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:shadow-glow"
              >
                Aloita ilmaiseksi
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
