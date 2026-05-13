import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CVFLOW" className="h-9 w-9 invert" />
          <span className="font-display text-lg font-bold tracking-tight">CVFLOW</span>
        </Link>
        <nav className="flex items-center gap-2">
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
