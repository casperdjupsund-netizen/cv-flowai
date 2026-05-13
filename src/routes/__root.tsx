import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">Sivua ei löytynyt.</p>
        <Link to="/" className="mt-6 inline-block rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Etusivulle
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Jokin meni pieleen</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Yritä uudelleen
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CVFlow — Tekoälypohjainen CV-työkalu" },
      { name: "description", content: "Täytä profiilisi kerran. Liitä työilmoitus. Tekoäly kirjoittaa räätälöidyn CV:n, saatekirjeen tai sähköpostin sekunneissa." },
      { property: "og:title", content: "CVFlow — Tekoälypohjainen CV-työkalu" },
      { property: "og:description", content: "Täytä profiilisi kerran. Liitä työilmoitus. Tekoäly kirjoittaa räätälöidyn CV:n, saatekirjeen tai sähköpostin sekunneissa." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "CVFlow — Tekoälypohjainen CV-työkalu" },
      { name: "twitter:description", content: "Täytä profiilisi kerran. Liitä työilmoitus. Tekoäly kirjoittaa räätälöidyn CV:n, saatekirjeen tai sähköpostin sekunneissa." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/JG2m5Jq1UegJNynwLeRSt4C06I62/social-images/social-1778673606875-m.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/JG2m5Jq1UegJNynwLeRSt4C06I62/social-images/social-1778673606875-m.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
