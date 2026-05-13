export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} CVFlow. Tehty Suomessa.</p>
        <p>Tekoälypohjainen työnhaun työkalu.</p>
      </div>
    </footer>
  );
}
